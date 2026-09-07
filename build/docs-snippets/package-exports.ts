/**
 * The names the built package actually exports.
 *
 * The generated checks reproduce documentation verbatim and then have to
 * resolve the type names in it. Guessing -- importing everything capitalised
 * from the package -- turns `HTMLCanvasElement` into a missing export and
 * reports a bug that is not there. Asking the compiler is exact, and it is the
 * same question a reader asks: can I import this name from this package?
 */
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

let cached: Set<string> | null = null;

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
