import { describe, expect, it } from 'vitest';
import { extractLinks, headingAnchors, slugify } from '../extract-doc-links';

describe('extractLinks', () => {
  it('takes the target of every inline link', () => {
    expect(
      extractLinks(`See [types](/api/types#nullable) and [the guide](/guide/).
Also [a relative one](./other.md).
`),
    ).toEqual([
      { target: '/api/types#nullable', line: 1 },
      { target: '/guide/', line: 1 },
      { target: './other.md', line: 2 },
    ]);
  });

  it('drops a link title, keeping the target alone', () => {
    expect(extractLinks(`[types](/api/types 'Types')`)).toEqual([
      { target: '/api/types', line: 1 },
    ]);
  });

  it("ignores links inside a fenced block, which are the example's business", () => {
    expect(
      extractLinks(`\`\`\`md
[dead](/nowhere)
\`\`\`

[live](/api/types)
`),
    ).toEqual([{ target: '/api/types', line: 5 }]);
  });
});

describe('headingAnchors', () => {
  it('slugs every heading, ignoring the ones inside a fence', () => {
    expect(
      headingAnchors(`# Types API Reference

## Core Types

\`\`\`ts
// # Not A Heading
\`\`\`

### \`MaplibreMethods\`
`),
    ).toEqual(
      new Set(['types-api-reference', 'core-types', 'maplibremethods']),
    );
  });
});

describe('slugify', () => {
  it('lowercases, drops punctuation and joins words with dashes', () => {
    expect(slugify('Event Handler Types')).toBe('event-handler-types');
    expect(slugify('`useFlyTo` / `useJumpTo`')).toBe('useflyto-usejumpto');
    expect(slugify('[Linked](/somewhere) heading')).toBe('linked-heading');
  });
});
