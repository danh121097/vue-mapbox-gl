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

/** The other tabulated sections, which document an input rather than a return. */
const PARAMETERS_HEADING_RE = /^#{2,5}\s+Parameters\s*$/;
const PROPS_HEADING_RE = /^#{2,5}\s+Props\s*$/;
const EVENTS_HEADING_RE = /^#{2,5}\s+Events\s*$/;

/**
 * Column headers that hold a type. `Returns` and `Parameters` tables call it
 * `Type`; an `Events` table calls it `Payload`, because the row documents what
 * the handler is given rather than the handler itself.
 */
const TYPE_HEADERS = ['type', 'payload'];

/**
 * A table row's first cell, which holds the field name in backticks. A plain
 * number is a tuple index: `useDebouncedRef` returns `[ref, ref, flush, cancel]`
 * and documents it by position, and `Returned['0']` checks that just as well.
 */
const FIELD_CELL_RE = /^\|\s*`([A-Za-z_$][\w$]*(?:[-:][\w$]+)*|\d+)`\s*\|/;

/** A cell holding one backticked type expression and nothing else. */
const TYPE_CELL_RE = /^`(.+)`$/;

/**
 * Declares that a Returns section deliberately abridges: the composable also
 * spreads in everything from another type or composable, and those members are
 * documented there rather than repeated as rows here.
 *
 *     <!-- returns-spread: MaplibreMethods -->
 *     <!-- returns-spread: useMapEventListener -->
 *
 * Without it the completeness check would demand a row for all 47 map methods
 * `useMaplibre` passes through. With it, the abridgement is a claim the
 * compiler holds to: a field outside the named source still fails.
 */
const SPREAD_RE = /^<!--\s*returns-spread:\s*([A-Za-z_$][\w$]*)\s*-->$/;

/**
 * The same device for a component's events. Three layer components document
 * theirs as "same events as FillLayer" rather than repeating fourteen rows, and
 * without a marker that sentence is prose: the completeness check would demand
 * a row per event, and nothing would notice the day the two sets diverge.
 *
 *     <!-- events-like: FillLayer -->
 */
const EVENTS_LIKE_RE = /^<!--\s*events-like:\s*([A-Za-z_$][\w$]*)\s*-->$/;

/**
 * Which component each `events-like` marker sits under. Read separately from
 * the tables because the sections that need it have no table at all.
 */
export function extractEventsLike(
  source: string,
  nameRe: RegExp,
): Map<string, string[]> {
  const found = new Map<string, string[]>();
  let components: string[] = [];
  for (const line of source.split('\n')) {
    const heading = /^(#{2})\s+(.*)$/.exec(line);
    if (heading) {
      components = heading[2]!.match(nameRe) ?? [];
      continue;
    }
    const marker = EVENTS_LIKE_RE.exec(line.trim());
    if (!marker) continue;
    for (const component of components) {
      found.set(component, [...(found.get(component) ?? []), marker[1]!]);
    }
  }
  return found;
}

/**
 * Splits a table row into cells on unescaped pipes. A `\|` inside a cell is a
 * union, not a column boundary -- `ComputedRef<Map \| null>` is one cell.
 */
export function splitRow(row: string): string[] {
  const cells: string[] = [];
  let cell = '';
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '\\' && row[i + 1] === '|') {
      cell += '|';
      i++;
    } else if (row[i] === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += row[i];
    }
  }
  cells.push(cell.trim());
  // A markdown row starts and ends with a pipe, so the outer cells are empty.
  return cells.slice(1, -1);
}

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
  /**
   * The type the row documents, verbatim, or null when the row does not give
   * one as a single backticked expression.
   */
  type: string | null;
  /** 1-based line of the row in the markdown. */
  line: number;
}

export interface ReturnTable {
  file: string;
  composable: string;
  /** 1-based line of the `Returns` heading, used for the import's diagnostics. */
  headingLine: number;
  fields: TableField[];
  /** Types or composables the section says this return spreads in. */
  spreads: string[];
}

export function extractReturnTables(
  file: string,
  source: string,
): ReturnTable[] {
  return extractSectionTables(file, source, RETURNS_HEADING_RE);
}

/** The `Parameters` tables of a page, keyed the same way as its return ones. */
export function extractParameterTables(
  file: string,
  source: string,
): ReturnTable[] {
  return extractSectionTables(file, source, PARAMETERS_HEADING_RE);
}

/**
 * The `Props` and `Events` tables of the components reference. Their sections
 * are headed by a component name rather than a composable one, so the caller
 * passes the pattern that recognises it.
 */
export function extractPropTables(
  file: string,
  source: string,
  names: RegExp,
): ReturnTable[] {
  return extractSectionTables(file, source, PROPS_HEADING_RE, names, 2);
}

export function extractEventTables(
  file: string,
  source: string,
  names: RegExp,
): ReturnTable[] {
  return extractSectionTables(file, source, EVENTS_HEADING_RE, names, 2);
}

function extractSectionTables(
  file: string,
  source: string,
  sectionHeading: RegExp,
  nameRe: RegExp = COMPOSABLE_NAME_RE,
  /**
   * The deepest heading level that opens a section. The composables reference
   * names its subject at `###` and tabulates under `####`; the components one
   * names its subject at `##` and tabulates under `###`, so `### Props` must
   * not be read as a new section there.
   */
  sectionLevel = 3,
): ReturnTable[] {
  const sectionHeadingRe = new RegExp(`^(#{2,${sectionLevel}})\\s+(.*)$`);
  const lines = source.split('\n');
  const tables: ReturnTable[] = [];
  // Reset by every section heading, so a table can never bind to a composable
  // from a section that has already ended.
  let composables: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    const heading = sectionHeadingRe.exec(line);
    if (heading) {
      composables = heading[2]!.match(nameRe) ?? [];
      continue;
    }

    if (!composables.length || !sectionHeading.test(line)) continue;

    const headingLine = i + 1;
    // Which composables the next table describes. A bold label overrides it for
    // one table; otherwise the table describes everything the section names.
    let owners = composables;
    const spreads: string[] = [];
    const sectionTables: ReturnTable[] = [];

    // Read to the end of the section. A `Returns` block is usually one table,
    // but it can be a label-and-table pair per composable, and it can be prose
    // instead ("the same shape, with `setRadius` in place of ..."), which is
    // not something this check can verify.
    let j = i + 1;
    for (; j < lines.length && !/^#{2,5}\s/.test(lines[j]!); j++) {
      const text = lines[j]!.trim();
      if (!text) continue;

      const spread = SPREAD_RE.exec(text);
      if (spread) {
        spreads.push(spread[1]!);
        continue;
      }

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

      // Which column holds the type. Most tables put it second, but a tuple
      // table is `| Index | Name | Type |`, so the header decides.
      const headers = splitRow(lines[j]!).map((h) => h.toLowerCase());
      const typeColumn = headers.findIndex((header) =>
        TYPE_HEADERS.includes(header),
      );

      const fields: TableField[] = [];
      let k = j + 2;
      for (; k < lines.length && lines[k]!.startsWith('|'); k++) {
        const cell = FIELD_CELL_RE.exec(lines[k]!);
        // A row whose first cell is not a single backticked identifier is a
        // grouping row or a prose row; it names no field to check.
        if (!cell) continue;
        const typeCell =
          typeColumn === -1 ? null : splitRow(lines[k]!)[typeColumn];
        const type = typeCell ? TYPE_CELL_RE.exec(typeCell)?.[1] : undefined;
        fields.push({ name: cell[1]!, type: type ?? null, line: k + 1 });
      }

      if (fields.length) {
        for (const composable of owners) {
          sectionTables.push({
            file,
            composable,
            headingLine,
            fields,
            spreads,
          });
        }
      }
      owners = composables;
      j = k - 1;
    }
    // `spreads` is filled as the section is read and shared by reference, so a
    // marker below a table still applies to it.
    tables.push(...sectionTables);
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
