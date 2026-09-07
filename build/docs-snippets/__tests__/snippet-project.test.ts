import { describe, expect, it } from 'vitest';
import {
  componentCoverageSnippet,
  componentTableSnippet,
  coverageSnippet,
  parametersSnippet,
  slotSnippet,
  tableSnippet,
} from '../snippet-project';

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
      fields: [
        { name: 'flyTo', type: '() => void', defaultCell: null, line: 7 },
      ],
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
        fields: [
          {
            name: 'flush',
            type: '() => ReturnType<T>',
            defaultCell: null,
            line: 7,
          },
        ],
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
        fields: [
          {
            name: 'getLayer',
            type: 'ComputedRef<T>',
            defaultCell: null,
            line: 7,
          },
        ],
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
      fields: [{ name: 'flyTo', type: 'Ref<T>', defaultCell: null, line: 7 }],
    });

    expect(code).toContain('type T = any;');
  });

  it('takes an ordinal, so two tables for one composable do not collide', () => {
    const table = {
      file: FILE,
      composable: 'usePanBy',
      headingLine: 3,
      spreads: [],
      fields: [{ name: 'panBy', type: null, defaultCell: null, line: 7 }],
    };

    expect(tableSnippet(table, 1).label).not.toBe(tableSnippet(table, 2).label);
  });
});

const COMPONENTS = 'docs/api/components.md';

describe('componentTableSnippet', () => {
  it('checks a prop row against the component instance type', () => {
    const { code } = componentTableSnippet(
      {
        file: COMPONENTS,
        composable: 'Marker',
        headingLine: 10,
        spreads: [],
        fields: [
          { name: 'lnglat', type: 'LngLatLike', defaultCell: null, line: 14 },
        ],
      },
      'props',
    );

    expect(code).toContain(
      "type Props = InstanceType<typeof Marker>['$props'];",
    );
    expect(code).toContain("type _0 = NonNullable<Props['lnglat']>;");
    expect(code).toContain('type _d0 = LngLatLike;');
  });

  it('checks an event row against the payload, not the handler', () => {
    const { code } = componentTableSnippet(
      {
        file: COMPONENTS,
        composable: 'Maplibre',
        headingLine: 22,
        spreads: [],
        fields: [
          { name: 'click', type: 'MapMouseEvent', defaultCell: null, line: 29 },
        ],
      },
      'events',
    );

    expect(code).toContain(
      "type _0 = Parameters<NonNullable<Props['onClick']>>[0];",
    );
  });

  it('keys a hyphenated or namespaced emit the way Vue does', () => {
    // Vue capitalises the first letter and nothing else, so camelising here
    // would produce `onDataUpdate` and `onUpdateShow` -- names no component has.
    const { code } = componentTableSnippet(
      {
        file: COMPONENTS,
        composable: 'GeoJsonSource',
        headingLine: 22,
        spreads: [],
        fields: [
          { name: 'data-update', type: 'string', defaultCell: null, line: 29 },
          { name: 'update:show', type: 'boolean', defaultCell: null, line: 30 },
        ],
      },
      'events',
    );

    expect(code).toContain("Props['onData-update']");
    expect(code).toContain("Props['onUpdate:show']");
  });

  it('reads a void payload as a handler that takes no arguments', () => {
    // `Parameters<...>[0]` on a no-argument handler fails as a missing tuple
    // element, which would report a row that is right.
    const { code } = componentTableSnippet(
      {
        file: COMPONENTS,
        composable: 'Popup',
        headingLine: 22,
        spreads: [],
        fields: [{ name: 'close', type: 'void', defaultCell: null, line: 29 }],
      },
      'events',
    );

    expect(code).toContain(
      "type _0 = Parameters<NonNullable<Props['onClose']>>['length'];",
    );
    expect(code).toContain('const _n0: 0 =');
  });
});

describe('componentCoverageSnippet', () => {
  it('excludes documented props and emits, and Vue own keys', () => {
    const { code } = componentCoverageSnippet({
      file: COMPONENTS,
      component: 'Popup',
      line: 22,
      props: ['lnglat'],
      events: ['close', 'update:show'],
      eventsLike: [],
    });

    expect(code).toContain("| 'lnglat' | 'onClose' | 'onUpdate:show'");
    expect(code).toContain('| keyof VNodeProps');
  });

  it('forgives the events a component says it shares with another', () => {
    const { code } = componentCoverageSnippet({
      file: COMPONENTS,
      component: 'CircleLayer',
      line: 22,
      props: ['id'],
      events: [],
      eventsLike: ['FillLayer'],
    });

    expect(code).toContain(
      "import { CircleLayer, FillLayer } from 'vue3-maplibre-gl';",
    );
    expect(code).toContain("keyof InstanceType<typeof FillLayer>['$props']");
  });
});

describe('parametersSnippet', () => {
  it('makes the call the table describes, one property per line', () => {
    const { code } = parametersSnippet(
      {
        file: FILE,
        composable: 'useZoomTo',
        headingLine: 40,
        spreads: [],
        fields: [
          {
            name: 'map',
            type: 'MaybeRef<Map | null>',
            defaultCell: null,
            line: 44,
          },
          { name: 'zoom', type: 'number', defaultCell: null, line: 45 },
        ],
      },
      ['props'],
    );

    expect(code).toContain('void useZoomTo({');
    expect(code).toContain("  'map': _v0,");
    expect(code).toContain("  'zoom': _v1,");
  });

  it('passes the rows in order when they name the parameters themselves', () => {
    const { code } = parametersSnippet(
      {
        file: FILE,
        composable: 'useDebouncedRef',
        headingLine: 40,
        spreads: [],
        fields: [
          { name: 'initialValue', type: 'number', defaultCell: null, line: 44 },
          { name: 'delay', type: 'number', defaultCell: null, line: 45 },
        ],
      },
      ['initialValue', 'delay'],
    );

    expect(code).toContain('void useDebouncedRef(_v0, _v1);');
  });

  it('treats one row against one parameter as that parameter', () => {
    // Several composables take a single destructured props object, whose
    // declared "name" is the whole binding pattern rather than `props`.
    const { code } = parametersSnippet(
      {
        file: FILE,
        composable: 'useCreateGeoJsonSource',
        headingLine: 40,
        spreads: [],
        fields: [
          {
            name: 'props',
            type: 'CreateGeoJsonSourceProps',
            defaultCell: null,
            line: 44,
          },
        ],
      },
      ['{ map: mapRef, id, data }'],
    );

    expect(code).toContain('void useCreateGeoJsonSource(_v0);');
  });

  it('checks a generic row with a real type parameter, not any', () => {
    const { code } = parametersSnippet(
      {
        file: FILE,
        composable: 'useDebouncedRef',
        headingLine: 40,
        spreads: [],
        fields: [
          { name: 'initialValue', type: 'T', defaultCell: null, line: 44 },
        ],
      },
      ['initialValue'],
      1,
      '<T>',
    );

    expect(code).toContain('function _call<T>(): void {');
    expect(code).not.toContain('type T = any;');
  });

  it('maps each row to its own markdown line', () => {
    const { lineMap, code } = parametersSnippet(
      {
        file: FILE,
        composable: 'useZoomTo',
        headingLine: 40,
        spreads: [],
        fields: [
          {
            name: 'map',
            type: 'MaybeRef<Map | null>',
            defaultCell: null,
            line: 44,
          },
          { name: 'zoom', type: 'number', defaultCell: null, line: 45 },
        ],
      },
      ['props'],
    );

    const lines = code.split('\n');
    expect(lineMap).toHaveLength(lines.length);
    expect(lineMap![lines.indexOf("  'zoom': _v1,")]).toBe(45);
  });
});

describe('slotSnippet', () => {
  const { code, lineMap } = slotSnippet({
    file: COMPONENTS,
    composable: 'Maplibre',
    headingLine: 77,
    spreads: [],
    fields: [
      { name: 'default', type: null, defaultCell: null, line: 81 },
      { name: 'loading', type: null, defaultCell: null, line: 82 },
    ],
  });

  it('reads the template slots, not the index signature Vue adds', () => {
    // `$slots` on a compiled SFC is the template's own slots intersected with
    // `{ [name: string]: Slot | undefined }`. Under that index signature every
    // name resolves and `keyof` collapses to `string`, so both halves of this
    // check would pass for a table of pure invention.
    expect(code).toContain('type Named<T> = {');
    expect(code).toContain('string extends K');
    expect(code).toContain(
      "type Slots = Named<InstanceType<typeof Maplibre>['$slots']>;",
    );
  });

  it('names each documented slot on its own line', () => {
    expect(code).toContain("type _0 = Slots['default'];");
    expect(code).toContain("type _1 = Slots['loading'];");
    expect(
      lineMap?.[code.split('\n').indexOf("type _1 = Slots['loading'];")],
    ).toBe(82);
  });

  it('leaves a slot no row documents as a reported key', () => {
    expect(code).toContain(
      "type Extra = Exclude<keyof Slots, 'default' | 'loading'>;",
    );
    expect(code).toContain('__slot');
  });
});
