/**
 * Checks the things the docs point at that live outside the type system: the
 * package scripts a reader is told to run, and the built files they are told
 * to load.
 *
 * A `bash` fence is never handed to the compiler, so `bun run docs:chekc` would
 * read as fine forever; so would a `<script src>` naming a bundle this build
 * stopped emitting. Both are instructions a reader follows literally.
 */
import { existsSync, readFileSync } from 'node:fs';
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

        const claimed: [string, string, number][] = [
          ...[...line.matchAll(COUNT_RE)].map(
            (match): [string, string, number] => [
              match[1]!,
              match[2]!,
              match[2]!.toLowerCase().startsWith('component')
                ? counts.components
                : counts.composables,
            ],
          ),
          ...[...line.matchAll(PAIR_RE)].flatMap(
            (match): [string, string, number][] => [
              [match[1]!, 'components', counts.components],
              [match[2]!, 'composables', counts.composables],
            ],
          ),
        ];
        for (const [said, noun, actual] of claimed) {
          if (Number(said) === actual) continue;
          problems.push({
            location: at,
            message:
              `error: the docs say ${said} ${noun}, the package ` +
              `exports ${actual}`,
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
