/**
 * Materialises the extracted code blocks as a compilable TypeScript project.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Snippet } from './extract-doc-snippets';
import type { DocumentedType } from './extract-doc-types';
import type { TemplateAttribute } from './extract-template-attributes';
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
  'MouseEvent',
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
  'TouchEvent',
  'Uint8Array',
  'WheelEvent',
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
export function tableSnippet(
  table: ReturnTable,
  nth = 1,
  /**
   * The composable's own type parameter list, verbatim, when it has one. With
   * it a documented `T` is a real type parameter; without it `T` can only be
   * `any`, and a generic row passes by definition.
   */
  realParams?: string,
): Snippet {
  // The parameter list contributes the types its constraints name
  // (`LayerSpecification`), but not the parameter names themselves (`Layer`).
  const parameterNames = new Set(
    (realParams ?? '')
      .slice(1, -1)
      .split(/,(?![^<]*>)/)
      .map((parameter) => parameter.trim().split(/[\s=]/)[0]!)
      .filter(Boolean),
  );
  const names = new Set(
    [
      ...table.fields.flatMap((field) =>
        field.type ? referencedTypes(field.type) : [],
      ),
      ...referencedTypes(realParams ?? ''),
    ].filter((name) => !parameterNames.has(name)),
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

  // A generic row is checked inside a function that repeats the composable's
  // own parameter list and instantiates it with those parameters, so `T` is
  // abstract rather than `any`. The documented letters are aliased to the real
  // ones positionally, because the reference is free to call it `T` where the
  // signature calls it `Layer`.
  const generic = Boolean(generics.length && realParams);
  const realNames = [...parameterNames];

  const head = [
    ...(generic ? [] : generics.map((name) => `type ${name} = any;`)),
    ...from(FROM_VUE, 'vue'),
    ...from(FROM_MAPLIBRE, 'maplibre-gl'),
    ...from(null, 'vue3-maplibre-gl'),
    `import { ${table.composable} } from 'vue3-maplibre-gl';`,
    ...(generic
      ? [
          `function _rows${realParams}(): void {`,
          ...generics
            .map((name, index) =>
              realNames[index] && realNames[index] !== name
                ? `type ${name} = ${realNames[index]};`
                : `type ${name} = ${realNames[index] ?? 'any'};`,
            )
            .filter((line) => !/^type (\w+) = \1;$/.test(line)),
          `type Returned = DocumentedReturn<` +
            `typeof ${table.composable}<${realNames.join(', ')}>>;`,
        ]
      : [`type Returned = DocumentedReturn<typeof ${table.composable}>;`]),
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

  const tail = generic ? ['}', 'export { _rows };'] : [];

  return {
    file: table.file,
    fenceLine: table.headingLine,
    lang: 'ts',
    ext: '.ts',
    label: `table-${table.composable}-${nth}`,
    code: [...head, ...rows, ...tail].join('\n'),
    lineMap: [
      ...head.map(() => table.headingLine),
      ...rowLines,
      ...tail.map(() => table.headingLine),
    ],
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

/**
 * Turns a documented type into a module that compares it with the real one.
 *
 * `docs/api/types.md` transcribes `libs/types` by hand, and a transcript
 * drifts. Its fences compiled before this, but only in the weakest sense:
 * `Cannot find name` is on the allowlist for hand-written examples, so a fence
 * naming a type that no longer exists passed, and nothing ever compared a
 * documented shape with the exported one.
 *
 * The fence is reproduced verbatim -- so a diagnostic inside it lands on the
 * line the reader would open -- and the exported type is imported beside it
 * under an alias. The two must be assignable to each other. A generic type is
 * compared inside a function that repeats its parameter list, so `T` is a real
 * type parameter and `Nullable<T>` cannot pass by collapsing to `any`.
 */
export function documentedTypeSnippet(
  file: string,
  type: DocumentedType,
  /**
   * What the built package exports. A name it does not export is left alone
   * rather than imported: `HTMLCanvasElement` is a global, and importing it
   * would report a missing export that is not missing. A name that is neither
   * exported nor global then fails as `Cannot find name`, which is the right
   * answer -- the reference is using a type a reader cannot get hold of.
   */
  exported: Set<string>,
): Snippet {
  // Names the fence declares itself are not imports; everything else it names
  // has to resolve through the package's public surface, the same way a reader
  // copying the snippet would resolve it.
  const declared = new Set(
    [
      ...type.code.matchAll(/\b(?:type|interface|enum)\s+([A-Za-z_$][\w$]*)/g),
    ].map((match) => match[1]!),
  );
  // Only the parameter names, not the types they are constrained to:
  // `<Layer extends LayerSpecification>` declares `Layer` and *references*
  // `LayerSpecification`, which still has to be imported.
  const params = new Set(
    (type.params ?? '')
      .slice(1, -1)
      .split(',')
      .map((param) => param.trim().split(/[\s=]/)[0]!)
      .filter(Boolean),
  );
  // An enum body is member names and literals, and a member name looks exactly
  // like a type name; it references nothing to import.
  const names = (type.kind === 'enum' ? [] : referencedTypes(type.code)).filter(
    (name) => !declared.has(name) && !params.has(name),
  );
  const from = (source: Set<string> | null, module: string): string[] => {
    const wanted = names
      .filter((name) =>
        source
          ? source.has(name)
          : !FROM_VUE.has(name) &&
            !FROM_MAPLIBRE.has(name) &&
            exported.has(name),
      )
      .sort();
    return wanted.length
      ? [`import type { ${wanted.join(', ')} } from '${module}';`]
      : [];
  };

  const head = [
    ...from(FROM_VUE, 'vue'),
    ...from(FROM_MAPLIBRE, 'maplibre-gl'),
    ...from(null, 'vue3-maplibre-gl'),
    type.kind === 'enum'
      ? `import { ${type.name} as _real } from 'vue3-maplibre-gl';`
      : `import type { ${type.name} as _real } from 'vue3-maplibre-gl';`,
  ];

  const body = type.code.split('\n');

  // An enum is a set of names and values, not a shape: two enums with the same
  // members are still unassignable to each other, so they are compared member
  // by member instead.
  const tail =
    type.kind === 'enum'
      ? [
          `type _Extra = Exclude<keyof typeof ${type.name}, keyof typeof _real>;`,
          `type _Missing = Exclude<keyof typeof _real, keyof typeof ${type.name}>;`,
          `type _Members = { __ok: true }[[_Extra | _Missing] extends [never]`,
          `  ? '__ok'`,
          `  : _Extra | _Missing];`,
          `type _Shared = keyof typeof _real & keyof typeof ${type.name};`,
          `type _Wrong = {`,
          `  [K in _Shared]: \`\${(typeof ${type.name})[K]}\` extends \`\${(typeof _real)[K]}\``,
          `    ? never`,
          `    : K;`,
          `}[_Shared];`,
          `type _Values = { __ok: true }[[_Wrong] extends [never] ? '__ok' : _Wrong];`,
          'export type { _Members, _Values };',
        ]
      : type.params
        ? [
            `function _compare${type.params}(): void {`,
            `  const _to: _real${stripConstraints(type.params)} =`,
            `    null as unknown as ${type.name}${stripConstraints(type.params)};`,
            `  const _from: ${type.name}${stripConstraints(type.params)} =`,
            `    null as unknown as _real${stripConstraints(type.params)};`,
            `  void _to;`,
            `  void _from;`,
            `}`,
            'export { _compare };',
          ]
        : [
            `const _to: _real = null as unknown as ${type.name};`,
            `const _from: ${type.name} = null as unknown as _real;`,
            'export { _to, _from };',
          ];

  return {
    file,
    fenceLine: type.codeLine - 1,
    lang: 'ts',
    ext: '.ts',
    label: `type-${type.name}`,
    code: [...head, ...body, ...tail].join('\n'),
    lineMap: [
      ...head.map(() => type.headingLine),
      ...body.map((_, index) => type.codeLine + index),
      ...tail.map(() => type.headingLine),
    ],
  };
}

/** `<Layer extends LayerSpecification>` used as an argument: `<Layer>`. */
function stripConstraints(params: string): string {
  const inner = params
    .slice(1, -1)
    .split(',')
    .map((param) =>
      param
        .split(/\s+extends\s+/)[0]!
        .split('=')[0]!
        .trim(),
    )
    .filter(Boolean);
  return `<${inner.join(', ')}>`;
}

/**
 * Turns the attributes an example puts on this package's components into
 * assertions that each one is a real prop or emit.
 *
 * Vue lets an unknown attribute fall through to the root element, so
 * `vue-tsc` compiles a misspelled prop without a word -- and a reader who
 * copies the example gets an attribute that silently does nothing. One
 * assertion per attribute, so a wrong one fails on its own line.
 */
export function attributeSnippet(
  snippet: Snippet,
  attributes: TemplateAttribute[],
): Snippet {
  const components = [
    ...new Set(attributes.map((attribute) => attribute.component)),
  ].sort();

  const head = [`import { ${components.join(', ')} } from 'vue3-maplibre-gl';`];

  const rows: string[] = [];
  const rowLines: number[] = [];
  attributes.forEach((attribute, index) => {
    const props = `keyof InstanceType<typeof ${attribute.component}>['$props']`;
    const lines = [
      `type _u${index} = Exclude<'${attribute.prop}', ${props}>;`,
      `type _p${index} = { __prop: true }[[_u${index}] extends [never] ? '__prop' : _u${index}];`,
      `export type { _p${index} };`,
    ];
    rows.push(...lines);
    // The attribute's own line in the markdown: the fence line, plus its line
    // inside the block, plus one for the fence itself.
    rowLines.push(...lines.map(() => snippet.fenceLine + attribute.line + 1));
  });

  return {
    file: snippet.file,
    fenceLine: snippet.fenceLine,
    lang: 'ts',
    ext: '.ts',
    label: 'attrs',
    code: [...head, ...rows].join('\n'),
    lineMap: [...head.map(() => snippet.fenceLine), ...rowLines],
  };
}

/**
 * The prop key Vue gives an emit. Vue capitalises the first letter and nothing
 * else, so `data-update` becomes `onData-update` and `update:show` becomes
 * `onUpdate:show` -- camelising here would look right and match nothing.
 */
function handlerKey(event: string): string {
  return `on${event[0]!.toUpperCase()}${event.slice(1)}`;
}

/**
 * Imports for the types a set of rows names, split by where they come from.
 * Shared by every table check: the columns quote types by bare name, and a
 * reader has to be able to import each one from somewhere.
 */
function typeImports(types: string[], exported?: Set<string>): string[] {
  const names = [...new Set(types.flatMap((type) => referencedTypes(type)))];
  const from = (source: Set<string> | null, module: string): string[] => {
    const wanted = names
      .filter((name) =>
        source
          ? source.has(name)
          : !FROM_VUE.has(name) &&
            !FROM_MAPLIBRE.has(name) &&
            (exported ? exported.has(name) : true),
      )
      .sort();
    return wanted.length
      ? [`import type { ${wanted.join(', ')} } from '${module}';`]
      : [];
  };
  return [
    ...from(FROM_VUE, 'vue'),
    ...from(FROM_MAPLIBRE, 'maplibre-gl'),
    ...from(null, 'vue3-maplibre-gl'),
  ];
}

/**
 * Turns a component's `Props` or `Events` table into assertions.
 *
 * These tables were the last unchecked ones in the reference. A `Props` row
 * names a key of `$props` and gives its type; an `Events` row names an emit --
 * whose key is `onFoo` -- and gives the *payload*, which is the handler's first
 * argument rather than the handler itself.
 */
export function componentTableSnippet(
  table: ReturnTable,
  kind: 'props' | 'events',
): Snippet {
  const head = [
    ...typeImports(table.fields.map((field) => field.type ?? '')),
    `import { ${table.composable} } from 'vue3-maplibre-gl';`,
    `type Props = InstanceType<typeof ${table.composable}>['$props'];`,
  ];

  const rows: string[] = [];
  const rowLines: number[] = [];
  table.fields.forEach((field, index) => {
    const key = kind === 'events' ? handlerKey(field.name) : field.name;
    // `$props` marks an optional prop `| undefined`; the Default column is
    // where the reference says so, not the Type one.
    // A `void` payload is the table saying the emit carries nothing, so the
    // claim to check is that the handler takes no arguments -- reading
    // `Parameters<...>[0]` off it would fail as a missing tuple element and
    // report a row that is right.
    const payload = field.type === 'void';
    const real =
      kind !== 'events'
        ? `NonNullable<Props['${key}']>`
        : payload
          ? `Parameters<NonNullable<Props['${key}']>>['length']`
          : `Parameters<NonNullable<Props['${key}']>>[0]`;
    const lines = [`type _${index} = ${real};`];
    if (payload) {
      lines.push(`const _n${index}: 0 = null as unknown as _${index};`);
      rows.push(...lines);
      rowLines.push(...lines.map(() => field.line));
      return;
    }
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
    label: `${kind}-${table.composable}`,
    code: [...head, ...rows].join('\n'),
    lineMap: [...head.map(() => table.headingLine), ...rowLines],
  };
}

export interface ComponentCoverage {
  file: string;
  component: string;
  line: number;
  props: string[];
  events: string[];
  /** A component whose events this one says it shares. */
  eventsLike: string[];
}

/**
 * The other direction for a component: a prop or emit no row documents.
 *
 * Vue's own `key`, `ref`, `class` and `style` live on `$props` too, so they are
 * excluded -- they belong to every component and to none of these tables.
 */
export function componentCoverageSnippet(coverage: ComponentCoverage): Snippet {
  const { component, props, events, eventsLike } = coverage;
  const documented = [
    ...props.map((name) => `'${name}'`),
    ...events.map((name) => `'${handlerKey(name)}'`),
    ...eventsLike.map(
      (other) => `keyof InstanceType<typeof ${other}>['$props']`,
    ),
  ];

  const imports = [component, ...eventsLike].sort();
  const code = [
    `import type {`,
    `  AllowedComponentProps,`,
    `  ComponentCustomProps,`,
    `  VNodeProps,`,
    `} from 'vue';`,
    `import { ${imports.join(', ')} } from 'vue3-maplibre-gl';`,
    `type Extra = Exclude<`,
    `  keyof InstanceType<typeof ${component}>['$props'],`,
    `  | keyof VNodeProps`,
    `  | keyof AllowedComponentProps`,
    `  | keyof ComponentCustomProps`,
    ...(documented.length ? [`  | ${documented.join(' | ')}`] : []),
    `>;`,
    `type Undocumented = { __member: true }[[Extra] extends [never]`,
    `  ? '__member'`,
    `  : Extra];`,
    'export type { Undocumented };',
  ];

  return {
    file: coverage.file,
    fenceLine: coverage.line,
    lang: 'ts',
    ext: '.ts',
    label: `undocumented-${component}`,
    code: code.join('\n'),
    lineMap: code.map(() => coverage.line),
  };
}

/**
 * Turns a `Parameters` table into a call the compiler has to accept.
 *
 * Checking these rows by name against `Parameters<typeof f>` walks straight
 * into the overload trap -- that helper resolves to the *last* signature -- so
 * the table is checked by making the call it describes instead. Overload
 * resolution then happens the way it does for a reader, excess-property
 * checking catches a key the argument has no room for, and each row's declared
 * type has to be a value the parameter accepts.
 *
 * A table names either the function's arguments in order or the fields of the
 * single props object; `declared` is the parameter list from the built
 * declarations, which is what decides between them.
 */
export function parametersSnippet(
  table: ReturnTable,
  declared: string[] | undefined,
  nth = 1,
  /** The composable's own type parameter list, as `tableSnippet` takes it. */
  realParams?: string,
): Snippet {
  const rows = table.fields.filter((field) => field.type);
  // A single row against a single parameter is that parameter, whatever the
  // row calls it -- several of these take one destructured props object, whose
  // declared "name" is the whole pattern. Otherwise the rows are the arguments
  // in order only if the declaration has a parameter for each of their names;
  // anything else is the fields of the props object.
  const positional = Boolean(
    declared?.length &&
      (rows.length === 1 ||
        rows.every((field) => declared.includes(field.name))),
  );

  const realNames = (realParams ?? '')
    .slice(1, -1)
    .split(/,(?![^<]*>)/)
    .map((parameter) => parameter.trim().split(/[\s=]/)[0]!)
    .filter(Boolean);
  const generics = [
    ...new Set(
      rows.flatMap((field) =>
        (field.type!.match(/\b[A-Z]\b/g) ?? []).filter((name) =>
          GENERIC_RE.test(name),
        ),
      ),
    ),
  ].sort();
  // Same device as `tableSnippet`: a documented `T` is checked as a real type
  // parameter when the composable has one, and only falls back to `any` when
  // it does not.
  const generic = Boolean(generics.length && realParams);

  const head = [
    ...(generic ? [] : generics.map((name) => `type ${name} = any;`)),
    ...typeImports(rows.map((field) => field.type!)).map((line) =>
      // A documented type parameter is not a name to import.
      generics.some((name) => line.includes(`{ ${name} }`)) ? '' : line,
    ),
    `import { ${table.composable} } from 'vue3-maplibre-gl';`,
    ...(generic
      ? [
          `function _call${realParams}(): void {`,
          ...generics
            .map(
              (name, index) => `type ${name} = ${realNames[index] ?? 'any'};`,
            )
            .filter((line) => !/^type (\w+) = \1;$/.test(line)),
        ]
      : []),
  ].filter(Boolean);

  const values: string[] = [];
  const valueLines: number[] = [];
  rows.forEach((field, index) => {
    // `const x = null as unknown as T` rather than `declare const`, which is a
    // modifier TypeScript will not accept inside the function body a generic
    // table is checked in.
    values.push(`const _v${index} = null as unknown as ${field.type};`);
    valueLines.push(field.line);
  });

  // Void the result: these composables return values nothing here uses, and an
  // unused expression is a lint error in the generated project.
  //
  // The object form is written one property per line so a diagnostic about one
  // of them maps back to the row that wrote it. An overload failure is still
  // reported at the call, which maps to the heading -- the message names the
  // property either way.
  const call = positional
    ? [
        `void ${table.composable}(` +
          `${rows.map((_, index) => `_v${index}`).join(', ')});`,
      ]
    : [
        `void ${table.composable}({`,
        ...rows.map((field, index) => `  '${field.name}': _v${index},`),
        `});`,
      ];
  const callLines = positional
    ? [table.headingLine]
    : [
        table.headingLine,
        ...rows.map((field) => field.line),
        table.headingLine,
      ];
  if (generic) {
    call.push('}', 'export { _call };');
    callLines.push(table.headingLine, table.headingLine);
  }

  return {
    file: table.file,
    fenceLine: table.headingLine,
    lang: 'ts',
    ext: '.ts',
    label: `parameters-${table.composable}-${nth}`,
    code: [...head, ...values, ...call].join('\n'),
    lineMap: [
      ...head.map(() => table.headingLine),
      ...valueLines,
      ...callLines,
    ],
  };
}

/**
 * Turns a component's `Slots` table into assertions.
 *
 * A slot table carries no types, so both directions are about names: every
 * documented slot has to be one the component renders, and every slot the
 * component renders has to have a row. A misspelled slot name in a template is
 * silent at runtime -- the content simply never appears -- so a misspelled one
 * in the reference is worth just as little.
 */
export function slotSnippet(table: ReturnTable): Snippet {
  const documented = table.fields.map((field) => `'${field.name}'`);
  const head = [
    `import { ${table.composable} } from 'vue3-maplibre-gl';`,
    // `$slots` on a compiled SFC is the template's own slots intersected with
    // Vue's generic `{ [name: string]: Slot | undefined }`, and that index
    // signature would make both halves of this check pass for anything: every
    // name resolves, and `keyof` collapses the literal names into `string`.
    // Dropping the index signature leaves the names the template declares.
    'type Named<T> = {',
    '  [K in keyof T as string extends K',
    '    ? never',
    '    : number extends K',
    '      ? never',
    '      : K]: T[K];',
    '};',
    `type Slots = Named<InstanceType<typeof ${table.composable}>['$slots']>;`,
  ];

  const rows: string[] = [];
  const rowLines: number[] = [];
  table.fields.forEach((field, index) => {
    const line = `type _${index} = Slots['${field.name}'];`;
    rows.push(line);
    rowLines.push(field.line);
  });

  const tail = [
    `type Extra = Exclude<keyof Slots, ${documented.join(' | ') || 'never'}>;`,
    `type Undocumented = { __slot: true }[[Extra] extends [never]`,
    `  ? '__slot'`,
    `  : Extra];`,
    'export type { Undocumented };',
  ];

  return {
    file: table.file,
    fenceLine: table.headingLine,
    lang: 'ts',
    ext: '.ts',
    label: `slots-${table.composable}`,
    code: [...head, ...rows, ...tail].join('\n'),
    lineMap: [
      ...head.map(() => table.headingLine),
      ...rowLines,
      ...tail.map(() => table.headingLine),
    ],
  };
}
