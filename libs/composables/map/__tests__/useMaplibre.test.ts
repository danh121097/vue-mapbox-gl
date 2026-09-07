import { describe, it, expect } from 'vitest';
import { computed, nextTick, ref, shallowRef } from 'vue';
import type { Map } from 'maplibre-gl';
import { MapCreationStatus } from '@libs/enums';
import type { MaplibreActions } from '@libs/types';
import { withSetup } from '../../../test-utils';
import { MockMap } from '../../../__tests__/mock-maplibre';
import { useMaplibre } from '../useMaplibre';

/**
 * The narrow slice of `MaplibreActions` that `register` reads. The rest is
 * setter plumbing `useMaplibre` only forwards, never inspects.
 */
function actionsFor(map: ReturnType<typeof shallowRef<Map | null>>) {
  return {
    mapInstance: computed(() => map.value),
    mapCreationStatus: computed(() => MapCreationStatus.Loading),
    isMapReady: computed(() => false),
    isMapLoading: computed(() => true),
    hasMapError: computed(() => false),
  } as unknown as MaplibreActions;
}

describe('useMaplibre listener hygiene', () => {
  it('does not leave a load listener on a map it has moved off', async () => {
    const first = new MockMap();
    const map = shallowRef<Map | null>(first as unknown as Map);

    const { register } = withSetup(() => useMaplibre());
    await register(actionsFor(map));

    // The map is not loaded yet, so readiness is deferred behind a listener.
    expect(first.listenerCount('load')).toBe(1);

    const second = new MockMap();
    map.value = second as unknown as Map;
    await nextTick();

    // The handler used to be attached inside a watch callback that can fire
    // repeatedly for the same map, with nothing detaching it from the map it
    // was attached to.
    expect(first.listenerCount('load')).toBe(0);
    expect(second.listenerCount('load')).toBe(1);
  });

  it('reports the map ready once the deferred load event arrives', async () => {
    const mock = new MockMap();
    const map = shallowRef<Map | null>(mock as unknown as Map);

    const { register, mapStatus, isMapReady } = withSetup(() => useMaplibre());
    await register(actionsFor(map));

    expect(isMapReady.value).toBe(false);
    expect(mapStatus.value).toBe(MapCreationStatus.Loading);

    mock.fire('load', { type: 'load', target: mock });
    await nextTick();

    expect(mapStatus.value).toBe(MapCreationStatus.Loaded);
    expect(isMapReady.value).toBe(true);
    // `once`, so the listener is spent rather than left behind.
    expect(mock.listenerCount('load')).toBe(0);
  });

  it('takes an already-loaded map as ready without waiting for an event', async () => {
    const mock = new MockMap();
    mock.fire('load', { type: 'load', target: mock });
    const map = shallowRef<Map | null>(mock as unknown as Map);

    const { register, isMapReady } = withSetup(() => useMaplibre());
    await register(actionsFor(map));

    expect(isMapReady.value).toBe(true);
    expect(mock.listenerCount('load')).toBe(0);
  });
});

describe('useMaplibre creation failure', () => {
  it('reports hasMapError when the map could not be constructed', async () => {
    // Mirrors `useCreateMaplibre` on a host without WebGL: `register` runs
    // while nothing has happened yet, then `new Map()` throws and the map ref
    // stays `null` for good — only the status changes.
    const status = ref(MapCreationStatus.NotInitialized);
    const instance = {
      mapInstance: computed(() => null),
      mapCreationStatus: computed(() => status.value),
      isMapReady: computed(() => false),
      isMapLoading: computed(() => status.value === MapCreationStatus.Loading),
      hasMapError: computed(() => status.value === MapCreationStatus.Error),
    } as unknown as MaplibreActions;

    const { register, hasMapError, mapStatus } = withSetup(() => useMaplibre());
    await register(instance);
    expect(hasMapError.value).toBe(false);

    status.value = MapCreationStatus.Error;
    await nextTick();

    expect(hasMapError.value).toBe(true);
    expect(mapStatus.value).toBe(MapCreationStatus.Error);
  });
});
