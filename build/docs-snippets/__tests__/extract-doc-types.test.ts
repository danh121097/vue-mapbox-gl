import { describe, expect, it } from 'vitest';
import { extractDocumentedTypes } from '../extract-doc-types';

describe('extractDocumentedTypes', () => {
  it('reads the fence that declares the type its heading names', () => {
    const [type] = extractDocumentedTypes(`### Nullable

Generic utility type.

\`\`\`typescript
type Nullable<T> = T | null;
\`\`\`
`);

    expect(type).toMatchObject({
      name: 'Nullable',
      kind: 'type',
      params: '<T>',
      code: 'type Nullable<T> = T | null;',
      codeLine: 6,
      headingLine: 1,
    });
  });

  it('finds the declaration anywhere in a fence that declares several', () => {
    const [type] = extractDocumentedTypes(`### CreateLayerActions

\`\`\`typescript
interface CreateBaseLayerActions<Layer extends LayerSpecification> {
  layerId: string;
}

interface CreateLayerActions<Layer extends LayerSpecification>
  extends CreateBaseLayerActions<Layer> {
  setStyle: (style: AnyLayout) => void;
}
\`\`\`
`);

    expect(type!.name).toBe('CreateLayerActions');
    expect(type!.params).toBe('<Layer extends LayerSpecification>');
  });

  it('marks an enum, which cannot be compared by assignability', () => {
    const [type] = extractDocumentedTypes(`### SourceStatus

\`\`\`typescript
enum SourceStatus {
  Created = 'created',
}
\`\`\`
`);

    expect(type!.kind).toBe('enum');
  });

  it('ignores a fence that only uses the type instead of declaring it', () => {
    expect(
      extractDocumentedTypes(`### MapClickHandler

\`\`\`ts
const onClick: MapClickHandler = (e) => console.log(e);
\`\`\`
`),
    ).toEqual([]);
  });
});
