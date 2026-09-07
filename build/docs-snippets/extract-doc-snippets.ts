/**
 * Pulls the checkable code blocks out of the markdown under `docs/`.
 *
 * Every block keeps the line it started on, because the only useful thing a
 * failing snippet check can say is which line of which page to open.
 */
import { readFileSync } from 'node:fs';

/** Fence languages worth handing to the compiler. */
const TS_LANGS = new Set(['ts', 'typescript', 'js', 'javascript']);
const VUE_LANGS = new Set(['vue']);
/**
 * Markup the compiler is not asked about, but that still shows this package's
 * components. A block is fenced `html` when it cannot compile -- a `v5` line
 * kept for contrast, an elision -- and the attribute check needs no compiler,
 * so the tag names and prop spellings in one are still worth asserting.
 */
const MARKUP_LANGS = new Set(['html']);

/**
 * Opts a block out of the check. Placed on the line before the fence, so it is
 * an HTML comment markdown never renders:
 *
 *     <!-- snippet-skip: illustrates the v5 API that no longer exists -->
 *
 * The reason is mandatory. A bare skip is how a checked corpus rots back into
 * an unchecked one.
 */
const SKIP_RE = /^<!--\s*snippet-skip:\s*(\S.*?)\s*-->$/;

export interface Snippet {
  /** Markdown file the block came from, repo-relative. */
  file: string;
  /** 1-based line of the opening fence. */
  fenceLine: number;
  lang: string;
  /** Extension the block should be written with. */
  ext: '.ts' | '.vue';
  /**
   * The block is scanned for component attributes but never compiled -- an
   * `html` fence is markup this package's components appear in, not code the
   * page claims will typecheck.
   */
  markupOnly?: boolean;
  code: string;
  /**
   * Generated line (1-based) to markdown line, for snippets this tool wrote
   * rather than lifted. A fenced block needs none: nothing is prepended when it
   * is written out, so its line N is always `fenceLine + N`.
   */
  lineMap?: number[];
  /**
   * Extra segment for the generated filename. Two generated snippets can share
   * a file and a line — one heading documents several composables — and a
   * filename collision would silently drop all but the last.
   */
  label?: string;
}

export interface SkippedSnippet {
  file: string;
  fenceLine: number;
  reason: string;
}

export interface ExtractResult {
  snippets: Snippet[];
  skipped: SkippedSnippet[];
}

export function extractFromMarkdown(
  file: string,
  source: string,
): ExtractResult {
  const lines = source.split('\n');
  const snippets: Snippet[] = [];
  const skipped: SkippedSnippet[] = [];

  for (let i = 0; i < lines.length; i++) {
    const open = /^(\s*)(`{3,})(.*)$/.exec(lines[i]!);
    if (!open) continue;

    const [, indent = '', ticks = '```', info = ''] = open;
    // The info string can carry VitePress metadata (`ts twoslash`, `bash [npm]`);
    // only the first token names the language.
    const lang = info.trim().split(/\s+/)[0]?.toLowerCase() ?? '';

    // A fence closes on the first line with at least as many backticks, which
    // is what lets a ```vue block contain a ``` block of its own.
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (new RegExp(`^\\s*\`{${ticks.length},}\\s*$`).test(lines[j]!)) {
        end = j;
        break;
      }
    }

    const isMarkup = MARKUP_LANGS.has(lang);
    const isCheckable = TS_LANGS.has(lang) || VUE_LANGS.has(lang) || isMarkup;
    if (isCheckable) {
      const skip = findSkipMarker(lines, i);
      if (skip) {
        skipped.push({ file, fenceLine: i + 1, reason: skip });
      } else {
        snippets.push({
          file,
          fenceLine: i + 1,
          lang,
          ext: TS_LANGS.has(lang) ? '.ts' : '.vue',
          ...(isMarkup ? { markupOnly: true } : {}),
          // Strip the fence's own indentation so a block nested in a list still
          // compiles; the line count is untouched, which keeps the mapping back
          // to the markdown exact.
          code: lines
            .slice(i + 1, end)
            .map((line) =>
              indent && line.startsWith(indent)
                ? line.slice(indent.length)
                : line,
            )
            .join('\n'),
        });
      }
    }

    i = end;
  }

  return { snippets, skipped };
}

/**
 * Looks back from a fence for its skip marker, stepping over blank lines and
 * over the `<!-- prettier-ignore -->` style comments that can sit between the
 * marker and the fence.
 */
function findSkipMarker(lines: string[], fenceIndex: number): string | null {
  for (let i = fenceIndex - 1; i >= 0; i--) {
    const line = lines[i]!.trim();
    if (!line) continue;
    const match = SKIP_RE.exec(line);
    if (match) return match[1]!;
    if (line.startsWith('<!--')) continue;
    return null;
  }
  return null;
}

export function extractFromFile(file: string): ExtractResult {
  return extractFromMarkdown(file, readFileSync(file, 'utf8'));
}
