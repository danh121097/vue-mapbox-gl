/**
 * The names the built package actually exports.
 *
 * The generated checks reproduce documentation verbatim and then have to
 * resolve the type names in it. Guessing -- importing everything capitalised
 * from the package -- turns `HTMLCanvasElement` into a missing export and
 * reports a bug that is not there. Asking the compiler is exact, and it is the
 * same question a reader asks: can I import this name from this package?
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

let cached: Set<string> | null = null;
let cachedComponents: Set<string> | null = null;
let cachedParameters: Map<string, string> | null = null;

export function packageExports(rootDir: string): Set<string> {
  if (cached) return cached;

  const entry = resolve(rootDir, 'dist/index.d.ts');
  const program = ts.createProgram([entry], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
    baseUrl: dirname(entry),
  });

  const source = program.getSourceFile(entry);
  const symbol = source && program.getTypeChecker().getSymbolAtLocation(source);
  if (!symbol) {
    throw new Error(`Could not read the exports of ${entry}.`);
  }

  cached = new Set(
    program
      .getTypeChecker()
      .getExportsOfModule(symbol)
      .map((exported) => exported.name),
  );
  return cached;
}

/**
 * The components the package exports, which the docs count separately from the
 * composables ("10 components, 38 composables" is on the npm page).
 */
export function componentExports(rootDir: string): Set<string> {
  if (cachedComponents) return cachedComponents;

  const entry = resolve(rootDir, 'dist/components/index.d.ts');
  cachedComponents = new Set(
    [
      ...readFileSync(entry, 'utf8').matchAll(
        /export\s*\{\s*default as ([A-Za-z_$][\w$]*)/g,
      ),
    ].map((match) => match[1]!),
  );
  return cachedComponents;
}

/**
 * Each exported generic function's type parameter list, verbatim, so a check
 * can repeat it: `useDebounce` is
 * `<T extends (...args: any[]) => any>`.
 *
 * Without the constraint there is nothing to instantiate the composable with,
 * and a documented `T` has to fall back to `any` -- which makes every generic
 * row pass by definition.
 */
export function typeParameters(rootDir: string): Map<string, string> {
  if (cachedParameters) return cachedParameters;

  const entry = resolve(rootDir, 'dist/index.d.ts');
  const program = ts.createProgram([entry], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
    baseUrl: dirname(entry),
  });

  const source = program.getSourceFile(entry);
  const checker = program.getTypeChecker();
  const symbol = source && checker.getSymbolAtLocation(source);
  cachedParameters = new Map();
  if (!symbol) return cachedParameters;

  for (const exported of checker.getExportsOfModule(symbol)) {
    const resolved =
      exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported;
    for (const declaration of resolved.declarations ?? []) {
      if (!ts.isFunctionDeclaration(declaration)) continue;
      const parameters = declaration.typeParameters;
      if (!parameters?.length) continue;
      cachedParameters.set(
        exported.name,
        `<${parameters.map((parameter) => parameter.getText()).join(', ')}>`,
      );
      break;
    }
  }
  return cachedParameters;
}

let cachedNames: Map<string, string[]> | null = null;

/**
 * The declared parameter names of each exported function, from its first
 * signature.
 *
 * A `Parameters` table names either the function's arguments in order
 * (`useDebouncedRef(initialValue, delay)`) or the fields of the single props
 * object most of these composables take. Nothing in the table itself says
 * which, and checking the wrong one would pass for the wrong reason, so the
 * declaration is asked.
 */
export function parameterNames(rootDir: string): Map<string, string[]> {
  if (cachedNames) return cachedNames;

  const entry = resolve(rootDir, 'dist/index.d.ts');
  const program = ts.createProgram([entry], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
    baseUrl: dirname(entry),
  });

  const source = program.getSourceFile(entry);
  const checker = program.getTypeChecker();
  const symbol = source && checker.getSymbolAtLocation(source);
  cachedNames = new Map();
  if (!symbol) return cachedNames;

  for (const exported of checker.getExportsOfModule(symbol)) {
    const resolved =
      exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported;
    for (const declaration of resolved.declarations ?? []) {
      if (!ts.isFunctionDeclaration(declaration)) continue;
      cachedNames.set(
        exported.name,
        declaration.parameters.map((parameter) => parameter.name.getText()),
      );
      break;
    }
  }
  return cachedNames;
}
