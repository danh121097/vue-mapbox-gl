import { describe, it, expect } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import type { FillLayerSpecification, Map } from 'maplibre-gl';
import { withSetup, withSetupScope } from '../../../test-utils';
import { MockMap } from '../../../__tests__/mock-maplibre';
import { useCreateLayer, LayerStatus } from '../useCreateLayer';

describe('useCreateLayer reactivity contract', () => {
  it('reports the layer as ready only once it is on the map', async () => {
    const map = new MockMap();
    map.addSource('test-source', { type: 'geojson' });

    const source = shallowRef<string | null>(null);
    const { layerStatus, isLayerReady, getLayer } = withSetup(() =>
      useCreateLayer<FillLayerSpecification>({
        map: shallowRef(map as unknown as Map),
        id: 'test-layer',
        source,
        type: 'fill',
      }),
    );

    expect(isLayerReady.value).toBe(false);
    expect(layerStatus.value).toBe(LayerStatus.NotCreated);
    expect(getLayer.value).toBeNull();

    source.value = 'test-source';
    await nextTick();

    expect(map.layerIds()).toContain('test-layer');
    expect(layerStatus.value).toBe(LayerStatus.Created);
    expect(isLayerReady.value).toBe(true);
    expect(getLayer.value).not.toBeNull();
  });

  it('clears the layer again when the source goes away', async () => {
    const map = new MockMap();
    map.addSource('test-source', { type: 'geojson' });

    const source = shallowRef<string | null>(null);
    const { isLayerReady } = withSetup(() =>
      useCreateLayer<FillLayerSpecification>({
        map: shallowRef(map as unknown as Map),
        id: 'removable-layer',
        source,
        type: 'fill',
      }),
    );

    source.value = 'test-source';
    await nextTick();
    expect(isLayerReady.value).toBe(true);

    source.value = null;
    await nextTick();

    expect(map.layerIds()).not.toContain('removable-layer');
    expect(isLayerReady.value).toBe(false);
  });
});

describe('useCreateLayer source resolution', () => {
  it('accepts an object that carries the source id', async () => {
    const map = new MockMap();
    map.addSource('object-source', { type: 'geojson' });

    const { layerStatus } = withSetup(() =>
      useCreateLayer<FillLayerSpecification>({
        map: shallowRef(map as unknown as Map),
        id: 'object-layer',
        source: shallowRef({ id: 'object-source' }),
        type: 'fill',
      }),
    );

    map.fire('load', { type: 'load', target: map });
    await nextTick();

    expect(map.layerIds()).toContain('object-layer');
    expect(layerStatus.value).toBe(LayerStatus.Created);
  });

  it('errors on a bare source specification instead of adding a layer', async () => {
    const map = new MockMap();

    // A layer references its source by id. An inline specification carries no
    // id, so it used to resolve to '' — which then failed the source-exists
    // check with a message naming an empty source. Fail on the real cause.
    const { layerStatus } = withSetup(() =>
      useCreateLayer<FillLayerSpecification>({
        map: shallowRef(map as unknown as Map),
        id: 'spec-layer',
        source: shallowRef({
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        }),
        type: 'fill',
      }),
    );

    map.fire('load', { type: 'load', target: map });
    await nextTick();

    expect(layerStatus.value).toBe(LayerStatus.Error);
    expect(map.layerIds()).not.toContain('spec-layer');
  });

  it('errors when the named source is not on the map', async () => {
    const map = new MockMap();

    const { layerStatus } = withSetup(() =>
      useCreateLayer<FillLayerSpecification>({
        map: shallowRef(map as unknown as Map),
        id: 'orphan-layer',
        source: shallowRef('never-added'),
        type: 'fill',
      }),
    );

    map.fire('load', { type: 'load', target: map });
    await nextTick();

    expect(layerStatus.value).toBe(LayerStatus.Error);
    expect(map.layerIds()).not.toContain('orphan-layer');
  });
});

/** Lets the deferred initial load of `useMapReloadEvent` run. */
const flushTimers = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('useCreateLayer lifecycle', () => {
  it('moves the layer onto a replacement map', async () => {
    const first = new MockMap();
    first.addSource('shared-source', { type: 'geojson' });
    const mapRef = shallowRef(first as unknown as Map);

    withSetup(() =>
      useCreateLayer<FillLayerSpecification>({
        map: mapRef,
        id: 'moving-layer',
        source: shallowRef('shared-source'),
        type: 'fill',
      }),
    );

    first.fire('load', { type: 'load', target: first });
    await nextTick();
    expect(first.layerIds()).toContain('moving-layer');

    const second = new MockMap();
    second.addSource('shared-source', { type: 'geojson' });
    second.setStyleLoaded(true);
    mapRef.value = second as unknown as Map;
    await nextTick();

    // The layer object held from the first map must not block creation on
    // the second, and removal must target the map the layer is actually on.
    expect(first.layerIds()).not.toContain('moving-layer');
    expect(second.layerIds()).toContain('moving-layer');
  });

  it('leaves no layer behind when unmounted before the deferred load fires', async () => {
    const map = new MockMap();
    map.addSource('test-source', { type: 'geojson' });
    map.fire('load');

    const { unmount } = withSetupScope(() =>
      useCreateLayer<FillLayerSpecification>({
        map: shallowRef(map as unknown as Map),
        id: 'short-lived',
        source: shallowRef('test-source'),
        type: 'fill',
      }),
    );

    unmount();
    await flushTimers();

    expect(map.layerIds()).not.toContain('short-lived');
  });

  it('removes the layer from the map on unmount', async () => {
    const map = new MockMap();
    map.addSource('test-source', { type: 'geojson' });
    map.fire('load');

    const { result, unmount } = withSetupScope(() =>
      useCreateLayer<FillLayerSpecification>({
        map: shallowRef(map as unknown as Map),
        id: 'owned-layer',
        source: shallowRef('test-source'),
        type: 'fill',
      }),
    );

    await flushTimers();
    expect(map.layerIds()).toContain('owned-layer');

    unmount();

    expect(map.layerIds()).not.toContain('owned-layer');
    expect(result.isLayerReady.value).toBe(false);
  });
});

describe('useCreateLayer configuration before creation', () => {
  it('applies a paint change made before the map is ready', async () => {
    const map = new MockMap();
    map.addSource('test-source', { type: 'geojson' });

    const { setPaintProperty } = withSetup(() =>
      useCreateLayer<FillLayerSpecification>({
        map: shallowRef(map as unknown as Map),
        id: 'styled-later',
        source: shallowRef('test-source'),
        type: 'fill',
        paint: { 'fill-color': '#ff0000' },
      }),
    );

    // Nothing is on the map yet, so there is no layer to set this on. The
    // value still has to win over the setup-time paint when the layer is built.
    setPaintProperty('fill-color', '#0000ff');

    map.fire('load', { type: 'load', target: map });
    await nextTick();

    const layer = map.getLayer('styled-later') as FillLayerSpecification;
    expect(layer.paint).toEqual({ 'fill-color': '#0000ff' });
  });

  it('rebuilds the layer with the latest filter and zoom range after a style reload', async () => {
    const map = new MockMap();
    map.addSource('test-source', { type: 'geojson' });

    const { setFilter, setZoomRange } = withSetup(() =>
      useCreateLayer<FillLayerSpecification>({
        map: shallowRef(map as unknown as Map),
        id: 'reloaded-layer',
        source: shallowRef('test-source'),
        type: 'fill',
      }),
    );

    map.fire('load', { type: 'load', target: map });
    await nextTick();

    setFilter(['==', 'kind', 'park']);
    setZoomRange(5, 12);

    map.fire('styledataloading');
    map.fire('styledata');
    await nextTick();

    const layer = map.getLayer('reloaded-layer') as FillLayerSpecification;
    expect(layer.filter).toEqual(['==', 'kind', 'park']);
    expect(layer.minzoom).toBe(5);
    expect(layer.maxzoom).toBe(12);
  });
});
