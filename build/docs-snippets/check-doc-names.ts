/**
 * Checks the composable names the prose uses, not just the ones the code
 * blocks import.
 *
 * A name in a sentence or a heading is not a name in a code block, so nothing
 * here looked at it — and the README advertised `useBounds` and `useZoom`,
 * neither of which has ever existed, on the page npm renders. The same blind
 * spot invalidated a canary earlier in this work: replacing the first
 * occurrence of a composable name edited a heading, and the check passed
 * because a heading is prose.
 */
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

export interface NameProblem {
  location: string;
  message: string;
}

/** A backticked composable name, `useFlyTo` or the family form `useZoom*`. */
const NAME_RE = /`(use[A-Z][A-Za-z0-9_]*)(\*?)`/g;

/** The same names, unbackticked, as a heading uses them. */
const HEADING_RE = /^#{1,6}\s+(.*)$/;
const BARE_NAME_RE = /\buse[A-Z][A-Za-z0-9_]*/g;

/**
 * Pages that exist to describe what the library no longer has. A migration
 * guide naming a composable removed in v6 is doing its job, and checking it
 * against today's exports would only push the history out of the docs.
 */
const HISTORICAL = /(?:changelog|migration-v\d+)\.md$/;

/**
 * Exempts the paragraph below it, for prose that names something on purpose
 * *because* it does not exist:
 *
 *     <!-- names-skip: the two names the README used to advertise -->
 *
 * The reason is required, and the exemption ends at the next blank line, so it
 * cannot quietly widen to the rest of the page.
 */
const NAMES_SKIP_RE = /^<!--\s*names-skip:\s*(\S.*?)\s*-->$/;

export function checkNames(
  pages: string[],
  rootDir: string,
  exported: Set<string>,
): NameProblem[] {
  const problems: NameProblem[] = [];
  const isExported = (name: string, family: boolean): boolean =>
    family
      ? [...exported].some((exportedName) => exportedName.startsWith(name))
      : exported.has(name);

  for (const file of pages) {
    const here = relative(rootDir, file);
    if (HISTORICAL.test(here)) continue;

    const lines = readFileSync(file, 'utf8').split('\n');
    let fence: string | null = null;
    // 'pending' once the marker is read, 'active' through the paragraph that
    // follows it, and off again at the blank line that ends that paragraph.
    let exempt: 'off' | 'pending' | 'active' = 'off';

    lines.forEach((line, index) => {
      const open = /^\s*(`{3,})/.exec(line);
      if (fence) {
        if (open && open[1]!.length >= fence.length) fence = null;
        return;
      }
      if (open) {
        fence = open[1]!;
        return;
      }

      if (NAMES_SKIP_RE.test(line.trim())) {
        exempt = 'pending';
        return;
      }
      if (!line.trim()) {
        if (exempt === 'active') exempt = 'off';
        return;
      }
      if (exempt === 'pending') exempt = 'active';
      if (exempt === 'active') return;

      const found = new Map<string, boolean>();
      for (const match of line.matchAll(NAME_RE)) {
        found.set(match[1]!, match[2] === '*');
      }
      const heading = HEADING_RE.exec(line);
      for (const match of heading?.[1]!.match(BARE_NAME_RE) ?? []) {
        if (!found.has(match)) found.set(match, false);
      }

      for (const [name, family] of found) {
        if (isExported(name, family)) continue;
        problems.push({
          location: `${here}:${index + 1}`,
          message:
            `error: '${name}' is named as a composable but the package ` +
            `exports no such name` +
            (family ? ' and nothing starting with it' : ''),
        });
      }
    });
  }

  return problems;
}
