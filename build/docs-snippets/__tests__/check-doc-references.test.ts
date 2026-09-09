import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkReferences } from '../check-doc-references';

function project(
  page: string,
  testFiles = 0,
): { root: string; pages: string[] } {
  const root = mkdtempSync(resolve(tmpdir(), 'doc-refs-'));
  writeFileSync(
    resolve(root, 'package.json'),
    JSON.stringify({ scripts: { build: 'x', 'docs:check': 'y' } }),
  );
  mkdirSync(resolve(root, 'dist'));
  writeFileSync(resolve(root, 'dist/style.css'), '');
  if (testFiles) {
    mkdirSync(resolve(root, '__tests__'));
    for (let i = 0; i < testFiles; i++) {
      writeFileSync(resolve(root, `__tests__/a${i}.test.ts`), '');
    }
  }
  const file = resolve(root, 'README.md');
  writeFileSync(file, page);
  return { root, pages: [file] };
}

const COUNTS = { components: 10, composables: 38 };

function problems(page: string, testFiles = 0) {
  const { root, pages } = project(page, testFiles);
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

  it('checks the advertised size of the test suite', () => {
    // The count that was there had drifted from 19 files to 31 unnoticed,
    // because nothing but a person rereading the table would have caught it.
    expect(problems('Tests: 2 test files', 2)).toEqual([]);
    expect(problems('Tests: 19 test files', 2)).toEqual([
      'error: the docs say 19 test files, the repository has 2',
    ]);
  });

  it('reads the "N tests across M files" spelling too', () => {
    // The spelling the maintainer docs actually use, and the one the check
    // originally missed: four pages sat at "107 tests across 19 files" while
    // the suite had grown to 32, and the gate reported nothing.
    expect(problems('222 tests across 2 files', 2)).toEqual([]);
    expect(problems('107 tests across 19 files', 2)).toEqual([
      'error: the docs say 19 test files, the repository has 2',
    ]);
    expect(problems('40 assertions across 2 files', 2)).toEqual([]);
  });

  it('reads the bare "N across M files" a table row uses', () => {
    // The spelling that survived the previous widening: a table whose row
    // header already says "Unit Tests" drops the noun from the cell, so
    // neither "test files" nor "tests across" appears anywhere on the line.
    expect(problems('| **Unit Tests** | 223 across 2 files |', 2)).toEqual([]);
    expect(problems('| **Unit Tests** | 107 across 19 files |', 2)).toEqual([
      'error: the docs say 19 test files, the repository has 2',
    ]);
  });

  it('leaves a count that is not a total claim alone', () => {
    // "3 composables share one factory" is a fact about three of them.
    expect(problems('3 composables share one factory.')).toEqual([]);
    expect(problems('a Vue 3 component library')).toEqual([]);
  });
});
