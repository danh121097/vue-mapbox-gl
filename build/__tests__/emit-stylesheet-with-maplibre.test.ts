/**
 * The combined stylesheet is only correct if MapLibre's rules come first and
 * this package's come after: both style `.maplibregl-*` ancestors of the map
 * container, and a reversed concatenation would let upstream defaults win over
 * the container sizing. Nothing about the file's shape says that, so the order
 * is asserted here rather than left to the next person editing the emitter.
 */
import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { emitStylesheetWithMaplibre } from '../emit-stylesheet-with-maplibre';

/** A root with a `dist/` holding the given `style.css`, or none at all. */
function fakePackageRoot(ownStylesheet?: string): string {
  const rootDir = mkdtempSync(resolve(tmpdir(), 'vue-maplibre-gl-css-'));
  if (ownStylesheet !== undefined) {
    mkdirSync(resolve(rootDir, 'dist'));
    writeFileSync(resolve(rootDir, 'dist/style.css'), ownStylesheet);
  }
  return rootDir;
}

describe('emitStylesheetWithMaplibre', () => {
  it('writes dist/style-with-maplibre.css next to the stylesheet it read', () => {
    const rootDir = fakePackageRoot('.maplibre-container{position:relative}');

    const outputPath = emitStylesheetWithMaplibre(rootDir);

    expect(outputPath).toBe(resolve(rootDir, 'dist/style-with-maplibre.css'));
  });

  it("puts MapLibre's rules before this package's", () => {
    const rootDir = fakePackageRoot('.maplibre-container{position:relative}');

    const css = readFileSync(emitStylesheetWithMaplibre(rootDir), 'utf8');

    expect(css).toContain('.maplibregl-map');
    expect(css).toContain('.maplibre-container{position:relative}');
    expect(css.indexOf('.maplibregl-map')).toBeLessThan(
      css.indexOf('.maplibre-container{position:relative}'),
    );
  });

  it('credits MapLibre and names the version it bundled', () => {
    const rootDir = fakePackageRoot('.maplibre-container{}');

    const css = readFileSync(emitStylesheetWithMaplibre(rootDir), 'utf8');
    const header = css.slice(0, css.indexOf('*/'));

    expect(header).toMatch(/MapLibre GL JS v\d+\.\d+\.\d+/);
    expect(header).toContain('BSD-3-Clause');
  });

  it('fails with the build order to run when dist/style.css is missing', () => {
    const rootDir = fakePackageRoot();

    expect(() => emitStylesheetWithMaplibre(rootDir)).toThrow(/bun run build/);
  });
});
