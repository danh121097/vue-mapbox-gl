/**
 * Refuses to let `publish:nuxt` proceed until the `vue3-maplibre-gl` range
 * that `nuxt/package.json` depends on is actually resolvable on npm.
 *
 * The Nuxt module depends on the root package by version range, and both are
 * released from this repository. If the module is published first, its
 * `bun install` fails against the registry — or, worse, an operator "fixes"
 * that by widening the range and ships a module that installs the previous
 * major. The only safe order is root package first, then the module, and this
 * check makes that order mechanical instead of remembered.
 *
 * This check asks npm directly, while the `bun install` it guards asks bun's
 * cached registry manifest — two sources of truth, and releasing 6.1.0 found
 * the gap between them: npm served the new version seconds after publishing
 * while bun still held a manifest that had never seen it, so this check passed
 * and the install right after it failed with "No version matching". That is why
 * `publish:nuxt` runs `bun install --no-cache`. Do not drop the flag to save
 * the download; it is what makes this check's answer the one the install uses.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PACKAGE = 'vue3-maplibre-gl';

const nuxtManifestPath = resolve(import.meta.dirname, '../nuxt/package.json');
const nuxtManifest = JSON.parse(readFileSync(nuxtManifestPath, 'utf8')) as {
  dependencies?: Record<string, string>;
};

const range = nuxtManifest.dependencies?.[PACKAGE];
if (!range) {
  console.error(`nuxt/package.json does not list ${PACKAGE} in dependencies.`);
  process.exit(1);
}

let published: string[] = [];
try {
  const out = execFileSync(
    'npm',
    ['view', `${PACKAGE}@${range}`, 'version', '--json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
  // `npm view` prints a JSON string for exactly one match and a JSON array for
  // several; an empty body has been observed on older clients for no match.
  if (out) {
    const parsed = JSON.parse(out) as string | string[];
    published = Array.isArray(parsed) ? parsed : [parsed];
  }
} catch (error) {
  // Current npm reports "no version satisfies the range" as an E404 exit
  // rather than an empty body; that is the case this script exists to catch,
  // not an infrastructure failure.
  const stderr =
    error && typeof error === 'object' && 'stderr' in error
      ? String(error.stderr)
      : '';
  if (!stderr.includes('E404')) {
    console.error(`Could not query npm for ${PACKAGE}@${range}.`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (published.length === 0) {
  console.error(
    [
      `No published version of ${PACKAGE} satisfies "${range}" (required by nuxt/package.json).`,
      'Publish the root package first, then retry:',
      '  bun run publish:vue',
      '  bun run publish:nuxt',
    ].join('\n'),
  );
  process.exit(1);
}

console.log(
  `${PACKAGE}@${range} resolves to ${published.at(-1)} on npm; safe to publish the Nuxt module.`,
);
