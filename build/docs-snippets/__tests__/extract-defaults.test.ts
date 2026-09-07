import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  canonicalDocumentedDefault,
  componentDefaults,
  composableDefaults,
} from '../extract-defaults';

const ROOT = resolve(import.meta.dirname, '../../..');

function canonical(text: string): string | null {
  return canonicalDocumentedDefault(text);
}

describe('canonicalDefault', () => {
  it('reads the value out of the wrappers a default arrives in', () => {
    // Vue makes an object or array default a factory, the sources close their
    // literals with a trailing comma, and a `as` assertion narrows one. None of
    // that changes the value, and all of it would defeat a text comparison.
    expect(canonical('() => ({})')).toBe('{}');
    expect(canonical("() => ['all'] as FilterSpecification")).toBe("['all']");
    expect(canonical("{ type: 'FeatureCollection', features: [], }")).toBe(
      "{ type: 'FeatureCollection', features: [] }",
    );
  });

  it('reads the two quote styles and the two number spellings as one value', () => {
    expect(canonical('"bottom-right"')).toBe("'bottom-right'");
    expect(canonical('300')).toBe('300');
    expect(canonical('-1')).toBe('-1');
  });

  it('refuses a default it cannot reduce to a value', () => {
    // `containerId` is a fresh random string per instance. There is no value to
    // compare a cell against, so the check must skip it rather than invent one.
    expect(canonical('`maplibre-${Math.random()}`')).toBeNull();
    expect(canonical('() => DEFAULT_GEOJSON_DATA')).toBeNull();
    expect(canonical('{ ...spread }')).toBeNull();
  });
});

describe('componentDefaults', () => {
  const found = componentDefaults(ROOT);

  it('reads the withDefaults block of every component', () => {
    // The count is the guard: an extractor that silently stopped finding
    // `withDefaults` would report every documented default as unverifiable and
    // the check above it would pass having compared nothing.
    expect(found.size).toBeGreaterThanOrEqual(10);
    expect(found.get('Maplibre')?.get('debug')).toBe('false');
    expect(found.get('Popup')?.get('closeButton')).toBe('true');
    expect(found.get('Marker')?.get('options')).toBe('{}');
  });

  it('reports a computed default as present but not comparable', () => {
    const maplibre = found.get('Maplibre')!;
    expect(maplibre.has('containerId')).toBe(true);
    expect(maplibre.get('containerId')).toBeNull();
  });

  it('leaves a prop with no default out entirely', () => {
    expect(found.get('Marker')?.has('draggable')).toBe(false);
  });
});

describe('composableDefaults', () => {
  const found = composableDefaults(ROOT);

  it('reads a default destructured in the parameter list', () => {
    expect(found.get('useGeolocateControl')?.get('position')).toBe(
      "'bottom-right'",
    );
  });

  it('reads a default destructured out of a props object in the body', () => {
    // `useDebounce` takes `options` and unpacks it inside. Reading only
    // parameter patterns would find nothing here and quietly excuse the table.
    expect(found.get('useDebounce')?.get('delay')).toBe('300');
    expect(found.get('useDebounce')?.get('trailing')).toBe('true');
  });

  it('reads a default on a positional parameter', () => {
    expect(found.get('useDebouncedRef')?.get('delay')).toBe('300');
  });

  it('documents a renamed binding under the name the caller passes', () => {
    // `{ show: showVal = true }` is a default for `show`, which is what the
    // reference tabulates and what a reader writes.
    expect(found.get('useCreatePopup')?.get('show')).toBe('true');
  });
});
