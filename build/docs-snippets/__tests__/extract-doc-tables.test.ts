import { describe, expect, it } from 'vitest';
import { extractReturnTables, listComposables } from '../extract-doc-tables';

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
      { name: 'flyTo', line: 7 },
      { name: 'isFlying', line: 8 },
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

describe('listComposables', () => {
  it('names every composable a section heading introduces', () => {
    expect(
      listComposables(`## Camera Composables

### usePanBy / usePanTo

#### Returns

### useFlyTo
`),
    ).toEqual(['usePanBy', 'usePanTo', 'useFlyTo']);
  });
});
