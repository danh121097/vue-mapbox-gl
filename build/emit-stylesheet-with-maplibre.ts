/**
 * Emits `dist/style-with-maplibre.css`: MapLibre's own stylesheet followed by this
 * package's.
 *
 * `dist/style.css` holds one rule — the map container's sizing — because the
 * build externalises MapLibre entirely. A consumer therefore has to remember
 * two stylesheet imports, and forgetting the MapLibre one produces a map whose
 * controls and popups are unstyled rather than an error. This concatenation is
 * the single import for consumers who do not already load MapLibre's CSS
 * themselves; `dist/style.css` stays published for the ones who do, so nobody
 * is forced to ship the ~69KB twice.
 *
 * Runs after both Vite passes, since it reads what they wrote.
 *
 * Usage: emit-stylesheet-with-maplibre.ts
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);

/**
 * MapLibre's stylesheet, located through its own manifest rather than a
 * hard-coded `dist/` path: `style` is the field a package uses to name it, and
 * following it survives an upstream layout change that a literal path would
 * only discover as a missing file.
 */
function maplibreStylesheet(): { css: string; version: string } {
  const manifestPath = require.resolve('maplibre-gl/package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    style?: string;
    version: string;
  };
  const relativePath = manifest.style ?? 'dist/maplibre-gl.css';
  const cssPath = resolve(dirname(manifestPath), relativePath);

  return {
    css: readFileSync(cssPath, 'utf8').trim(),
    version: manifest.version,
  };
}

export function emitStylesheetWithMaplibre(rootDir: string): string {
  const ownPath = resolve(rootDir, 'dist/style.css');
  let own: string;
  try {
    own = readFileSync(ownPath, 'utf8').trim();
  } catch {
    throw new Error(
      `Cannot build dist/style-with-maplibre.css: ${ownPath} does not exist. ` +
        'Run the Vite passes first — `bun run build` chains them in order.',
    );
  }

  const maplibre = maplibreStylesheet();
  const bundled = [
    '/*!',
    ` * MapLibre GL JS v${maplibre.version} stylesheet, bundled verbatim.`,
    ' * Copyright (c) MapLibre contributors. BSD-3-Clause.',
    ' * https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt',
    ' *',
    ' * Import this file INSTEAD OF, not alongside, maplibre-gl/dist/maplibre-gl.css.',
    ' */',
    maplibre.css,
    own,
    '',
  ].join('\n');

  const outputPath = resolve(rootDir, 'dist/style-with-maplibre.css');
  writeFileSync(outputPath, bundled);
  return outputPath;
}

// Run only as a CLI: the tests import `emitStylesheetWithMaplibre` directly, and a
// bare top-level call would write into the real `dist/` on every test run.
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const outputPath = emitStylesheetWithMaplibre(
    resolve(import.meta.dirname, '..'),
  );
  console.log(`Wrote ${outputPath}`);
}
