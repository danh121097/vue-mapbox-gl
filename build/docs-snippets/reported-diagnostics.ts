/**
 * Decides which compiler diagnostics are worth failing a docs build over.
 *
 * Compiling documentation is not the same as compiling an application. An
 * example is written to be read, so it abridges: it names a variable the
 * surrounding app would own, it writes `center: [0, 0]` in a `ref()` and lets
 * the reader infer the rest. Reporting everything the compiler notices about
 * that would bury the handful of diagnostics that mean something in hundreds
 * that do not, and a check nobody can act on gets switched off.
 *
 * So this reports one class only: **something named here does not exist.**
 * That is the class the docs have actually failed at — a `PopUp` component, a
 * `showUserHeading` option, a `.lngLat` on an event that has no such property —
 * and the class no amount of grepping for names can settle, because it needs
 * the type of the thing the name was used on.
 */

/** Reported. Each of these says a name does not exist on the thing it was used on. */
const REPORTED = new Map<number, string>([
  [2305, 'imported name is not exported'],
  [2307, 'module cannot be resolved'],
  [2551, 'property does not exist (near-miss spelling)'],
  [2339, 'property does not exist'],
  [2353, 'unknown property in an object literal'],
  [2554, 'wrong number of arguments'],
  [2555, 'too few arguments'],
  [2561, 'unknown property (near-miss spelling)'],
  [2614, 'imported as a named export but is not one'],
  [2724, 'imported name is not exported (near-miss spelling)'],
]);

/**
 * Deliberately not reported, and why. Kept as a list rather than a silence so
 * that turning one back on is a decision someone can make on purpose.
 *
 * - 2304 `Cannot find name` — an abridged example referring to state the
 *   surrounding application owns. Ubiquitous and intended.
 * - 2322 / 2345 / 2769 assignability — almost always literal widening in
 *   example data: `center: [0, 0]` inside `ref()` infers `number[]`, not
 *   `LngLatLike`. Real for a TypeScript reader, but a property of inference,
 *   not evidence that the docs contradict the code.
 * - 18004 shorthand property with no value in scope — the same abridgement
 *   as 2304, seen through object shorthand.
 */
const NOT_REPORTED = new Set([2304, 18004]);

/**
 * Assignability errors are reported only when the compiler's explanation says a
 * name does not exist.
 *
 * A wrong prop on a component reaches TypeScript as an assignability failure:
 * `<GeoJsonSource source-id="x">` produces "Type '{ sourceId: string; }' is not
 * assignable to ... Property 'sourceId' does not exist on type ...". Dropping
 * the whole 2322/2345 family to silence literal widening would drop that too,
 * and a misspelled prop is precisely what this check exists to find. So the
 * family is filtered on what the message says rather than on its code.
 */
const CONDITIONAL = new Set([2322, 2345, 2769]);
const NAME_DOES_NOT_EXIST =
  /Property '[^']+' does not exist on type|Object literal may only specify known properties/;

export function isReported(code: number, fullMessage = ''): boolean {
  if (REPORTED.has(code)) return true;
  return CONDITIONAL.has(code) && NAME_DOES_NOT_EXIST.test(fullMessage);
}

export function describe(code: number): string | undefined {
  return REPORTED.get(code);
}

export function isKnownlySilenced(code: number): boolean {
  return NOT_REPORTED.has(code);
}

/** Pulls `2724` out of `error TS2724: '"pkg"' has no exported member ...`. */
export function diagnosticCode(message: string): number | null {
  const match = /\berror TS(\d+):/.exec(message);
  return match ? Number(match[1]) : null;
}

/**
 * Shortens the two message shapes that are unreadable at full length.
 *
 * A template that names a binding its script never declares produces a
 * diagnostic carrying the component's entire inferred instance type — several
 * thousand characters of `__VLS_` internals wrapped around one useful word.
 */
export function summarize(message: string): string {
  // The undocumented-field probe indexes a one-property object, so its failure
  // reads as a missing property on `{ __none: true }`. Say what it means.
  const prop =
    /Property '([^']+)' does not exist on type '\{ __prop: true; \}'/.exec(
      message,
    );
  if (prop) {
    return `error: '${prop[1]}' is not a prop or an emit of this component`;
  }

  const slot =
    /Property '([^']+)' does not exist on type '\{ __slot: true; \}'/.exec(
      message,
    );
  if (slot) {
    return `error: '${slot[1]}' is a slot that no row documents`;
  }

  const member =
    /Property '([^']+)' does not exist on type '\{ __member: true; \}'/.exec(
      message,
    );
  if (member) {
    return `error: '${member[1]}' is a prop or an emit that no row documents`;
  }

  const undocumented =
    /Property '([^']+)' does not exist on type '\{ __(?:none|all): true; \}'/.exec(
      message,
    );
  if (undocumented) {
    return `error: '${undocumented[1]}' is returned but no Returns row documents it`;
  }

  const excessProp =
    /Property '([^']+)' does not exist on type '(?:IntrinsicAttributes|Partial<)/.exec(
      message,
    );
  if (excessProp) {
    return `error: '${excessProp[1]}' is not a prop of this component`;
  }
  const templateBinding =
    /error TS(?:2339|2551): Property '([^']+)' does not exist on type 'CreateComponentPublicInstance/.exec(
      message,
    );
  if (templateBinding) {
    return `error: the template uses '${templateBinding[1]}', which this block never declares`;
  }
  const onUnion =
    /error TS(?:2339|2551): Property '([^']+)' does not exist on type '([^']{0,60})/.exec(
      message,
    );
  if (onUnion && message.length > 200) {
    return `error: '${onUnion[1]}' does not exist on '${onUnion[2]}…'`;
  }
  return message;
}
