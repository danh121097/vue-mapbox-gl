/**
 * Pulls the "Returns" tables out of the API reference so they can be compiled.
 *
 * The reference lists each composable's return fields as a markdown table, and
 * a table is prose as far as every other check is concerned: nothing stops a
 * row naming a field that does not exist. That is not hypothetical — two such
 * rows were added to this file by hand and survived a review.
 *
 * Each table becomes a generated module of `type _ = R['field']` lines, one per
 * row, so a row that names nothing real fails on its own line and the failure
 * maps back to the row the reader would open.
 */
import { readFileSync } from 'node:fs';

/**
 * A `##` or `###` heading opens a section; a `####` one is a subsection of it.
 * Only the outer levels change which composable is being documented, so
 * `#### Returns` reads the section it sits in rather than clearing it.
 */
const SECTION_HEADING_RE = /^(#{2,3})\s+(.*)$/;

/**
 * Composable names in a section heading. A heading can name several
 * (`### usePanBy / usePanTo`), and the table below it claims to describe every
 * one of them, so every one of them is checked against it.
 */
const COMPOSABLE_NAME_RE = /\buse[A-Z][A-Za-z0-9_]*/g;

/** `#### Returns`, `### Returns` — the heading a return table follows. */
const RETURNS_HEADING_RE = /^#{2,5}\s+Returns\s*$/;

/**
 * A table row's first cell, which holds the field name in backticks. A plain
 * number is a tuple index: `useDebouncedRef` returns `[ref, ref, flush, cancel]`
 * and documents it by position, and `Returned['0']` checks that just as well.
 */
const FIELD_CELL_RE = /^\|\s*`([A-Za-z_$][\w$]*|\d+)`\s*\|/;

/** The `| --- | --- |` rule that separates a table's head from its body. */
const TABLE_RULE_RE = /^\|[\s:|-]+\|$/;

/**
 * A bolded composable name standing alone under a `Returns` heading, as in
 * `**\`useFitBounds\`**`. Sections that document two composables at once label
 * a table each way; without this the labels read as prose and both tables go
 * unchecked.
 */
const TABLE_LABEL_RE = /^\*\*`?(use[A-Z][A-Za-z0-9_]*)`?\*\*$/;

export interface TableField {
  name: string;
  /** 1-based line of the row in the markdown. */
  line: number;
}

export interface ReturnTable {
  file: string;
  composable: string;
  /** 1-based line of the `Returns` heading, used for the import's diagnostics. */
  headingLine: number;
  fields: TableField[];
}

export function extractReturnTables(
  file: string,
  source: string,
): ReturnTable[] {
  const lines = source.split('\n');
  const tables: ReturnTable[] = [];
  // Reset by every section heading, so a table can never bind to a composable
  // from a section that has already ended.
  let composables: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    const heading = SECTION_HEADING_RE.exec(line);
    if (heading) {
      composables = heading[2]!.match(COMPOSABLE_NAME_RE) ?? [];
      continue;
    }

    if (!composables.length || !RETURNS_HEADING_RE.test(line)) continue;

    const headingLine = i + 1;
    // Which composables the next table describes. A bold label overrides it for
    // one table; otherwise the table describes everything the section names.
    let owners = composables;

    // Read to the end of the section. A `Returns` block is usually one table,
    // but it can be a label-and-table pair per composable, and it can be prose
    // instead ("the same shape, with `setRadius` in place of ..."), which is
    // not something this check can verify.
    let j = i + 1;
    for (; j < lines.length && !/^#{2,5}\s/.test(lines[j]!); j++) {
      const text = lines[j]!.trim();
      if (!text) continue;

      const label = TABLE_LABEL_RE.exec(text);
      if (label) {
        owners = [label[1]!];
        continue;
      }

      const isTable =
        text.startsWith('|') &&
        j + 1 < lines.length &&
        TABLE_RULE_RE.test(lines[j + 1]!.trim());
      if (!isTable) {
        owners = composables;
        continue;
      }

      const fields: TableField[] = [];
      let k = j + 2;
      for (; k < lines.length && lines[k]!.startsWith('|'); k++) {
        const cell = FIELD_CELL_RE.exec(lines[k]!);
        // A row whose first cell is not a single backticked identifier is a
        // grouping row or a prose row; it names no field to check.
        if (cell) fields.push({ name: cell[1]!, line: k + 1 });
      }

      if (fields.length) {
        for (const composable of owners) {
          tables.push({ file, composable, headingLine, fields });
        }
      }
      owners = composables;
      j = k - 1;
    }
    i = j - 1;
  }

  return tables;
}

export interface DocumentedComposable {
  name: string;
  /** 1-based line of the heading that introduces it. */
  line: number;
}

/** Every composable named by a `##`/`###` heading in the page. */
export function listComposables(source: string): DocumentedComposable[] {
  const found = new Map<string, number>();
  source.split('\n').forEach((line, index) => {
    const heading = SECTION_HEADING_RE.exec(line);
    for (const name of heading?.[2]!.match(COMPOSABLE_NAME_RE) ?? []) {
      if (!found.has(name)) found.set(name, index + 1);
    }
  });
  return [...found].map(([name, line]) => ({ name, line }));
}

export function extractTablesFromFile(file: string): ReturnTable[] {
  return extractReturnTables(file, readFileSync(file, 'utf8'));
}

export function listComposablesFromFile(file: string): DocumentedComposable[] {
  return listComposables(readFileSync(file, 'utf8'));
}
