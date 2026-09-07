/**
 * Type-checks every TypeScript, JavaScript and Vue code block in `docs/`
 * against the package's own build output.
 *
 * Checks that read the docs for names — does this composable exist, is this
 * prop spelled right — only ever prove that a string appears in two places.
 * They cannot catch a snippet that imports a real symbol and then calls it with
 * the wrong arguments, destructures a field the return type does not have, or
 * passes `source-id` to a component whose prop is `id`. Every one of those has
 * been in these docs.
 *
 * So each block is written out as a real module and compiled by `vue-tsc`
 * against `dist/`, resolving `vue3-maplibre-gl` exactly the way an installing
 * consumer's bundler would. A block that does not compile is a block a reader
 * cannot run.
 *
 * Usage: check-doc-snippets.ts [--keep]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { extractFromFile, type Snippet } from './extract-doc-snippets';
import { diagnosticCode, isReported, summarize } from './reported-diagnostics';
import { writeSnippetProject } from './snippet-project';

const rootDir = resolve(import.meta.dirname, '../..');
const workDir = resolve(rootDir, '.doc-snippets');
const keep = process.argv.includes('--keep');

if (!existsSync(resolve(rootDir, 'dist/index.d.ts'))) {
  console.error(
    'dist/index.d.ts is missing. The docs are checked against the built public\n' +
      'surface, not against libs/, so the build has to run first:\n\n' +
      '  bun run build\n',
  );
  process.exit(1);
}

/** Every markdown page under docs/, including the ones srcExclude keeps off the site. */
function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    if (entry.name === '.vitepress' || entry.name === 'node_modules') return [];
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

const snippets: Snippet[] = [];
let skippedCount = 0;
const skipReasons: string[] = [];

// Both READMEs are checked too: they are the first code most people see, and
// npm renders the root one on the package page.
const pages = [
  ...markdownFiles(resolve(rootDir, 'docs')),
  resolve(rootDir, 'README.md'),
  resolve(rootDir, 'nuxt/README.md'),
];

for (const path of pages) {
  const { snippets: found, skipped } = extractFromFile(path);
  for (const snippet of found) {
    snippets.push({ ...snippet, file: relative(rootDir, snippet.file) });
  }
  skippedCount += skipped.length;
  for (const skip of skipped) {
    skipReasons.push(
      `  ${relative(rootDir, skip.file)}:${skip.fenceLine} — ${skip.reason}`,
    );
  }
}

rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });

const byGeneratedName = writeSnippetProject(workDir, snippets);

console.log(
  `Checking ${snippets.length} code blocks from docs/ and the READMEs (${skippedCount} skipped).`,
);

let output = '';
try {
  execFileSync(
    'bunx',
    [
      'vue-tsc',
      '--noEmit',
      '--pretty',
      'false',
      '-p',
      resolve(workDir, 'tsconfig.json'),
    ],
    { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
} catch (error) {
  // vue-tsc exits non-zero when it reports anything; the diagnostics are on
  // stdout, and the filter below decides which of them matter.
  const err = error as { stdout?: string; stderr?: string };
  output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
}

/**
 * Rewrites `.doc-snippets/guide-basic-usage-42.vue(7,3): error TS2345: ...`
 * into the markdown line the reader would actually open. A snippet file's line
 * N is the fence line plus N, because nothing is prepended when writing them.
 */
const DIAGNOSTIC_RE = /^(?:.*[/\\])?([\w.-]+)\((\d+),(\d+)\):\s*(.*)$/;

interface Reported {
  location: string;
  message: string;
}

const reported: Reported[] = [];
let unmapped = 0;

/**
 * A diagnostic is its first line plus every indented line after it. The
 * continuation lines carry the explanation — "Property 'sourceId' does not
 * exist on type ..." — which is what decides whether an assignability failure
 * is a misspelled name or just inference widening a literal.
 */
const lines = output.split('\n');
for (let i = 0; i < lines.length; i++) {
  const match = DIAGNOSTIC_RE.exec(lines[i]!);
  if (!match) continue;

  let full = match[4]!;
  while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1]!)) {
    full += ` ${lines[++i]!.trim()}`;
  }

  const code = diagnosticCode(full);
  if (code === null) continue;
  // A syntax error is always fatal, whatever it is: TypeScript stops before
  // the semantic pass when a program has any, so one malformed block would
  // silently switch off the entire check for every other block.
  if (code >= 2000 && !isReported(code, full)) continue;

  const snippet = byGeneratedName.get(match[1]!);
  if (!snippet) {
    unmapped++;
    reported.push({ location: match[1]!, message: summarize(full) });
    continue;
  }
  reported.push({
    location: `${snippet.file}:${snippet.fenceLine + Number(match[2])}:${match[3]}`,
    message: summarize(full),
  });
}

if (!keep) rmSync(workDir, { recursive: true, force: true });

if (!reported.length) {
  console.log('Every checked block names only things that exist in dist/.');
  if (skipReasons.length) console.log(`\nSkipped:\n${skipReasons.join('\n')}`);
  process.exit(0);
}

const MAX_MESSAGE = 160;
console.error('');
for (const { location, message } of reported) {
  const text =
    message.length > MAX_MESSAGE
      ? `${message.slice(0, MAX_MESSAGE)}…`
      : message;
  console.error(`${location} — ${text}`);
}
console.error(
  `\n${reported.length} problem(s) in docs code blocks.` +
    (unmapped ? ` ${unmapped} could not be traced back to a block.` : '') +
    `\n\nRerun with --keep to inspect the generated project in .doc-snippets/.` +
    `\nFix the block, or mark it with an HTML comment on the line above its fence:` +
    `\n  <!-- snippet-skip: why this block cannot compile -->\n`,
);
process.exit(1);
