/**
 * Pulls the type declarations out of the types reference so they can be
 * compared with the real ones.
 *
 * `docs/api/types.md` is a hand-copied transcript of `libs/types`. Its fences
 * do compile, but only in the weakest sense: an undefined name in one reads as
 * `Cannot find name`, which the allowlist tolerates for hand-written examples,
 * so the whole page could name types that no longer exist and pass. Nothing
 * compared a documented declaration with the exported one at all — the copy is
 * free to drift the moment the source changes.
 */
import { readFileSync } from 'node:fs';

/** `### TypeName` — the heading that introduces a documented type. */
const TYPE_HEADING_RE = /^#{3}\s+`?([A-Za-z_$][\w$]*)`?\s*$/;

/**
 * The declaration a fence opens with. The name has to match its heading, which
 * is what says the fence is the type's definition rather than an example of
 * using it.
 */
const DECLARATION_RE =
  /^(?:export\s+)?(type|interface|enum|const enum)\s+([A-Za-z_$][\w$]*)\s*(<[^=({]*>)?/;

export interface DocumentedType {
  name: string;
  /** `type`, `interface` or `enum` — an enum is compared by its members. */
  kind: 'type' | 'interface' | 'enum';
  /** The type parameter list verbatim (`<T>`), or null when there is none. */
  params: string | null;
  /** The fence body, verbatim. */
  code: string;
  /** 1-based line of the first line inside the fence. */
  codeLine: number;
  /** 1-based line of the heading. */
  headingLine: number;
}

export function extractDocumentedTypes(source: string): DocumentedType[] {
  const lines = source.split('\n');
  const types: DocumentedType[] = [];

  for (let i = 0; i < lines.length; i++) {
    const heading = TYPE_HEADING_RE.exec(lines[i]!);
    if (!heading) continue;
    const name = heading[1]!;
    const headingLine = i + 1;

    // The definition is the first fence under the heading, and only if it
    // declares the type the heading names; the `ts` fences that follow are
    // usage examples and are already compiled as ordinary blocks.
    let j = i + 1;
    for (; j < lines.length && !/^#{1,6}\s/.test(lines[j]!); j++) {
      if (!/^```/.test(lines[j]!)) continue;

      let end = j + 1;
      for (; end < lines.length && !/^```\s*$/.test(lines[end]!); end++);
      const body = lines.slice(j + 1, end);

      // A fence can declare more than one type -- `CreateLayerActions` is
      // shown with the base interface it extends -- so the declaration that
      // matches the heading is the definition, wherever in the fence it sits.
      const declaration = body
        .map((bodyLine) => DECLARATION_RE.exec(bodyLine))
        .find((match) => match?.[2] === name);
      if (declaration) {
        types.push({
          name,
          kind:
            declaration[1] === 'interface'
              ? 'interface'
              : declaration[1]!.endsWith('enum')
                ? 'enum'
                : 'type',
          params: declaration[3]?.trim() ?? null,
          code: body.join('\n'),
          codeLine: j + 2,
          headingLine,
        });
      }
      break;
    }
    i = j - 1;
  }

  return types;
}

export function extractDocumentedTypesFromFile(file: string): DocumentedType[] {
  return extractDocumentedTypes(readFileSync(file, 'utf8'));
}
