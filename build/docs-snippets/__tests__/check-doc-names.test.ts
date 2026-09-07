import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkNames } from '../check-doc-names';

const EXPORTED = new Set(['useFlyTo', 'useZoomTo', 'useZoomIn']);

function problems(page: string, name = 'guide.md') {
  const root = mkdtempSync(resolve(tmpdir(), 'doc-names-'));
  const file = resolve(root, name);
  writeFileSync(file, page);
  return checkNames([file], root, EXPORTED).map((p) => p.message);
}

describe('checkNames', () => {
  it('accepts a name the package exports', () => {
    expect(problems('Call `useFlyTo` to animate.')).toEqual([]);
  });

  it('reports a backticked name that does not exist', () => {
    expect(problems('Call `useBounds` to fit.')).toEqual([
      "error: 'useBounds' is named as a composable but the package exports no such name",
    ]);
  });

  it('reports a heading naming a composable that does not exist', () => {
    expect(problems('### useBounds')).toHaveLength(1);
  });

  it('accepts a family form when something starts with it', () => {
    expect(problems('The `useZoom*` family takes both call shapes.')).toEqual(
      [],
    );
    expect(problems('The `usePan*` family.')).toEqual([
      "error: 'usePan' is named as a composable but the package exports no such name and nothing starting with it",
    ]);
  });

  it('leaves fenced code to the compiler', () => {
    expect(problems('```ts\nimport { useBounds } from "x";\n```')).toEqual([]);
  });

  it('leaves the changelog and migration guides alone', () => {
    expect(problems('`useBounds` is gone.', 'changelog.md')).toEqual([]);
    expect(problems('`useBounds` is gone.', 'migration-v6.md')).toEqual([]);
  });

  it('exempts the paragraph under a marker, and only that paragraph', () => {
    expect(
      problems(`<!-- names-skip: naming what never existed -->

The README advertised \`useBounds\`.

But \`useZoom\` here is not exempt.
`),
    ).toEqual([
      "error: 'useZoom' is named as a composable but the package exports no such name",
    ]);
  });
});
