import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkPropEmitCollisions } from '../check-prop-emit-collisions';

const made: string[] = [];

function fixture(declaration: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'collisions-'));
  made.push(dir);
  mkdirSync(join(dir, 'dist/components'), { recursive: true });
  writeFileSync(join(dir, 'dist/components/Thing.vue.d.ts'), declaration);
  return dir;
}

afterEach(() => {
  for (const dir of made.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

/** The shape vue-tsc emits: props by interface, emits as a `Readonly<{...}>`. */
const CLEAN = `interface ThingProps {
    debug: boolean;
    onMapError: (error: unknown) => void;
}
declare const __VLS_component: import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<Partial<ThingProps>>>, {}, {}, {}, {}, string, import('vue').PublicProps, Readonly<{
    onError?: ((error: unknown) => any) | undefined;
}>>;
export default __VLS_component;
`;

describe('checkPropEmitCollisions', () => {
  it('passes a component whose callback props avoid its emit keys', () => {
    const result = checkPropEmitCollisions(fixture(CLEAN));
    expect(result.checked).toBe(1);
    expect(result.problems).toEqual([]);
  });

  it('fails when a declared prop is also an emit listener key', () => {
    // `onError` is both the prop the component calls itself and the key Vue
    // puts `@error` under, so one listener fires twice and the two declared
    // types intersect.
    const result = checkPropEmitCollisions(
      fixture(CLEAN.replace('onMapError', 'onError')),
    );
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]!.message).toContain("'onError' is both");
    expect(result.problems[0]!.message).toContain("'error' emit");
  });

  it('reads nothing, and says so, when there is no dist to read', () => {
    // The count is the whole guard: a run that read no declarations reports
    // exactly what a clean run does. This asserts the count is honest; that it
    // is non-zero against the real package is asserted by `docs:check`, which
    // runs where `dist/` is built. A unit test that reads build output is a
    // unit test that fails wherever the build has not run -- which is what it
    // did, on every CI run, in the Test step that precedes Build.
    const empty = mkdtempSync(join(tmpdir(), 'collisions-'));
    made.push(empty);
    expect(checkPropEmitCollisions(empty)).toEqual({
      problems: [],
      checked: 0,
    });
  });
});
