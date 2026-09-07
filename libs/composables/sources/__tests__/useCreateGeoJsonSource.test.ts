import { describe, it, expect, vi } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import type { Map } from 'maplibre-gl';
import { withSetup, withSetupScope } from '../../../test-utils';
import { MockMap } from '../../../__tests__/mock-maplibre';
import {
  useCreateGeoJsonSource,
  SourceStatus,
} from '../useCreateGeoJsonSource';

const EMPTY_FC = { type: 'FeatureCollection', features: [] } as const;

/** Drives the map through the events that make a source reach `Created`. */
function settleSource(map: MockMap, sourceId: string) {
  map.fire('load');
  map.fire('sourcedata', { sourceId, isSourceLoaded: true });
}

describe('useCreateGeoJsonSource reactivity contract', () => {
  it('reports the source as ready only after it is added and loaded', async () => {
    const map = new MockMap();
    const { sourceId, sourceStatus, isSourceReady } = withSetup(() =>
      useCreateGeoJsonSource({
        map: shallowRef(map as unknown as Map),
        id: 'test-source',
        data: EMPTY_FC as any,
      }),
    );

    expect(isSourceReady.value).toBe(false);
    expect(sourceStatus.value).toBe(SourceStatus.NotCreated);

    settleSource(map, sourceId);
    await nextTick();

    expect(map.sourceIds()).toContain('test-source');
    expect(sourceStatus.value).toBe(SourceStatus.Created);
    expect(isSourceReady.value).toBe(true);
  });

  it('hands the register callback refs that reflect later state', async () => {
    const map = new MockMap();
    const register = vi.fn();

    const { sourceId } = withSetup(() =>
      useCreateGeoJsonSource({
        map: shallowRef(map as unknown as Map),
        id: 'registered-source',
        data: EMPTY_FC as any,
        register,
      }),
    );

    settleSource(map, sourceId);
    await nextTick();

    expect(register).toHaveBeenCalledTimes(1);
    const actions = register.mock.calls[0][0];
    expect(actions.isSourceReady.value).toBe(true);
    expect(actions.sourceStatus.value).toBe(SourceStatus.Created);
  });
});

const ONE_FEATURE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: {},
    },
  ],
} as const;

describe('useCreateGeoJsonSource lifecycle', () => {
  it('moves the source onto a replacement map', async () => {
    const first = new MockMap();
    const mapRef = shallowRef(first as unknown as Map);

    const { sourceId } = withSetup(() =>
      useCreateGeoJsonSource({
        map: mapRef,
        id: 'moving-source',
        data: EMPTY_FC as any,
      }),
    );

    settleSource(first, sourceId);
    await nextTick();
    expect(first.sourceIds()).toContain('moving-source');

    const second = new MockMap();
    second.setStyleLoaded(true);
    mapRef.value = second as unknown as Map;
    await nextTick();

    expect(first.sourceIds()).not.toContain('moving-source');
    expect(second.sourceIds()).toContain('moving-source');
  });

  it('leaves no source behind when unmounted before the deferred load fires', async () => {
    const map = new MockMap();
    map.fire('load');

    const { unmount } = withSetupScope(() =>
      useCreateGeoJsonSource({
        map: shallowRef(map as unknown as Map),
        id: 'short-lived',
        data: EMPTY_FC as any,
      }),
    );

    unmount();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(map.sourceIds()).not.toContain('short-lived');
  });

  it('removes the source from the map on unmount', async () => {
    const map = new MockMap();

    const { result, unmount } = withSetupScope(() =>
      useCreateGeoJsonSource({
        map: shallowRef(map as unknown as Map),
        id: 'owned-source',
        data: EMPTY_FC as any,
      }),
    );

    settleSource(map, result.sourceId);
    await nextTick();
    expect(map.sourceIds()).toContain('owned-source');

    unmount();

    expect(map.sourceIds()).not.toContain('owned-source');
    expect(result.isSourceReady.value).toBe(false);
  });

  it('creates the source with data set before the map is ready', async () => {
    const map = new MockMap();

    const { setData } = withSetup(() =>
      useCreateGeoJsonSource({
        map: shallowRef(map as unknown as Map),
        id: 'data-later',
        data: EMPTY_FC as any,
      }),
    );

    // No source exists yet to receive this; it must still be the data the
    // source is eventually created with.
    setData(ONE_FEATURE as any);

    map.fire('load');
    await nextTick();

    const source = map.getSource('data-later') as { data: unknown };
    expect(source.data).toBe(ONE_FEATURE);
  });
});
