/**
 * Checks the things the docs point at that live outside the type system: the
 * package scripts a reader is told to run, and the built files they are told
 * to load.
 *
 * A `bash` fence is never handed to the compiler, so `bun run docs:chekc` would
 * read as fine forever; so would a `<script src>` naming a bundle this build
 * stopped emitting. Both are instructions a reader follows literally.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

export interface ReferenceProblem {
  location: string;
  message: string;
}

/**
 * A count the docs advertise: "10 components, 38 composables". Both numbers
 * are on the npm page and the docs home page, and both go stale silently the
 * next time one is added.
 */
const COUNT_RE = /\ball\s+(\d+)\s+(components?|composables?)\b/gi;

/** The paired form the npm page and the docs home page both use. */
const PAIR_RE = /\b(\d+)\s+components,\s*(\d+)\s+composables\b/g;

/** `bun run build`, `npm run docs:dev` — a script the reader is told to run. */
const SCRIPT_RE = /\b(?:bun|npm|pnpm|yarn)\s+run\s+([a-z0-9:_-]+)/g;

/**
 * A path into this package's own build output, however it is spelled: an
 * import specifier (`vue3-maplibre-gl/dist/style.css`) or a CDN URL
 * (`unpkg.com/vue3-maplibre-gl@latest/dist/index.umd.cjs`). MapLibre's own
 * `dist/` paths are left alone; they are not this build's to keep true.
 */
const DIST_RE = /vue3-maplibre-gl(?:@[^/\s]+)?\/(dist\/[A-Za-z0-9._/-]+)/g;

/**
 * The size of the test suite, as the overview states it. The number that was
 * there said 107 across 19 files while the suite had grown to 31, which is the
 * ordinary fate of a hand-maintained count. Only the file count is asserted:
 * it is a glob, whereas the number of assertions is only knowable by running
 * them, and a check that has to run the suite to read the docs is not a check
 * anyone will keep.
 */
const TEST_FILE_COUNT_RE = /\b(\d+)\s+test\s+files\b/g;

/** Every `*.test.ts` under a `__tests__` directory, which is where they live. */
function testFileCount(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) total += testFileCount(path);
    else if (entry.name.endsWith('.test.ts')) total++;
  }
  return total;
}

function scriptsOf(file: string): Set<string> {
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as {
    scripts?: Record<string, string>;
  };
  return new Set(Object.keys(manifest.scripts ?? {}));
}

export function checkReferences(
  pages: string[],
  rootDir: string,
  counts: { components: number; composables: number },
): ReferenceProblem[] {
  const problems: ReferenceProblem[] = [];
  const testFiles = testFileCount(rootDir);
  // Either manifest's scripts: the nuxt README documents the module, but its
  // release steps are run from the repository root and say so.
  const scripts = new Set([
    ...scriptsOf(resolve(rootDir, 'package.json')),
    ...(existsSync(resolve(rootDir, 'nuxt/package.json'))
      ? scriptsOf(resolve(rootDir, 'nuxt/package.json'))
      : []),
  ]);

  for (const file of pages) {
    const here = relative(rootDir, file);

    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        const at = `${here}:${index + 1}`;

        for (const match of line.matchAll(SCRIPT_RE)) {
          if (scripts.has(match[1]!)) continue;
          problems.push({
            location: at,
            message: `error: no package script named '${match[1]}'`,
          });
        }

        // Said, noun, actual, and the verb that reads right for it: a count
        // of exports is something the package exports, a count of test files
        // something the repository has.
        const claimed: [string, string, number, string][] = [
          ...[...line.matchAll(COUNT_RE)].map(
            (match): [string, string, number, string] => [
              match[1]!,
              match[2]!,
              match[2]!.toLowerCase().startsWith('component')
                ? counts.components
                : counts.composables,
              'the package exports',
            ],
          ),
          ...[...line.matchAll(PAIR_RE)].flatMap(
            (match): [string, string, number, string][] => [
              [
                match[1]!,
                'components',
                counts.components,
                'the package exports',
              ],
              [
                match[2]!,
                'composables',
                counts.composables,
                'the package exports',
              ],
            ],
          ),
          ...[...line.matchAll(TEST_FILE_COUNT_RE)].map(
            (match): [string, string, number, string] => [
              match[1]!,
              'test files',
              testFiles,
              'the repository has',
            ],
          ),
        ];
        for (const [said, noun, actual, verb] of claimed) {
          if (Number(said) === actual) continue;
          problems.push({
            location: at,
            message: `error: the docs say ${said} ${noun}, ${verb} ${actual}`,
          });
        }

        for (const match of line.matchAll(DIST_RE)) {
          if (existsSync(resolve(rootDir, match[1]!))) continue;
          problems.push({
            location: at,
            message: `error: the build emits no '${match[1]}'`,
          });
        }
      });
  }

  return problems;
}
