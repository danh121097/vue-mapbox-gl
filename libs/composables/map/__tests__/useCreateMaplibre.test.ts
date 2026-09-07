import { describe, it, expect, vi, afterEach } from 'vitest';
import { nextTick, ref, shallowRef } from 'vue';
import { withSetup } from '../../../test-utils';
import { MapCreationStatus } from '@libs/enums';
import type { MockMap } from '../../../__tests__/mock-maplibre';

/** Flipped by a test to make the next `new Map()` throw, like a no-WebGL host. */
const construction = vi.hoisted(() => ({ throws: false }));

vi.mock('maplibre-gl', async (importOriginal) => {
  const { mockMaplibreModule, MockMap } = await import(
    '../../../__tests__/mock-maplibre'
  );
  const mod = await mockMaplibreModule(importOriginal as () => Promise<any>);
  class FailableMap extends MockMap {
    constructor(options: Record<string, any>) {
      if (construction.throws) throw new Error('WebGL not supported');
      super(options);
    }
  }
  return { ...mod, Map: FailableMap };
});

const { useCreateMaplibre } = await import('../useCreateMaplibre');

function setupMap(onError?: (error: any) => void) {
  const el = shallowRef<HTMLElement | null>(null);
  const style = ref('https://example.test/style.json');
  const actions = withSetup(() => useCreateMaplibre(el, style, { onError }));
  return { el, actions };
}

afterEach(() => {
  construction.throws = false;
});

describe('useCreateMaplibre reactivity contract', () => {
  it('exposes status as live refs, not values frozen at setup', async () => {
    const { el, actions } = setupMap();

    expect(actions.isMapReady.value).toBe(false);
    expect(actions.mapCreationStatus.value).toBe(
      MapCreationStatus.NotInitialized,
    );

    el.value = document.createElement('div');
    await nextTick();

    const map = actions.mapInstance.value as unknown as MockMap;
    expect(map).not.toBeNull();
    expect(actions.isMapLoading.value).toBe(true);
    expect(actions.isMapReady.value).toBe(false);

    map.fire('load');
    await nextTick();

    expect(actions.isMapReady.value).toBe(true);
    expect(actions.isMapLoading.value).toBe(false);
    expect(actions.mapCreationStatus.value).toBe(MapCreationStatus.Loaded);
  });

  it('flips hasMapError on the map error event', async () => {
    const { el, actions } = setupMap();

    el.value = document.createElement('div');
    await nextTick();

    expect(actions.hasMapError.value).toBe(false);

    (actions.mapInstance.value as unknown as MockMap).fire('error', {
      error: new Error('boom'),
    });
    await nextTick();

    expect(actions.hasMapError.value).toBe(true);
  });

  it('hands the register callback live refs', async () => {
    const el = shallowRef<HTMLElement | null>(null);
    const style = ref('https://example.test/style.json');
    const register = vi.fn();

    const actions = withSetup(() => useCreateMaplibre(el, style, { register }));

    expect(register).toHaveBeenCalledTimes(1);
    const registered = register.mock.calls[0][0];
    expect(registered.isMapReady.value).toBe(false);

    el.value = document.createElement('div');
    await nextTick();
    (actions.mapInstance.value as unknown as MockMap).fire('load');
    await nextTick();

    // The same object handed to register must reflect the new state
    expect(registered.isMapReady.value).toBe(true);
    expect(registered.mapCreationStatus.value).toBe(MapCreationStatus.Loaded);
  });
});

describe('useCreateMaplibre error classification', () => {
  it('keeps a loaded map ready through a runtime resource error', async () => {
    const onError = vi.fn();
    const { el, actions } = setupMap(onError);

    el.value = document.createElement('div');
    await nextTick();
    const map = actions.mapInstance.value as unknown as MockMap;
    map.fire('load');
    await nextTick();
    expect(actions.isMapReady.value).toBe(true);

    // A single 404 tile after load. The map keeps working, so the consumer
    // must hear about it without losing the ready state.
    const tileError = { error: new Error('404 tile') };
    map.fire('error', tileError);
    await nextTick();

    expect(onError).toHaveBeenCalledWith(tileError);
    expect(actions.isMapReady.value).toBe(true);
    expect(actions.hasMapError.value).toBe(false);
    expect(actions.mapCreationStatus.value).toBe(MapCreationStatus.Loaded);
  });

  it('reports an error state when the map cannot be constructed', async () => {
    construction.throws = true;
    const onError = vi.fn();
    const { el, actions } = setupMap(onError);

    el.value = document.createElement('div');
    await nextTick();

    expect(actions.mapInstance.value).toBeNull();
    expect(actions.hasMapError.value).toBe(true);
    expect(actions.isMapReady.value).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
