/**
 * Reads the default values a component or composable actually gives its inputs.
 *
 * This is the one check that reads `libs/` rather than `dist/`. Everything else
 * here deliberately trusts only the built package, because that is what a
 * consumer resolves -- but a default is a *value*, and the declarations carry
 * only types: `withDefaults(defineProps<P>(), { debug: false })` reaches
 * `Maplibre.vue.d.ts` as `{ debug: boolean }`. The reference's Default column
 * is therefore either checked against the sources or not checked at all, and
 * three layer components document `filter`, `style`, `maxzoom` and `minzoom`
 * defaults they do not have.
 *
 * Only literal defaults are compared. A factory that computes something --
 * `containerId`, which is random per instance -- has no value to compare
 * against, so it is skipped, and the caller reports how many were skipped so a
 * run that compared nothing cannot read as a run that found nothing wrong.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ts from 'typescript';

/** Every file under `dir` whose name ends in `suffix`, deepest last. */
function filesUnder(dir: string, suffix: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      found.push(...filesUnder(path, suffix));
    } else if (entry.name.endsWith(suffix)) {
      found.push(path);
    }
  }
  return found;
}

/** The `<script setup>` of an SFC, which is where `withDefaults` lives. */
const SCRIPT_SETUP_RE = /<script[^>]*\bsetup\b[^>]*>([\s\S]*?)<\/script>/;

/**
 * A default written the way the reference writes it, or null when it is not a
 * literal and so cannot be compared with one.
 *
 * The two sides are canonicalised rather than compared as text because they are
 * written differently on purpose: an object or array default has to be a
 * factory in Vue (`() => ({})`), the sources close their literals with a
 * trailing comma and the reference does not, and either side may quote a string
 * whichever way its formatter prefers.
 */
export function canonicalDefault(
  node: ts.Node,
  source: ts.SourceFile,
): string | null {
  // Unwrap the forms that wrap a value without changing it: the parentheses of
  // `({})`, an `as FilterSpecification` assertion, and the arrow that makes an
  // object default a factory.
  if (ts.isParenthesizedExpression(node))
    return canonicalDefault(node.expression, source);
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node))
    return canonicalDefault(node.expression, source);
  if (
    ts.isArrowFunction(node) &&
    !node.parameters.length &&
    !ts.isBlock(node.body)
  ) {
    return canonicalDefault(node.body, source);
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return `'${node.text}'`;
  }
  if (ts.isNumericLiteral(node)) return String(Number(node.text));
  if (node.kind === ts.SyntaxKind.TrueKeyword) return 'true';
  if (node.kind === ts.SyntaxKind.FalseKeyword) return 'false';
  if (node.kind === ts.SyntaxKind.NullKeyword) return 'null';
  if (ts.isIdentifier(node) && node.text === 'undefined') return 'undefined';
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return `-${Number(node.operand.text)}`;
  }

  if (ts.isArrayLiteralExpression(node)) {
    const items = node.elements.map((item) => canonicalDefault(item, source));
    if (items.some((item) => item === null)) return null;
    return `[${items.join(', ')}]`;
  }

  if (ts.isObjectLiteralExpression(node)) {
    const entries: string[] = [];
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) return null;
      const key = property.name;
      const name = ts.isIdentifier(key)
        ? key.text
        : ts.isStringLiteral(key)
          ? key.text
          : null;
      if (name === null) return null;
      const value = canonicalDefault(property.initializer, source);
      if (value === null) return null;
      entries.push(
        `${/^[A-Za-z_$][\w$]*$/.test(name) ? name : `'${name}'`}: ${value}`,
      );
    }
    return entries.length ? `{ ${entries.join(', ')} }` : '{}';
  }

  return null;
}

/**
 * A subject's defaults: the key a reader would look up, mapped to its
 * canonicalised value, or to null when the source gives a default that is not a
 * literal. A key that is absent has no default at all.
 */
export type Defaults = Map<string, string | null>;

/** The `withDefaults` block of every component, keyed by component name. */
export function componentDefaults(rootDir: string): Map<string, Defaults> {
  const found = new Map<string, Defaults>();
  for (const path of filesUnder(resolve(rootDir, 'libs/components'), '.vue')) {
    const script = SCRIPT_SETUP_RE.exec(readFileSync(path, 'utf8'))?.[1];
    if (!script) continue;
    const component = path
      .split('/')
      .pop()!
      .replace(/\.vue$/, '');
    const source = ts.createSourceFile(
      path,
      script,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const defaults: Defaults = new Map();
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'withDefaults'
      ) {
        const object = node.arguments[1];
        if (object && ts.isObjectLiteralExpression(object)) {
          for (const property of object.properties) {
            if (!ts.isPropertyAssignment(property)) continue;
            const key = property.name;
            const name = ts.isIdentifier(key)
              ? key.text
              : ts.isStringLiteral(key)
                ? key.text
                : null;
            if (name === null) continue;
            defaults.set(name, canonicalDefault(property.initializer, source));
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    found.set(component, defaults);
  }
  return found;
}

/** The defaults of every destructured binding in a function, keyed by name. */
function bindingDefaults(
  pattern: ts.ObjectBindingPattern,
  source: ts.SourceFile,
  into: Defaults,
): void {
  for (const element of pattern.elements) {
    if (!element.initializer || !ts.isIdentifier(element.name)) continue;
    // The documented name is the property, which a rename makes different from
    // the binding: `{ show: showVal = true }` documents `show`.
    const name = element.propertyName ?? element.name;
    const key = ts.isIdentifier(name)
      ? name.text
      : ts.isStringLiteral(name)
        ? name.text
        : null;
    if (key === null) continue;
    into.set(key, canonicalDefault(element.initializer, source));
  }
}

/**
 * A composable's defaults, from wherever it takes them: destructured in the
 * parameter list, or destructured out of a props object in the body. Both
 * spellings are in use, and a check that knew only one would silently pass
 * every composable written the other way.
 */
export function composableDefaults(rootDir: string): Map<string, Defaults> {
  const found = new Map<string, Defaults>();
  for (const path of filesUnder(resolve(rootDir, 'libs/composables'), '.ts')) {
    const source = ts.createSourceFile(
      path,
      readFileSync(path, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );

    const read = (name: string, node: ts.SignatureDeclaration): void => {
      const defaults = found.get(name) ?? new Map<string, string | null>();
      for (const parameter of node.parameters) {
        if (ts.isObjectBindingPattern(parameter.name)) {
          bindingDefaults(parameter.name, source, defaults);
        } else if (ts.isIdentifier(parameter.name) && parameter.initializer) {
          // A positional parameter with a default of its own, as in
          // `useDebouncedRef(initialValue, delay = 300)`. The reference
          // tabulates these by parameter name like any other input.
          defaults.set(
            parameter.name.text,
            canonicalDefault(parameter.initializer, source),
          );
        }
      }
      const body = 'body' in node ? node.body : undefined;
      if (body && ts.isBlock(body)) {
        for (const statement of body.statements) {
          if (!ts.isVariableStatement(statement)) continue;
          for (const declaration of statement.declarationList.declarations) {
            if (ts.isObjectBindingPattern(declaration.name)) {
              bindingDefaults(declaration.name, source, defaults);
            }
          }
        }
      }
      found.set(name, defaults);
    };

    const visit = (node: ts.Node): void => {
      if (ts.isFunctionDeclaration(node) && node.name)
        read(node.name.text, node);
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer &&
        (ts.isArrowFunction(node.initializer) ||
          ts.isFunctionExpression(node.initializer))
      ) {
        read(node.name.text, node.initializer);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return found;
}

/** Parses a default as the reference writes it, for comparison with a source. */
export function canonicalDocumentedDefault(text: string): string | null {
  const source = ts.createSourceFile(
    'default.ts',
    `const _ = ${text};`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const statement = source.statements[0];
  if (!statement || !ts.isVariableStatement(statement)) return null;
  const initializer = statement.declarationList.declarations[0]?.initializer;
  return initializer ? canonicalDefault(initializer, source) : null;
}
