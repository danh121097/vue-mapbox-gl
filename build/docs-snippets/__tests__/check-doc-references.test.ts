import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkReferences } from '../check-doc-references';

function project(page: string): { root: string; pages: string[] } {
  const root = mkdtempSync(resolve(tmpdir(), 'doc-refs-'));
  writeFileSync(
    resolve(root, 'package.json'),
    JSON.stringify({ scripts: { build: 'x', 'docs:check': 'y' } }),
  );
  mkdirSync(resolve(root, 'dist'));
  writeFileSync(resolve(root, 'dist/style.css'), '');
  const file = resolve(root, 'README.md');
  writeFileSync(file, page);
  return { root, pages: [file] };
}

const COUNTS = { components: 10, composables: 38 };

function problems(page: string) {
  const { root, pages } = project(page);
  return checkReferences(pages, root, COUNTS).map((p) => p.message);
}

describe('checkReferences', () => {
  it('accepts a script the manifest defines', () => {
    expect(problems('Run `bun run docs:check`.')).toEqual([]);
  });

  it('reports a script the manifest does not define', () => {
    expect(problems('Run `bun run docs:chekc`.')).toEqual([
      "error: no package script named 'docs:chekc'",
    ]);
  });

  it('reports a built file the package does not emit', () => {
    expect(problems("import 'vue3-maplibre-gl/dist/styles.css';")).toEqual([
      "error: the build emits no 'dist/styles.css'",
    ]);
  });

  it("leaves MapLibre's own dist paths alone", () => {
    expect(
      problems(
        '<script src="https://unpkg.com/maplibre-gl/dist/x.js"></script>',
      ),
    ).toEqual([]);
  });

  it('checks an advertised total, in either shape the docs use', () => {
    expect(problems('All 38 composables are auto-imported.')).toEqual([]);
    expect(problems('10 components, 38 composables')).toEqual([]);
    expect(problems('All 40 composables are auto-imported.')).toEqual([
      'error: the docs say 40 composables, the package exports 38',
    ]);
  });

  it('leaves a count that is not a total claim alone', () => {
    // "3 composables share one factory" is a fact about three of them.
    expect(problems('3 composables share one factory.')).toEqual([]);
    expect(problems('a Vue 3 component library')).toEqual([]);
  });
});
