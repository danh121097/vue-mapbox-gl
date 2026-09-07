/**
 * Fails when a component declares a callback prop that shadows one of its own
 * emits.
 *
 * Vue puts an emit's listener on `$props` under `on` + the capitalised event
 * name. A component that also declares a prop of that name has not declared two
 * things: it has declared one prop twice. `<Maplibre @error="fn">` reached `fn`
 * once as the listener and once as the prop the component then called itself,
 * so the handler fired twice; and the two declarations intersect, so the prop's
 * type became a function satisfying both signatures at once -- which, when the
 * signatures disagree, nothing can satisfy.
 *
 * Three components shipped this: `Maplibre` (`error`, `load`), `GeoJsonSource`
 * (`error`, `load`) and `GeolocateControls` (`error`, `geolocate`). None of it
 * was visible in the reference, because after the intersection the reference's
 * own Props and Events tables both still described something real.
 *
 * The check reads the built declarations rather than the sources, so it sees
 * exactly the shape a consumer's editor does, and it reads them as a syntax
 * tree rather than as text: the props of a compiled SFC arrive as
 * `__VLS_TypePropsToRuntimeProps<P>` and its emits as the `Readonly<{ ... }>`
 * that is intersected onto them, and those two are the only places the two
 * halves stay separate before Vue merges them.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

export interface CollisionProblem {
  location: string;
  message: string;
}

function memberName(member: ts.TypeElement): string | null {
  const name = member.name;
  if (!name) return null;
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name)) return name.text;
  return null;
}

/**
 * The props a component declares itself, read from the interface named by its
 * `__VLS_TypePropsToRuntimeProps<...>` argument. The argument is wrapped in
 * `Partial<...>` whenever the SFC wrote `withDefaults`, so one layer of wrapper
 * is unwrapped before the name is taken.
 */
function declaredProps(source: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  const interfaces = new Map<string, ts.InterfaceDeclaration>();
  source.forEachChild((node) => {
    if (ts.isInterfaceDeclaration(node)) interfaces.set(node.name.text, node);
  });

  const visit = (node: ts.Node): void => {
    if (
      ts.isTypeReferenceNode(node) &&
      ts.isIdentifier(node.typeName) &&
      node.typeName.text === '__VLS_TypePropsToRuntimeProps'
    ) {
      let argument = node.typeArguments?.[0];
      while (
        argument &&
        ts.isTypeReferenceNode(argument) &&
        ts.isIdentifier(argument.typeName) &&
        argument.typeName.text === 'Partial'
      ) {
        argument = argument.typeArguments?.[0];
      }
      if (
        argument &&
        ts.isTypeReferenceNode(argument) &&
        ts.isIdentifier(argument.typeName)
      ) {
        const declaration = interfaces.get(argument.typeName.text);
        for (const member of declaration?.members ?? []) {
          const name = memberName(member);
          if (name) names.add(name);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return names;
}

/**
 * The listener keys Vue adds for the component's emits: the members of the
 * `Readonly<{ ... }>` intersected onto the props. Every other `Readonly<...>` in
 * a compiled declaration wraps a named type rather than a literal, so a literal
 * argument identifies this one without having to count type parameters.
 */
function emitHandlerKeys(source: ts.SourceFile): Set<string> {
  const keys = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isTypeReferenceNode(node) &&
      ts.isIdentifier(node.typeName) &&
      node.typeName.text === 'Readonly'
    ) {
      const argument = node.typeArguments?.[0];
      if (argument && ts.isTypeLiteralNode(argument)) {
        for (const member of argument.members) {
          const name = memberName(member);
          if (name?.startsWith('on')) keys.add(name);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return keys;
}

/**
 * Every component declaration in `dist/`, checked for the collision. Returns
 * the number of components inspected alongside the problems, so a run that
 * silently found no declarations to read cannot be mistaken for a clean one.
 */
export function checkPropEmitCollisions(rootDir: string): {
  problems: CollisionProblem[];
  checked: number;
} {
  const dir = resolve(rootDir, 'dist/components');
  const problems: CollisionProblem[] = [];
  let checked = 0;

  for (const entry of readdirSync(dir).sort()) {
    if (!entry.endsWith('.vue.d.ts')) continue;
    const path = join(dir, entry);
    const text = readFileSync(path, 'utf8');
    const source = ts.createSourceFile(
      path,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    checked++;

    const props = declaredProps(source);
    const handlers = emitHandlerKeys(source);
    for (const handler of handlers) {
      if (!props.has(handler)) continue;
      const event = handler.slice(2);
      problems.push({
        location: relative(rootDir, path),
        message:
          `error: '${handler}' is both a declared prop and the listener Vue ` +
          `adds for the '${event[0]!.toLowerCase()}${event.slice(1)}' emit, ` +
          `so one handler fires twice — rename the prop`,
      });
    }
  }

  return { problems, checked };
}
