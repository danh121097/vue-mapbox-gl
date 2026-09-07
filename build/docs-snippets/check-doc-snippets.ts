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
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { relative, resolve } from 'node:path';
import { extractFromFile, type Snippet } from './extract-doc-snippets';
import {
  extractEventsLike,
  extractEventTables,
  extractParameterTables,
  extractPropTables,
  extractSlotTables,
  extractTablesFromFile,
  listComposablesFromFile,
} from './extract-doc-tables';
import { extractDocumentedTypesFromFile } from './extract-doc-types';
import {
  componentExports,
  packageExports,
  parameterNames,
  typeParameters,
} from './package-exports';
import { checkLinks } from './check-doc-links';
import { checkNames } from './check-doc-names';
import { checkDefaults } from './check-doc-defaults';
import { checkPropEmitCollisions } from './check-prop-emit-collisions';
import { checkReferences } from './check-doc-references';
import { diagnosticCode, isReported, summarize } from './reported-diagnostics';
import { extractTemplateAttributes } from './extract-template-attributes';
import {
  attributeSnippet,
  componentCoverageSnippet,
  componentTableSnippet,
  coverageSnippet,
  documentedTypeSnippet,
  parametersSnippet,
  slotSnippet,
  tableSnippet,
  writeSnippetProject,
} from './snippet-project';

const rootDir = resolve(import.meta.dirname, '../..');
const workDir = resolve(rootDir, '.doc-snippets');
const strictDir = resolve(rootDir, '.doc-snippets-strict');
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

/**
 * Pages whose Returns tables are compiled as well as their code blocks: any
 * page that has a `Returns` heading at all, which is the page claiming to
 * document a return. A hardcoded list would silently stop covering a second
 * reference page the day someone adds one.
 */
const RETURNS_HEADING = /^#{2,5}\s+Returns\s*$/m;
const TABLE_PAGES = markdownFiles(resolve(rootDir, 'docs')).filter((path) =>
  RETURNS_HEADING.test(readFileSync(path, 'utf8')),
);

let tableCount = 0;
let parameterCount = 0;
let coverageCount = 0;
let untabledCount = 0;
for (const path of TABLE_PAGES) {
  const page = relative(rootDir, path);
  const tables = extractTablesFromFile(path);

  // A section can hold more than one table for the same composable -- a shared
  // one and a labelled one -- and they share a `Returns` heading line, so the
  // filename needs the ordinal to stay unique.
  const seen = new Map<string, number>();
  const generics = typeParameters(rootDir);
  for (const table of tables) {
    const nth = (seen.get(table.composable) ?? 0) + 1;
    seen.set(table.composable, nth);
    snippets.push(
      tableSnippet(
        { ...table, file: page },
        nth,
        generics.get(table.composable),
      ),
    );
    tableCount++;
  }

  // A `Parameters` table is checked by making the call it describes. The rows
  // are an input, so nothing about the return type would catch them.
  const seenParameters = new Map<string, number>();
  const declared = parameterNames(rootDir);
  for (const table of extractParameterTables(
    page,
    readFileSync(path, 'utf8'),
  )) {
    const nth = (seenParameters.get(table.composable) ?? 0) + 1;
    seenParameters.set(table.composable, nth);
    snippets.push(
      parametersSnippet(
        table,
        declared.get(table.composable),
        nth,
        generics.get(table.composable),
      ),
    );
    parameterCount += table.fields.length;
  }

  // Completeness is per composable, not per table: a section documenting two
  // composables at once has a shared table and a labelled one each, so neither
  // table alone is the full list for either composable. A composable with no
  // table at all -- its return described in a sentence -- lands here with an
  // empty list, which is the same check saying it has no fields to get wrong.
  const rowsFor = new Map<string, string[]>();
  const spreadsFor = new Map<string, string[]>();
  const lineFor = new Map<string, number>();
  for (const table of tables) {
    const documented = rowsFor.get(table.composable) ?? [];
    documented.push(...table.fields.map((field) => field.name));
    rowsFor.set(table.composable, documented);
    spreadsFor.set(table.composable, table.spreads);
    lineFor.set(
      table.composable,
      Math.min(lineFor.get(table.composable) ?? Infinity, table.headingLine),
    );
  }

  for (const { name, line } of listComposablesFromFile(path)) {
    coverageCount++;
    if (!rowsFor.has(name)) untabledCount++;
    snippets.push(
      coverageSnippet({
        file: page,
        composable: name,
        line: lineFor.get(name) ?? line,
        documented: [...new Set(rowsFor.get(name) ?? [])],
        spreads: spreadsFor.get(name) ?? [],
      }),
    );
  }
}

// The types reference transcribes `libs/types` by hand. Each documented type
// is compared with the exported one, because a transcript drifts and nothing
// else here would notice.
let typeCount = 0;
const exported = packageExports(rootDir);
for (const path of markdownFiles(resolve(rootDir, 'docs/api'))) {
  const page = relative(rootDir, path);
  for (const type of extractDocumentedTypesFromFile(path)) {
    snippets.push(documentedTypeSnippet(page, type, exported));
    typeCount++;
  }
}

// The components reference tabulates each component's props and events the way
// the composables one tabulates returns, and the same thing is true of both: a
// row is prose until something compiles it. `source-id` sat in one of these
// tables for the life of the page.
const components = componentExports(rootDir);
const componentNameRe = new RegExp(
  `\\b(?:${[...components].join('|')})\\b`,
  'g',
);
const componentsPage = resolve(rootDir, 'docs/api/components.md');
const componentsSource = readFileSync(componentsPage, 'utf8');
const componentsPath = relative(rootDir, componentsPage);

let propCount = 0;
let eventCount = 0;
const propsFor = new Map<string, string[]>();
const eventsFor = new Map<string, string[]>();
const componentLine = new Map<string, number>();

for (const [kind, tables] of [
  [
    'props',
    extractPropTables(componentsPath, componentsSource, componentNameRe),
  ],
  [
    'events',
    extractEventTables(componentsPath, componentsSource, componentNameRe),
  ],
] as const) {
  for (const table of tables) {
    snippets.push(componentTableSnippet(table, kind));
    const into = kind === 'props' ? propsFor : eventsFor;
    into.set(table.composable, [
      ...(into.get(table.composable) ?? []),
      ...table.fields.map((field) => field.name),
    ]);
    componentLine.set(
      table.composable,
      Math.min(
        componentLine.get(table.composable) ?? Infinity,
        table.headingLine,
      ),
    );
    if (kind === 'props') propCount += table.fields.length;
    else eventCount += table.fields.length;
  }
}

// Slots carry no types, so both directions are names: a row must name a slot
// the component renders, and a slot it renders must have a row. A misspelled
// slot is silent at runtime -- the content simply never appears.
let slotCount = 0;
for (const table of extractSlotTables(
  componentsPath,
  componentsSource,
  componentNameRe,
)) {
  snippets.push(slotSnippet(table));
  slotCount += table.fields.length;
}

const eventsLike = extractEventsLike(componentsSource, componentNameRe);
for (const component of components) {
  snippets.push(
    componentCoverageSnippet({
      file: componentsPath,
      component,
      line: componentLine.get(component) ?? 1,
      props: [...new Set(propsFor.get(component) ?? [])],
      events: [...new Set(eventsFor.get(component) ?? [])],
      eventsLike: eventsLike.get(component) ?? [],
    }),
  );
}

// Vue lets an unknown attribute fall through to the root element, so a
// misspelled prop compiles. Each example's attributes are asserted separately.
let attributeCount = 0;
let blockCount = 0;

for (const path of pages) {
  const { snippets: found, skipped } = extractFromFile(path);
  for (const snippet of found) {
    const lifted = { ...snippet, file: relative(rootDir, snippet.file) };
    if (!lifted.markupOnly) {
      snippets.push(lifted);
      blockCount++;
    }
    if (lifted.ext !== '.vue') continue;
    const attributes = extractTemplateAttributes(lifted.code, components);
    if (!attributes.length) continue;
    snippets.push(attributeSnippet(lifted, attributes));
    attributeCount += attributes.length;
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

// The generated Returns checks get a second, stricter pass. The main project
// runs with `strict` off so hand-written examples are not drowned in
// diagnostics about their own placeholders -- but that also collapses
// `Foo | null` into `Foo`, which is exactly the mistake a Returns table is
// likeliest to make. Generated assertions have no placeholders to protect, so
// they are compiled again with `strictNullChecks` on.
rmSync(strictDir, { recursive: true, force: true });
mkdirSync(strictDir, { recursive: true });
writeSnippetProject(
  strictDir,
  snippets.filter((snippet) => snippet.lineMap),
  { strictNullChecks: true },
).forEach((snippet, name) => byGeneratedName.set(name, snippet));

// Not a documentation claim, but the defect it catches hid behind one: a prop
// that shadows its own emit leaves both the Props and the Events table
// describing something real, and only the component misbehaves.
const collisions = checkPropEmitCollisions(rootDir);

// The `Default` column, which is the one claim in the reference that the built
// declarations cannot settle: they carry a default's type and never its value.
const defaults = checkDefaults(rootDir, componentNameRe);

console.log(
  `Checking ${blockCount} code ` +
    `blocks from docs/ and the READMEs (${skippedCount} skipped), plus ` +
    `${tableCount} Returns tables, ${parameterCount} documented ` +
    `parameters, the return completeness of ` +
    `${coverageCount} composables` +
    (untabledCount
      ? ` (${untabledCount} of which describe their return in prose)`
      : '') +
    `, ${typeCount} documented types, ${propCount} component props, ` +
    `${eventCount} component events, ${slotCount} component slots, ` +
    `the prop/emit names of ${collisions.checked} components, ` +
    `${defaults.compared} documented defaults` +
    (defaults.skipped
      ? ` (${defaults.skipped} described in prose rather than given a value)`
      : '') +
    `, and ` +
    `${attributeCount} component ` +
    `attributes in the markup examples.`,
);

function compile(dir: string): string {
  try {
    execFileSync(
      'bunx',
      [
        'vue-tsc',
        '--noEmit',
        '--pretty',
        'false',
        '-p',
        resolve(dir, 'tsconfig.json'),
      ],
      { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return '';
  } catch (error) {
    // vue-tsc exits non-zero when it reports anything; the diagnostics are on
    // stdout, and the filter below decides which of them matter.
    const err = error as { stdout?: string; stderr?: string };
    return `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
}

const output = `${compile(workDir)}\n${compile(strictDir)}`;

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

  const snippet = byGeneratedName.get(match[1]!);
  // The curated allowlist exists to tolerate hand-written examples, which lean
  // on inference and on names the surrounding application owns. Generated
  // assertions have no such excuse, so every diagnostic in one counts --
  // otherwise a mismatched type in a Returns table would be dropped as an
  // assignability failure and the check would pass without checking.
  const generated = Boolean(snippet?.lineMap);
  // A syntax error is always fatal, whatever it is: TypeScript stops before
  // the semantic pass when a program has any, so one malformed block would
  // silently switch off the entire check for every other block.
  if (!generated && code >= 2000 && !isReported(code, full)) continue;
  if (!snippet) {
    unmapped++;
    reported.push({ location: match[1]!, message: summarize(full) });
    continue;
  }
  // A generated table check carries its own map; a lifted fence does not need
  // one, because its line N is the fence line plus N.
  const generatedLine = Number(match[2]);
  const markdownLine =
    snippet.lineMap?.[generatedLine - 1] ?? snippet.fenceLine + generatedLine;
  reported.push({
    location: `${snippet.file}:${markdownLine}:${match[3]}`,
    message: summarize(full),
  });
}

// A generated snippet is compiled twice, so anything wrong for a reason other
// than nullability is reported by both passes.
// Links and names are prose, and prose is where the last several
// documentation bugs lived.
/**
 * Every corpus the summary line counts, and the sentence that says what an
 * empty one means. A count of zero is the one result that reads exactly like a
 * clean run: nothing was wrong because nothing was looked at. The whole point
 * of printing these numbers is that a person notices when one collapses -- and
 * a person reading CI output is not a check, so the numbers are asserted.
 */
const CORPORA: [string, number, string][] = [
  ['code blocks', blockCount, 'no fenced block was extracted from docs/'],
  ['Returns tables', tableCount, 'no Returns heading was matched'],
  [
    'documented parameters',
    parameterCount,
    'no Parameters heading was matched',
  ],
  ['composable returns', coverageCount, 'no composable return was compared'],
  ['documented types', typeCount, 'no type alias was matched'],
  ['component props', propCount, 'no Props heading was matched'],
  ['component events', eventCount, 'no Events heading was matched'],
  ['component slots', slotCount, 'no Slots heading was matched'],
  [
    'prop/emit names',
    collisions.checked,
    'no built component declaration was read -- has `bun run build` run?',
  ],
  ['documented defaults', defaults.compared, 'no Default column was compared'],
  [
    'markup attributes',
    attributeCount,
    'no component tag was found in any example',
  ],
];
for (const [corpus, count, why] of CORPORA) {
  if (count > 0) continue;
  reported.push({
    location: 'build/docs-snippets/check-doc-snippets.ts',
    message: `error: the ${corpus} check read nothing — ${why}`,
  });
}

reported.push(...collisions.problems);
reported.push(...defaults.problems);

reported.push(...checkLinks(pages, rootDir));
reported.push(...checkNames(pages, rootDir, exported));
reported.push(
  ...checkReferences(pages, rootDir, {
    components: components.size,
    composables: [...exported].filter((name) => /^use[A-Z]/.test(name)).length,
  }),
);

const seenProblem = new Set<string>();
const problems = reported.filter((problem) =>
  seenProblem.has(`${problem.location} ${problem.message}`)
    ? false
    : seenProblem.add(`${problem.location} ${problem.message}`) && true,
);
reported.length = 0;
reported.push(...problems);

if (!keep) {
  rmSync(workDir, { recursive: true, force: true });
  rmSync(strictDir, { recursive: true, force: true });
}

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
