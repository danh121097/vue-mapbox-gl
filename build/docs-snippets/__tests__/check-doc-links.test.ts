import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkLinks } from '../check-doc-links';

/**
 * Writes a page into a throwaway docs tree and returns the problems reported
 * for it. `pages` names extra files to create so a link has something to
 * resolve to.
 */
function problems(page: string, pages: string[] = []) {
  const root = mkdtempSync(resolve(tmpdir(), 'doc-links-'));
  const docs = resolve(root, 'docs');
  mkdirSync(resolve(docs, 'guide'), { recursive: true });
  for (const name of pages) writeFileSync(resolve(docs, name), '# Page\n');
  const file = resolve(docs, 'page.md');
  writeFileSync(file, page);
  return checkLinks([file], root).map((p) => p.message);
}

describe('checkLinks', () => {
  it('resolves a link to a page that exists', () => {
    expect(problems('[Guide](/guide/install)', ['guide/install.md'])).toEqual(
      [],
    );
  });

  it('reports a link to a page that does not exist', () => {
    expect(problems('[Guide](/guide/install)')).toHaveLength(1);
  });

  it('leaves an ordinary external link alone', () => {
    expect(problems('[MapLibre](https://maplibre.org/)')).toEqual([]);
  });

  it('reports a link to the documentation site this project dropped', () => {
    // The README shipped eight of these to npm; all of them 404.
    expect(
      problems(
        '[Docs](https://danh121097.github.io/vue-maplibre-gl/guide/installation)',
      ),
    ).toEqual([
      "error: link target 'https://danh121097.github.io/vue-maplibre-gl/guide/installation' " +
        'points at a documentation site this project no longer publishes; ' +
        'use https://vue-maplibre-gl.pages.dev',
    ]);
  });
});
