import { describe, expect, it } from 'vitest';
import { extractFromMarkdown } from '../extract-doc-snippets';

const extract = (source: string) =>
  extractFromMarkdown('docs/x.md', source).snippets.map((snippet) => [
    snippet.lang,
    snippet.ext,
    snippet.markupOnly ?? false,
  ]);

describe('extractFromMarkdown', () => {
  it('hands ts and vue fences to the compiler', () => {
    expect(
      extract(
        ['```ts', 'const a = 1;', '```', '', '```vue', '<x />', '```'].join(
          '\n',
        ),
      ),
    ).toEqual([
      ['ts', '.ts', false],
      ['vue', '.vue', false],
    ]);
  });

  it('takes an html fence as markup, never as code', () => {
    // The fence a page reaches for when the markup cannot compile: a v5 line
    // kept for contrast, or one carrying an elision. Its component tags are
    // still worth checking, and checking them needs no compiler.
    expect(
      extract(['```html', '<Maplibre :register="…" />', '```'].join('\n')),
    ).toEqual([['html', '.vue', true]]);
  });

  it('leaves every other fence alone', () => {
    expect(extract(['```bash', 'bun run build', '```'].join('\n'))).toEqual([]);
  });
});
