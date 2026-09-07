/**
 * Pulls the internal links out of the markdown so they can be resolved.
 *
 * A link is prose to every other check here. `useMaplibre`'s Returns section
 * pointed at `/api/types#maplibremethods` for months; the page existed, the
 * anchor did not, and the type it named was not documented anywhere. Nothing
 * caught it because nothing reads links.
 */
import { readFileSync } from 'node:fs';

/**
 * A markdown inline link. The target stops at whitespace so a titled link
 * (`[text](/api/types 'Types')`) yields the path alone, and nested brackets in
 * the label are tolerated because only the target matters.
 */
const LINK_RE = /\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/g;

/** Fenced code — links inside an example are the example's business. */
const FENCE_RE = /^(\s*)(`{3,})/;

export interface DocLink {
  /** The link target, verbatim. */
  target: string;
  /** 1-based line it appears on. */
  line: number;
}

export function extractLinks(source: string): DocLink[] {
  const links: DocLink[] = [];
  const lines = source.split('\n');
  let fence: string | null = null;

  lines.forEach((line, index) => {
    const open = FENCE_RE.exec(line);
    if (fence) {
      if (
        open &&
        open[2]!.length >= fence.length &&
        !line.trim().slice(3).trim()
      ) {
        fence = null;
      }
      return;
    }
    if (open) {
      fence = open[2]!;
      return;
    }

    for (const match of line.matchAll(LINK_RE)) {
      links.push({ target: match[1]!, line: index + 1 });
    }
  });

  return links;
}

/**
 * The anchor VitePress gives a heading: its text, lowercased, with everything
 * that is not a word character or a space dropped and spaces turned to dashes.
 * Inline code and links in a heading contribute their text, which is why
 * `### \`useFlyTo\`` and `### useFlyTo` land on the same anchor.
 */
export function headingAnchors(source: string): Set<string> {
  const anchors = new Set<string>();
  const lines = source.split('\n');
  let fence: string | null = null;

  for (const line of lines) {
    const open = FENCE_RE.exec(line);
    if (fence) {
      if (open && open[2]!.length >= fence.length) fence = null;
      continue;
    }
    if (open) {
      fence = open[2]!;
      continue;
    }

    const heading = /^#{1,6}\s+(.*?)\s*$/.exec(line);
    if (!heading) continue;
    anchors.add(slugify(heading[1]!));
  }

  return anchors;
}

export function slugify(heading: string): string {
  return (
    heading
      .replace(/`/g, '')
      // A link in a heading contributes its label, not its target.
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N} -]/gu, '')
      .replace(/\s+/g, '-')
  );
}

export function extractLinksFromFile(file: string): DocLink[] {
  return extractLinks(readFileSync(file, 'utf8'));
}
