/**
 * Materialises the extracted code blocks as a compilable TypeScript project.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Snippet } from './extract-doc-snippets';
import type { ReturnTable } from './extract-doc-tables';

/**
 * How tolerant the snippet compiler is, and why.
 *
 * Documentation examples are written for people, so most of them leave types
 * to inference — `function onMapLoad(map)` is the normal way to write a docs
 * callback and should not be an error. Turning `strict` off keeps the check
 * aimed at the failures that actually mislead a reader: an import that does not
 * exist, a prop that is not on the component, a field that is not on the return
 * type, an argument of the wrong shape. Those are all still reported here.
 */
const COMPILER_OPTIONS = {
  target: 'ESNext',
  module: 'ESNext',
  moduleResolution: 'Bundler',
  jsx: 'preserve',
  lib: ['ESNext', 'DOM'],
  strict: false,
  noImplicitAny: false,
  esModuleInterop: true,
  allowSyntheticDefaultImports: true,
  resolveJsonModule: true,
  skipLibCheck: true,
  noEmit: true,
  // Without this the snippets pick up @types/node and every other ambient
  // package in the repo, which a consumer installing this library would not.
  types: [],
  baseUrl: '..',
  paths: {
    // Resolve the package the way an installed consumer's bundler does: through
    // the built declarations, not through libs/. A symbol that exists in source
    // but never reaches dist/ has to fail here.
    'vue3-maplibre-gl': ['dist/index.d.ts'],
    'vue3-maplibre-gl/maplibre': ['dist/maplibre-reexports.d.ts'],
    'vue3-maplibre-gl/components': ['dist/components/index.d.ts'],
    'vue3-maplibre-gl/composables': ['dist/composables/index.d.ts'],
    // The maintainer pages quote internal modules by their source alias; those
    // are checked against libs/, since that is what they are quoting.
    '@libs/types': ['libs/types'],
    '@libs/composables': ['libs/composables'],
    '@libs/enums': ['libs/enums'],
    '@libs/components': ['libs/components'],
    '@libs/helpers': ['libs/helpers'],
  },
} as const;

const SHIMS = `// Stylesheet imports carry no types; a bundler resolves them, tsc does not.
declare module '*.css';
declare module '*.scss';

/**
 * Every shape a composable can return, intersected.
 *
 * \`ReturnType\` resolves an overloaded function to its *last* signature, and
 * several composables here keep a narrow legacy overload last -- \`useJumpTo\`'s
 * is \`{ jumpTo }\` alone. Checking a Returns table against that would report
 * every modern field as missing. Intersecting the overloads instead means a
 * field counts as real if any call form returns it, which is what the tables
 * describe. The cost is that this cannot tell which overload a field belongs to.
 */
type DocumentedReturn<T> = T extends {
  (...args: any[]): infer A;
  (...args: any[]): infer B;
  (...args: any[]): infer C;
}
  ? A & B & C
  : T extends { (...args: any[]): infer A; (...args: any[]): infer B }
    ? A & B
    : T extends (...args: any[]) => infer A
      ? A
      : never;
`;

/** A block's filename, unique because no two fences start on the same line. */
export function generatedName(snippet: Snippet): string {
  const stem = snippet.file
    .replace(/^docs\//, '')
    .replace(/\.md$/, '')
    .replace(/[^\w]+/g, '-');
  // A generated check is named after the same page as the fences around it, so
  // it carries a label: a fence and a Returns heading can share a line number,
  // and one heading can document several composables.
  const label = snippet.label ? `${snippet.label}-` : '';
  return `${stem}-${label}${snippet.fenceLine}${snippet.ext}`;
}

/**
 * Turns a Returns table into a module that asserts each row names a real field.
 *
 * One `type _N = Returned['field']` per row, and nothing else on those lines,
 * so a row that names nothing fails alone and points at itself. The check is
 * one-directional on purpose: it proves every documented field exists, not that
 * every existing field is documented. Several composables spread a shared
 * actions object and their tables abridge it deliberately.
 */
/** Type names the compiler already knows; importing them would shadow them. */
const AMBIENT = new Set([
  'Array',
  'Awaited',
  'Blob',
  'Boolean',
  'Error',
  'Event',
  'Exclude',
  'File',
  'HTMLElement',
  'HTMLImageElement',
  'ImageBitmap',
  'ImageData',
  'Number',
  'Omit',
  'Parameters',
  'Partial',
  'Pick',
  'Promise',
  'Readonly',
  'Record',
  'RequestInit',
  'Required',
  'ReturnType',
  'String',
  'Uint8Array',
]);

/**
 * A single capital is a type parameter of the composable being documented, not
 * a type to import. It is declared as `any`, so a row like `Ref<T>` checks its
 * wrapper but not its element type.
 *
 * `unknown` would check the element type too, and does match how
 * `DocumentedReturn` instantiates an unconstrained parameter — but not a
 * constrained one. `useDebounce<T extends (...args: any[]) => any>` documents
 * `() => ReturnType<T> | undefined`, and `unknown` does not satisfy that
 * constraint. There is no one default that fits both, and `any` is the one that
 * fails open rather than failing wrongly.
 */
const GENERIC_RE = /^[A-Z]$/;

/** Reactivity wrappers, which come from Vue rather than from this package. */
const FROM_VUE = new Set([
  'ComputedRef',
  'Ref',
  'ShallowRef',
  'WatchSource',
  'WritableComputedRef',
]);

/**
 * Names the package root binds to something else.
 *
 * `Marker` and `Popup` at the root are this library's Vue components; MapLibre's
 * classes of those names are re-exported as `MaplibreMarker` / `MaplibrePopup`.
 * A Returns row saying `Marker` means MapLibre's, so the check has to take it
 * from MapLibre or it would compare a component against a marker and fail.
 */
const FROM_MAPLIBRE = new Set(['Marker', 'Popup']);

/** Type names a documented type expression refers to. */
function referencedTypes(expression: string): string[] {
  return [...new Set(expression.match(/\b[A-Z][A-Za-z0-9_]*/g) ?? [])].filter(
    (name) => !AMBIENT.has(name) && !GENERIC_RE.test(name),
  );
}

/**
 * Turns a Returns table into a module that checks each row against the type.
 *
 * Per row: the field must exist, and the documented type and the real one must
 * each be assignable to the other. Mutual assignability rather than identity,
 * because the tables abridge on purpose -- they leave off the trailing
 * `StyleSetterOptions` argument every style setter takes, and a function type
 * with fewer parameters is interchangeable with one that has more optional
 * ones. It still catches a wrong parameter type, a wrong wrapper
 * (`Ref` where the code returns a `ComputedRef`) and a `void` documented for
 * something that returns a promise.
 *
 * This check is one-directional: it proves every documented field exists, not
 * that every existing field is documented. `coverageSnippet` runs the other
 * direction once per composable, over every row that applies to it -- a section
 * documenting two composables at once has a shared table and a labelled one
 * each, and neither alone is the full list for either composable.
 */
export function tableSnippet(table: ReturnTable, nth = 1): Snippet {
  const names = new Set(
    table.fields.flatMap((field) =>
      field.type ? referencedTypes(field.type) : [],
    ),
  );
  const from = (source: Set<string> | null, module: string): string[] => {
    const wanted = [...names]
      .filter((name) =>
        source
          ? source.has(name)
          : !FROM_VUE.has(name) && !FROM_MAPLIBRE.has(name),
      )
      .sort();
    return wanted.length
      ? [`import type { ${wanted.join(', ')} } from '${module}';`]
      : [];
  };

  const generics = [
    ...new Set(
      table.fields.flatMap((field) =>
        (field.type?.match(/\b[A-Z]\b/g) ?? []).filter((name) =>
          GENERIC_RE.test(name),
        ),
      ),
    ),
  ].sort();

  const head = [
    ...generics.map((name) => `type ${name} = any;`),
    ...from(FROM_VUE, 'vue'),
    ...from(FROM_MAPLIBRE, 'maplibre-gl'),
    ...from(null, 'vue3-maplibre-gl'),
    `import { ${table.composable} } from 'vue3-maplibre-gl';`,
    `type Returned = DocumentedReturn<typeof ${table.composable}>;`,
  ];

  const rows: string[] = [];
  const rowLines: number[] = [];
  table.fields.forEach((field, index) => {
    const real = `Returned['${field.name}']`;
    const lines = [`type _${index} = ${real};`];
    if (field.type) {
      lines.push(
        `type _d${index} = ${field.type};`,
        `const _to${index}: _d${index} = null as unknown as _${index};`,
        `const _from${index}: _${index} = null as unknown as _d${index};`,
      );
    }
    rows.push(...lines);
    rowLines.push(...lines.map(() => field.line));
  });

  return {
    file: table.file,
    fenceLine: table.headingLine,
    lang: 'ts',
    ext: '.ts',
    label: `table-${table.composable}-${nth}`,
    code: [...head, ...rows].join('\n'),
    lineMap: [...head.map(() => table.headingLine), ...rowLines],
  };
}

export interface Coverage {
  file: string;
  composable: string;
  /** 1-based line the failure should point at: the `Returns` heading, or the section's. */
  line: number;
  /** Every field name documented for this composable, across all its tables. */
  documented: string[];
  /** Types or composables the section says the return spreads in. */
  spreads: string[];
}

/**
 * The other direction: a field the composable returns that no row documents.
 *
 * Without it a table can be a true but partial list, and a section that
 * describes its return in a sentence is unchecked entirely -- the only signal
 * being a note nobody has to read. Indexing a one-property object with the
 * leftover keys turns "the reference never lists these" into a failure that
 * names each of them; a return that is a function or void has no keys, so the
 * index resolves and it passes.
 *
 * A section may declare a spread source (`<!-- returns-spread: X -->`) for a
 * return that folds in another documented shape. That abridgement stays a
 * checked claim: only members of `X` are forgiven, so a field belonging to
 * neither the table nor `X` still fails.
 */
export function coverageSnippet(coverage: Coverage): Snippet {
  const { composable, documented, spreads } = coverage;
  const composableSpreads = spreads.filter((name) => name.startsWith('use'));
  const typeSpreads = spreads.filter((name) => !name.startsWith('use'));

  const covered = [
    ...documented.map((name) => `'${name}'`),
    ...typeSpreads.map((name) => `keyof ${name}`),
    ...composableSpreads.map(
      (name) => `keyof DocumentedReturn<typeof ${name}>`,
    ),
    // A tuple return is documented by index, and should not be asked to
    // document `length`, `map` and the rest of the array surface. The
    // numeric-literal keys survive this, which are the real rows.
    ...(documented.some((name) => /^\d+$/.test(name))
      ? ['keyof unknown[]']
      : []),
  ];

  const values = [composable, ...composableSpreads].sort();
  const code = [
    ...(typeSpreads.length
      ? [
          `import type { ${typeSpreads.sort().join(', ')} } from 'vue3-maplibre-gl';`,
        ]
      : []),
    `import { ${values.join(', ')} } from 'vue3-maplibre-gl';`,
    `type Extra = Exclude<`,
    `  keyof DocumentedReturn<typeof ${composable}>,`,
    covered.length ? `  ${covered.join(' | ')}` : '  never',
    `>;`,
    `type Undocumented = { __all: true }[[Extra] extends [never]`,
    `  ? '__all'`,
    `  : Extra];`,
    'export type { Undocumented };',
  ];

  return {
    file: coverage.file,
    fenceLine: coverage.line,
    lang: 'ts',
    ext: '.ts',
    label: `undocumented-${composable}`,
    code: code.join('\n'),
    lineMap: code.map(() => coverage.line),
  };
}

/**
 * Gives a Vue block a TypeScript script tag when it does not declare one.
 *
 * Most examples in these docs are written with a plain `<script setup>`, which
 * vue-tsc would otherwise leave almost entirely unchecked — including the
 * template, which is where component props are validated. The substitution
 * stays on one line so every diagnostic still maps to the right markdown line.
 */
function withTypeScriptScript(code: string): string {
  return code.replace(
    /<script(\s[^>]*)?>/g,
    (tag: string, attrs: string | undefined) =>
      /\blang\s*=/.test(attrs ?? '') ? tag : `<script${attrs ?? ''} lang="ts">`,
  );
}

/**
 * Anything with no import and no export is a script, not a module, so its
 * top-level names would collide across snippets. Appending — never prepending —
 * keeps line numbers aligned with the markdown.
 */
function asModule(code: string): string {
  return /^\s*(import|export)\b/m.test(code) ? code : `${code}\nexport {};`;
}

export function writeSnippetProject(
  workDir: string,
  snippets: Snippet[],
  /**
   * Compiler options to merge over the defaults. The generated Returns checks
   * are compiled a second time with `strictNullChecks` on, because with it off
   * `Foo | null` and `Foo` are the same type -- so a row promising a nullable
   * accessor, or omitting the `| null` the code really returns, would pass.
   */
  overrides: Record<string, unknown> = {},
): Map<string, Snippet> {
  const byName = new Map<string, Snippet>();

  for (const snippet of snippets) {
    const name = generatedName(snippet);
    // A collision would overwrite the earlier file and check it twice instead
    // of checking both, which looks exactly like passing.
    if (byName.has(name)) {
      throw new Error(
        `Two snippets generated the same filename (${name}). ` +
          `${snippet.file}:${snippet.fenceLine} needs a distinct label.`,
      );
    }
    byName.set(name, snippet);
    const code =
      snippet.ext === '.vue'
        ? withTypeScriptScript(snippet.code)
        : asModule(snippet.code);
    writeFileSync(resolve(workDir, name), code);
  }

  writeFileSync(resolve(workDir, 'shims.d.ts'), SHIMS);
  writeFileSync(
    resolve(workDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: { ...COMPILER_OPTIONS, ...overrides },
        include: ['**/*.ts', '**/*.vue'],
      },
      null,
      2,
    )}\n`,
  );

  return byName;
}
