import { describe, expect, it } from 'vitest';
import {
  extractEventsLike,
  extractEventTables,
  extractPropTables,
  extractReturnTables,
  listComposables,
  splitRow,
} from '../extract-doc-tables';

const FILE = 'docs/api/composables.md';

function tables(source: string) {
  return extractReturnTables(FILE, source);
}

describe('extractReturnTables', () => {
  it('reads a table under a Returns heading', () => {
    const found = tables(`### useFlyTo

#### Returns

| Property | Type | Description |
| -------- | ---- | ----------- |
| \`flyTo\` | \`() => void\` | Fly |
| \`isFlying\` | \`ComputedRef<boolean>\` | Flying |
`);

    expect(found).toHaveLength(1);
    expect(found[0]!.composable).toBe('useFlyTo');
    expect(found[0]!.fields.map((f) => f.name)).toEqual(['flyTo', 'isFlying']);
  });

  it('reads the documented type from the column the header names', () => {
    const found = tables(`### useCreateFillLayer

#### Returns

| Property | Type | Description |
| -------- | ---- | ----------- |
| \`getLayer\` | \`ComputedRef<Layer \\| null>\` | Read it |
| \`removeLayer\` | \`() => void\` | Remove it |
`);

    expect(found[0]!.fields.map((f) => f.type)).toEqual([
      'ComputedRef<Layer | null>',
      '() => void',
    ]);
  });

  it('finds the type column when it is not the second one', () => {
    const found = tables(`### useDebouncedRef

#### Returns

| Index | Name | Type |
| ----- | ---- | ---- |
| \`0\` | \`debouncedRef\` | \`Ref<T>\` |
`);

    expect(found[0]!.fields).toEqual([{ name: '0', type: 'Ref<T>', line: 7 }]);
  });

  it('leaves the type null when the cell is not one backticked expression', () => {
    const found = tables(`### useFlyTo

#### Returns

| Property | Type | Description |
| -------- | ---- | ----------- |
| \`flyTo\` | see below | Fly |
`);

    expect(found[0]!.fields[0]!.type).toBeNull();
  });

  it('records the markdown line of each row, so a bad row points at itself', () => {
    const found = tables(`### useFlyTo

#### Returns

| Property | Type |
| -------- | ---- |
| \`flyTo\` | \`() => void\` |
| \`isFlying\` | \`ComputedRef<boolean>\` |
`);

    expect(found[0]!.headingLine).toBe(3);
    expect(found[0]!.fields).toEqual([
      { name: 'flyTo', type: '() => void', line: 7 },
      { name: 'isFlying', type: 'ComputedRef<boolean>', line: 8 },
    ]);
  });

  it('checks a shared table against every composable its heading names', () => {
    const found = tables(`### usePanBy / usePanTo

#### Returns

| Property | Type |
| -------- | ---- |
| \`stopPanning\` | \`() => void\` |
`);

    expect(found.map((t) => t.composable)).toEqual(['usePanBy', 'usePanTo']);
  });

  it('binds a bold-labelled table to the composable it labels', () => {
    const found = tables(`### useFitBounds / useCameraForBounds

#### Returns

**\`useFitBounds\`**

| Property | Type |
| -------- | ---- |
| \`setFitBounds\` | \`() => void\` |

**\`useCameraForBounds\`**

| Property | Type |
| -------- | ---- |
| \`getCameraForBounds\` | \`() => void\` |
`);

    expect(
      found.map((t) => [t.composable, t.fields.map((f) => f.name)]),
    ).toEqual([
      ['useFitBounds', ['setFitBounds']],
      ['useCameraForBounds', ['getCameraForBounds']],
    ]);
  });

  it('never binds a table to a composable from a section that has ended', () => {
    // The heading names no composable, so the table below it belongs to
    // nothing. Carrying `useFlyTo` forward here would check the wrong type and
    // report every row as missing.
    const found = tables(`### useFlyTo

#### Returns

| Property | Type |
| -------- | ---- |
| \`flyTo\` | \`() => void\` |

## Utility Composables

#### Returns

| Property | Type |
| -------- | ---- |
| \`somethingElse\` | \`() => void\` |
`);

    expect(found).toHaveLength(1);
    expect(found[0]!.composable).toBe('useFlyTo');
  });

  it('skips a Returns section written as prose', () => {
    expect(
      tables(`### useEaseTo

#### Returns

\`easeTo\`, \`easeToCenter\` and \`isEasing\` - the same shape as \`useFlyTo\`.
`),
    ).toEqual([]);
  });

  it('ignores rows whose first cell is not a single backticked name', () => {
    const found = tables(`### useFlyTo

#### Returns

| Property | Type |
| -------- | ---- |
| **Animation** | |
| \`flyTo\` | \`() => void\` |
`);

    expect(found[0]!.fields.map((f) => f.name)).toEqual(['flyTo']);
  });

  it('reads a tuple return documented by index', () => {
    const found = tables(`### useDebouncedRef

#### Returns

A tuple \`[debouncedRef, immediateRef, flush, cancel]\`:

| Index | Name | Type |
| ----- | ---- | ---- |
| \`0\` | \`debouncedRef\` | \`Ref<T>\` |
| \`1\` | \`immediateRef\` | \`Ref<T>\` |
`);

    expect(found[0]!.fields.map((f) => f.name)).toEqual(['0', '1']);
  });

  it("reads a spread marker as the section's abridgement", () => {
    const found = tables(`### useMaplibre

#### Returns

| Property | Type |
| -------- | ---- |
| \`register\` | \`() => void\` |

It also spreads in every method of \`MaplibreMethods\`.

<!-- returns-spread: MaplibreMethods -->
`);

    expect(found[0]!.spreads).toEqual(['MaplibreMethods']);
  });

  it('does not carry a spread marker into the next section', () => {
    const found = tables(`### useMaplibre

#### Returns

<!-- returns-spread: MaplibreMethods -->

| Property | Type |
| -------- | ---- |
| \`register\` | \`() => void\` |

### useFlyTo

#### Returns

| Property | Type |
| -------- | ---- |
| \`flyTo\` | \`() => void\` |
`);

    expect(found.map((t) => t.spreads)).toEqual([['MaplibreMethods'], []]);
  });

  it('reads only Returns tables, not Parameters ones', () => {
    const found = tables(`### useFlyTo

#### Parameters

| Property | Type |
| -------- | ---- |
| \`map\` | \`Map\` |

#### Returns

| Property | Type |
| -------- | ---- |
| \`flyTo\` | \`() => void\` |
`);

    expect(found).toHaveLength(1);
    expect(found[0]!.fields.map((f) => f.name)).toEqual(['flyTo']);
  });
});

describe('splitRow', () => {
  it('splits on pipes and drops the outer empties', () => {
    expect(splitRow('| `flyTo` | `() => void` | Fly |')).toEqual([
      '`flyTo`',
      '`() => void`',
      'Fly',
    ]);
  });

  it('keeps an escaped pipe inside a cell, so a union is one column', () => {
    expect(
      splitRow('| `getLayer` | `ComputedRef<Layer \\| null>` | Read it |'),
    ).toEqual(['`getLayer`', '`ComputedRef<Layer | null>`', 'Read it']);
  });
});

describe('listComposables', () => {
  it('names every composable a section heading introduces, with its line', () => {
    expect(
      listComposables(`## Camera Composables

### usePanBy / usePanTo

#### Returns

### useFlyTo
`),
    ).toEqual([
      { name: 'usePanBy', line: 3 },
      { name: 'usePanTo', line: 3 },
      { name: 'useFlyTo', line: 7 },
    ]);
  });
});

const COMPONENTS = 'docs/api/components.md';
const COMPONENT_NAME_RE = /\b(?:Maplibre|FillLayer|CircleLayer|Popup)\b/g;

describe('extractPropTables / extractEventTables', () => {
  it('reads a component section headed at ##, not ###', () => {
    const source = `## Maplibre

### Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| \`debug\` | \`boolean\` | \`false\` | Log |

### Events

| Event | Payload | Description |
| ----- | ------- | ----------- |
| \`click\` | \`MapMouseEvent\` | Clicked |
`;

    expect(
      extractPropTables(COMPONENTS, source, COMPONENT_NAME_RE).map((t) => [
        t.composable,
        t.fields.map((f) => [f.name, f.type]),
      ]),
    ).toEqual([['Maplibre', [['debug', 'boolean']]]]);

    expect(
      extractEventTables(COMPONENTS, source, COMPONENT_NAME_RE).map((t) => [
        t.composable,
        t.fields.map((f) => [f.name, f.type]),
      ]),
    ).toEqual([['Maplibre', [['click', 'MapMouseEvent']]]]);
  });

  it('reads an event name that is not a bare identifier', () => {
    // `data-update` and `update:show` are real emit names, and Vue keys them
    // verbatim. A pattern that only allowed identifiers dropped both rows, and
    // a dropped row is a row nothing checks.
    const found = extractEventTables(
      COMPONENTS,
      `## Popup

### Events

| Event | Payload | Description |
| ----- | ------- | ----------- |
| \`update:show\` | \`boolean\` | Shown |
| \`data-update\` | \`string\` | Updated |
`,
      COMPONENT_NAME_RE,
    );

    expect(found[0]!.fields.map((f) => f.name)).toEqual([
      'update:show',
      'data-update',
    ]);
  });

  it('does not read a Props table as an Events one', () => {
    const source = `## Maplibre

### Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| \`debug\` | \`boolean\` | \`false\` | Log |
`;

    expect(extractEventTables(COMPONENTS, source, COMPONENT_NAME_RE)).toEqual(
      [],
    );
  });
});

describe('extractEventsLike', () => {
  it('reads the component each marker defers to', () => {
    expect(
      extractEventsLike(
        `## CircleLayer

### Events

Same events as FillLayer (click, mousemove, etc.)

<!-- events-like: FillLayer -->

## Popup

### Events

| Event | Payload |
| ----- | ------- |
| \`close\` | \`void\` |
`,
        COMPONENT_NAME_RE,
      ),
    ).toEqual(new Map([['CircleLayer', ['FillLayer']]]));
  });

  it('finds no marker where a section does not carry one', () => {
    expect(
      extractEventsLike(
        `## Popup

### Events

| Event | Payload |
| ----- | ------- |
| \`close\` | \`void\` |
`,
        COMPONENT_NAME_RE,
      ),
    ).toEqual(new Map());
  });
});
