/**
 * Compares the reference's `Default` column with the defaults the sources give.
 *
 * A wrong default is the quietest kind of documentation bug: the prop exists,
 * its type is right, the example compiles, and the reader simply believes the
 * wrong thing about what happens when they leave it out. Nothing else in this
 * suite could see it -- the built declarations carry the *type* of a default
 * and never its value -- so this check reads `libs/`, which is the one place
 * the value exists. See `extract-defaults.ts` for why that boundary is crossed
 * here and nowhere else.
 *
 * Cells that state no default (`—`, or `undefined`) are claims too, and are
 * checked the same way: the source must give none.
 */
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import {
  extractParameterTables,
  extractPropTables,
  type ReturnTable,
} from './extract-doc-tables';
import {
  canonicalDocumentedDefault,
  componentDefaults,
  composableDefaults,
  type Defaults,
} from './extract-defaults';

export interface DefaultProblem {
  location: string;
  message: string;
}

/** A cell holding one backticked expression and nothing else. */
const VALUE_CELL_RE = /^`(.+)`$/;

/** The spellings the reference uses for "this input has no default". */
const NO_DEFAULT = new Set(['—', '-', '–', 'n/a', 'none']);

function compare(
  rootDir: string,
  table: ReturnTable,
  defaults: Defaults | undefined,
  problems: DefaultProblem[],
): { compared: number; skipped: number } {
  let compared = 0;
  let skipped = 0;

  for (const field of table.fields) {
    const cell = field.defaultCell?.trim();
    // No column, or an empty cell: the row makes no claim about a default.
    if (!cell) continue;
    const location = `${relative(rootDir, table.file)}:${field.line}`;

    // A composable whose defaults could not be read at all would otherwise turn
    // every documented default into a reported error, which is a worse lie than
    // the one being hunted.
    if (!defaults) {
      skipped += 1;
      continue;
    }

    const has = defaults.has(field.name);
    const actual = defaults.get(field.name) ?? null;

    const documented = VALUE_CELL_RE.exec(cell)?.[1];
    if (documented === undefined) {
      if (!NO_DEFAULT.has(cell.toLowerCase())) {
        // Prose: "see below", "random". Not a value, so not comparable.
        skipped += 1;
        continue;
      }
      compared += 1;
      if (has) {
        problems.push({
          location,
          message:
            `error: '${field.name}' is documented as having no default, but ` +
            `${table.composable} defaults it to ${actual ?? 'a computed value'}`,
        });
      }
      continue;
    }

    if (documented === 'undefined') {
      compared += 1;
      if (has && actual !== 'undefined') {
        problems.push({
          location,
          message:
            `error: '${field.name}' is documented as defaulting to undefined, ` +
            `but ${table.composable} defaults it to ${actual ?? 'a computed value'}`,
        });
      }
      continue;
    }

    if (!has) {
      compared += 1;
      problems.push({
        location,
        message:
          `error: '${field.name}' is documented as defaulting to ` +
          `${documented}, but ${table.composable} gives it no default`,
      });
      continue;
    }

    const expected = canonicalDocumentedDefault(documented);
    // Either side may be something no comparison can settle: a factory that
    // computes its value, or a cell written as an expression rather than a
    // literal.
    if (expected === null || actual === null) {
      skipped += 1;
      continue;
    }

    compared += 1;
    if (expected !== actual) {
      problems.push({
        location,
        message:
          `error: '${field.name}' is documented as defaulting to ` +
          `${documented}, but ${table.composable} defaults it to ${actual}`,
      });
    }
  }

  return { compared, skipped };
}

/**
 * Returns the problems alongside how many cells were compared and how many were
 * skipped, so the caller can print both. A check that quietly skipped every
 * cell would report exactly what a clean one does.
 */
export function checkDefaults(
  rootDir: string,
  componentNames: RegExp,
): { problems: DefaultProblem[]; compared: number; skipped: number } {
  const problems: DefaultProblem[] = [];
  let compared = 0;
  let skipped = 0;

  const add = (counts: { compared: number; skipped: number }): void => {
    compared += counts.compared;
    skipped += counts.skipped;
  };

  const components = componentDefaults(rootDir);
  const componentsPage = resolve(rootDir, 'docs/api/components.md');
  for (const table of extractPropTables(
    componentsPage,
    readFileSync(componentsPage, 'utf8'),
    componentNames,
  )) {
    add(compare(rootDir, table, components.get(table.composable), problems));
  }

  const composables = composableDefaults(rootDir);
  const composablesPage = resolve(rootDir, 'docs/api/composables.md');
  for (const table of extractParameterTables(
    composablesPage,
    readFileSync(composablesPage, 'utf8'),
  )) {
    add(compare(rootDir, table, composables.get(table.composable), problems));
  }

  return { problems, compared, skipped };
}
