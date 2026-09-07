import { describe, expect, it } from 'vitest';
import { coverageSnippet, tableSnippet } from '../snippet-project';

const FILE = 'docs/api/composables.md';

describe('coverageSnippet', () => {
  it('excludes every documented name from the leftover keys', () => {
    const { code } = coverageSnippet({
      file: FILE,
      composable: 'useFlyTo',
      line: 12,
      documented: ['flyTo', 'isFlying'],
      spreads: [],
    });

    expect(code).toContain("'flyTo' | 'isFlying'");
    expect(code).toContain("import { useFlyTo } from 'vue3-maplibre-gl';");
  });

  it('forgives only the members of a declared spread source', () => {
    const { code } = coverageSnippet({
      file: FILE,
      composable: 'useMaplibre',
      line: 12,
      documented: ['register'],
      spreads: ['MaplibreMethods'],
    });

    // A type spread is imported as a type and excluded by its keys, so a field
    // outside it still fails.
    expect(code).toContain(
      "import type { MaplibreMethods } from 'vue3-maplibre-gl';",
    );
    expect(code).toContain("'register' | keyof MaplibreMethods");
  });

  it('resolves a composable spread through its return type', () => {
    const { code } = coverageSnippet({
      file: FILE,
      composable: 'useLayerEventListener',
      line: 12,
      documented: ['layerId'],
      spreads: ['useMapEventListener'],
    });

    expect(code).toContain(
      "import { useLayerEventListener, useMapEventListener } from 'vue3-maplibre-gl';",
    );
    expect(code).toContain(
      'keyof DocumentedReturn<typeof useMapEventListener>',
    );
  });

  it('asserts a composable documented in prose has no fields at all', () => {
    const { code } = coverageSnippet({
      file: FILE,
      composable: 'useDebounce',
      line: 12,
      documented: [],
      spreads: [],
    });

    expect(code).toContain('  never');
  });

  it('forgives the array surface only for a tuple documented by index', () => {
    const byIndex = coverageSnippet({
      file: FILE,
      composable: 'useDebouncedRef',
      line: 12,
      documented: ['0', '1'],
      spreads: [],
    });
    const byName = coverageSnippet({
      file: FILE,
      composable: 'useFlyTo',
      line: 12,
      documented: ['flyTo'],
      spreads: [],
    });

    expect(byIndex.code).toContain('keyof unknown[]');
    expect(byName.code).not.toContain('keyof unknown[]');
  });

  it('points every line at the Returns heading, since there are no rows to blame', () => {
    const snippet = coverageSnippet({
      file: FILE,
      composable: 'useFlyTo',
      line: 12,
      documented: ['flyTo'],
      spreads: [],
    });

    expect(snippet.lineMap).toEqual(snippet.code.split('\n').map(() => 12));
  });
});

describe('tableSnippet', () => {
  it('asserts each row both ways, and blames the row s own line', () => {
    const snippet = tableSnippet({
      file: FILE,
      composable: 'useFlyTo',
      headingLine: 3,
      spreads: [],
      fields: [{ name: 'flyTo', type: '() => void', line: 7 }],
    });

    expect(snippet.code).toContain("type _0 = Returned['flyTo'];");
    // Mutual assignability: neither direction alone catches a wrong wrapper.
    expect(snippet.code).toContain('const _to0: _d0 = null as unknown as _0;');
    expect(snippet.code).toContain(
      'const _from0: _0 = null as unknown as _d0;',
    );
    expect(snippet.lineMap!.slice(-4)).toEqual([7, 7, 7, 7]);
  });

  it('checks a generic row against a real type parameter, not `any`', () => {
    const { code } = tableSnippet(
      {
        file: FILE,
        composable: 'useDebounce',
        headingLine: 3,
        spreads: [],
        fields: [{ name: 'flush', type: '() => ReturnType<T>', line: 7 }],
      },
      1,
      '<T extends (...args: any[]) => any>',
    );

    // The composable is instantiated with its own parameter, so `T` stays
    // abstract; `type T = any` would make every generic row pass.
    expect(code).toContain('function _rows<T extends (...args: any[]) => any>');
    expect(code).toContain('typeof useDebounce<T>');
    expect(code).not.toContain('type T = any;');
  });

  it('aliases the documented letter when the signature names it differently', () => {
    const { code } = tableSnippet(
      {
        file: FILE,
        composable: 'useCreateLayer',
        headingLine: 3,
        spreads: [],
        fields: [{ name: 'getLayer', type: 'ComputedRef<T>', line: 7 }],
      },
      1,
      '<Layer extends LayerSpecification>',
    );

    expect(code).toContain('type T = Layer;');
    // The constraint's type is imported; the parameter's own name is not.
    expect(code).toContain('LayerSpecification');
    expect(code).not.toMatch(/import[^\n]*\bLayer\b[^S]/);
  });

  it('falls back to `any` when the composable takes no type parameters', () => {
    const { code } = tableSnippet({
      file: FILE,
      composable: 'useFlyTo',
      headingLine: 3,
      spreads: [],
      fields: [{ name: 'flyTo', type: 'Ref<T>', line: 7 }],
    });

    expect(code).toContain('type T = any;');
  });

  it('takes an ordinal, so two tables for one composable do not collide', () => {
    const table = {
      file: FILE,
      composable: 'usePanBy',
      headingLine: 3,
      spreads: [],
      fields: [{ name: 'panBy', type: null, line: 7 }],
    };

    expect(tableSnippet(table, 1).label).not.toBe(tableSnippet(table, 2).label);
  });
});
