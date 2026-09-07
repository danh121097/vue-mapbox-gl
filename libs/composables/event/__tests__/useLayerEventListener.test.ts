import { describe, it, expect, vi } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import type { FillLayerSpecification, Map } from 'maplibre-gl';
import { withSetup, withSetupScope } from '../../../test-utils';
import { MockMap } from '../../../__tests__/mock-maplibre';
import { useCreateLayer } from '../../layers/useCreateLayer';
import { useLayerEventListener } from '../useLayerEventListener';

/** A style-loaded map that already carries the source the layer needs. */
function loadedMapWithSource(sourceId = 'test-source'): MockMap {
  const map = new MockMap();
  map.addSource(sourceId, { type: 'geojson' });
  map.fire('load');
  return map;
}

/** Lets the deferred initial load of `useMapReloadEvent` run. */
const flushTimers = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('useLayerEventListener', () => {
  it('attaches when the layer is created after the map is already loaded', async () => {
    const map = loadedMapWithSource();
    const mapRef = shallowRef(map as unknown as Map);
    const onClick = vi.fn();

    withSetup(() => {
      const { getLayer } = useCreateLayer<FillLayerSpecification>({
        map: mapRef,
        id: 'clickable',
        source: shallowRef('test-source'),
        type: 'fill',
      });
      useLayerEventListener({
        map: mapRef,
        layer: getLayer,
        event: 'click',
        on: onClick,
      });
    });

    // The map is the listener's target and it never changes here; only the
    // layer arrives later. A listener that keys re-evaluation on the target
    // alone sees "same map" and never attaches.
    await flushTimers();
    await nextTick();

    expect(map.layerIds()).toContain('clickable');
    expect(map.layerListenerCount('click', 'clickable')).toBe(1);

    map.fireOnLayer('click', 'clickable', { type: 'click' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('re-attaches after a style reload recreates the layer', async () => {
    const map = loadedMapWithSource();
    const mapRef = shallowRef(map as unknown as Map);
    const onClick = vi.fn();

    withSetup(() => {
      const { getLayer } = useCreateLayer<FillLayerSpecification>({
        map: mapRef,
        id: 'reloaded',
        source: shallowRef('test-source'),
        type: 'fill',
      });
      useLayerEventListener({
        map: mapRef,
        layer: getLayer,
        event: 'click',
        on: onClick,
      });
    });

    await flushTimers();
    await nextTick();
    expect(map.layerListenerCount('click', 'reloaded')).toBe(1);

    // A style swap tears every layer down and the library rebuilds them on
    // `styledata`. The listener has to follow the layer through that.
    map.fire('styledataloading');
    await nextTick();
    expect(map.layerListenerCount('click', 'reloaded')).toBe(0);

    map.fire('styledata');
    await nextTick();

    expect(map.layerIds()).toContain('reloaded');
    expect(map.layerListenerCount('click', 'reloaded')).toBe(1);
  });

  it('detaches from the layer it attached to when the layer goes away', async () => {
    const map = loadedMapWithSource();
    const source = shallowRef<string | null>('test-source');
    const mapRef = shallowRef(map as unknown as Map);

    withSetup(() => {
      const { getLayer } = useCreateLayer<FillLayerSpecification>({
        map: mapRef,
        id: 'transient',
        source,
        type: 'fill',
      });
      useLayerEventListener({
        map: mapRef,
        layer: getLayer,
        event: 'click',
        on: () => {},
      });
    });

    await flushTimers();
    await nextTick();
    expect(map.layerListenerCount('click', 'transient')).toBe(1);

    // Once the layer ref is null there is no id left to read at detach time;
    // the id has to have been captured when the handler went on.
    source.value = null;
    await nextTick();

    expect(map.layerListenerCount('click', 'transient')).toBe(0);
  });

  it('removes the layer listener on unmount', async () => {
    const map = loadedMapWithSource();
    const mapRef = shallowRef(map as unknown as Map);

    const { unmount } = withSetupScope(() => {
      const { getLayer } = useCreateLayer<FillLayerSpecification>({
        map: mapRef,
        id: 'unmounted',
        source: shallowRef('test-source'),
        type: 'fill',
      });
      useLayerEventListener({
        map: mapRef,
        layer: getLayer,
        event: 'click',
        on: () => {},
      });
    });

    await flushTimers();
    await nextTick();
    expect(map.layerListenerCount('click', 'unmounted')).toBe(1);

    unmount();

    expect(map.layerListenerCount('click', 'unmounted')).toBe(0);
  });
});
