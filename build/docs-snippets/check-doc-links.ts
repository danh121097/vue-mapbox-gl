/**
 * Resolves every internal documentation link to a file and a heading.
 *
 * The compiled snippets prove the code in the docs is real; nothing proved the
 * navigation was. `/api/types#maplibremethods` was linked from the composables
 * reference while no such heading existed, and VitePress renders a dead anchor
 * as an ordinary link that quietly lands at the top of the page.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { extractLinks, headingAnchors } from './extract-doc-links';

export interface LinkProblem {
  location: string;
  message: string;
}

/** Links this check has no way to resolve, and does not claim to. */
function isExternal(target: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(target) ||
    target.startsWith('//') ||
    // A VitePress public asset, served from outside the markdown tree.
    /\.(png|jpe?g|gif|svg|webp|ico|pdf|zip)$/i.test(target)
  );
}

/**
 * Turns a link target into the markdown file it renders from. Site-absolute
 * targets (`/api/types`) resolve against `docs/`, the way VitePress routes
 * them; relative ones resolve against the linking file, the way GitHub does.
 */
function resolveTarget(
  target: string,
  fromFile: string,
  docsDir: string,
): string[] {
  const path = target.startsWith('/')
    ? resolve(docsDir, `.${target}`)
    : resolve(dirname(fromFile), target);

  if (path.endsWith('.md')) return [path];
  // The literal path comes first: the architecture notes link straight at the
  // source files they describe, and the README links at `LICENSE`.
  // `/api/types` and `/guide/` name a page without saying so.
  return [path, `${path}.md`, resolve(path, 'index.md')];
}

export function checkLinks(pages: string[], rootDir: string): LinkProblem[] {
  const docsDir = resolve(rootDir, 'docs');
  const problems: LinkProblem[] = [];
  const anchorCache = new Map<string, Set<string>>();

  const anchorsOf = (file: string): Set<string> => {
    let anchors = anchorCache.get(file);
    if (!anchors) {
      anchors = headingAnchors(readFileSync(file, 'utf8'));
      anchorCache.set(file, anchors);
    }
    return anchors;
  };

  for (const file of pages) {
    const source = readFileSync(file, 'utf8');
    const here = relative(rootDir, file);

    for (const { target, line } of extractLinks(source)) {
      if (isExternal(target)) continue;

      const [path, anchor] = target.split('#') as [string, string?];
      const at = `${here}:${line}`;

      let page = file;
      if (path) {
        const candidates = resolveTarget(path, file, docsDir);
        const found = candidates.find((candidate) => existsSync(candidate));
        if (!found) {
          problems.push({
            location: at,
            message: `error: link target '${target}' resolves to no page (tried ${candidates
              .map((candidate) => relative(rootDir, candidate))
              .join(', ')})`,
          });
          continue;
        }
        page = found;
      }

      // Only a markdown page has headings; a link into a source file is
      // checked for existing and nothing more.
      if (anchor && page.endsWith('.md') && !anchorsOf(page).has(anchor)) {
        problems.push({
          location: at,
          message:
            `error: link target '${target}' names no heading in ` +
            `${relative(rootDir, page)}`,
        });
      }
    }
  }

  return problems;
}
