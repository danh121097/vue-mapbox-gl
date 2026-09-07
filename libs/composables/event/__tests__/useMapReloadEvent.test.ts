import { describe, it, expect, vi } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import type { Map } from 'maplibre-gl';
import { withSetup, withSetupScope } from '../../../test-utils';
import { MockMap } from '../../../__tests__/mock-maplibre';
import { useMapReloadEvent } from '../useMapReloadEvent';

describe('useMapReloadEvent', () => {
  it('calls onLoad once, not on every styledata event', () => {
    const mock = new MockMap();
    const map = shallowRef(mock as unknown as Map);
    const onLoad = vi.fn();

    withSetup(() => useMapReloadEvent({ map, callbacks: { onLoad } }));

    mock.fire('load', { type: 'load', target: mock });
    expect(onLoad).toHaveBeenCalledTimes(1);

    // MapLibre hands listeners the event object as their first argument. A
    // handler that reads that argument as its "force" flag re-runs onLoad on
    // every style mutation, sprite load and source addition.
    for (let i = 0; i < 5; i++) {
      mock.fire('styledata', { type: 'styledata', target: mock });
    }

    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('still re-runs onLoad when forced explicitly', () => {
    const mock = new MockMap();
    const map = shallowRef(mock as unknown as Map);
    const onLoad = vi.fn();

    const { forceLoad } = withSetup(() =>
      useMapReloadEvent({ map, callbacks: { onLoad } }),
    );

    mock.fire('load', { type: 'load', target: mock });
    expect(onLoad).toHaveBeenCalledTimes(1);

    forceLoad();
    expect(onLoad).toHaveBeenCalledTimes(2);
  });

  it('detaches from the map it attached to when the map is replaced', async () => {
    const first = new MockMap();
    const map = shallowRef(first as unknown as Map);

    withSetup(() =>
      useMapReloadEvent({ map, callbacks: { onLoad: () => {} } }),
    );

    expect(first.listenerCount('styledata')).toBe(1);

    const second = new MockMap();
    map.value = second as unknown as Map;
    await Promise.resolve();

    // Cleanup must target the map the listeners were attached to. Reading the
    // map ref at cleanup time detaches from the incoming map instead, leaving
    // the outgoing one subscribed forever.
    expect(first.listenerCount('styledata')).toBe(0);
    expect(second.listenerCount('styledata')).toBe(1);
  });

  it('fires onLoad for a replacement map that is already style-loaded', async () => {
    const first = new MockMap();
    const map = shallowRef(first as unknown as Map);
    const onLoad = vi.fn();

    withSetup(() => useMapReloadEvent({ map, callbacks: { onLoad } }));

    first.fire('load', { type: 'load', target: first });
    expect(onLoad).toHaveBeenCalledTimes(1);

    // The incoming map carries none of the outgoing map's load state. Without
    // a status reset both setup branches fall through and the consumer never
    // gets to build its layers and sources on the new map.
    const second = new MockMap();
    second.setStyleLoaded(true);
    map.value = second as unknown as Map;
    await nextTick();

    expect(onLoad).toHaveBeenCalledTimes(2);
    expect(onLoad).toHaveBeenLastCalledWith(second);
  });
});

describe('useMapReloadEvent teardown', () => {
  it('unloads the outgoing map before loading its replacement', async () => {
    const first = new MockMap({ name: 'first' });
    const second = new MockMap({ name: 'second' });
    const map = shallowRef(first as unknown as Map);
    const calls: string[] = [];
    const nameOf = (m: Map) => (m as unknown as MockMap).options.name;

    withSetup(() =>
      useMapReloadEvent({
        map,
        callbacks: {
          onLoad: (m) => calls.push(`load:${nameOf(m)}`),
          onUnload: (m) => calls.push(`unload:${nameOf(m)}`),
        },
      }),
    );

    first.fire('load', { type: 'load', target: first });

    second.setStyleLoaded(true);
    map.value = second as unknown as Map;
    await nextTick();

    // Consumers keep per-map objects (layers, sources) and skip creation while
    // they hold one. Without an unload for the outgoing map those objects stay
    // pinned to it and the replacement map gets nothing.
    expect(calls).toEqual(['load:first', 'unload:first', 'load:second']);
  });

  it('does not fire the deferred initial load after unmount', async () => {
    const mock = new MockMap();
    mock.setStyleLoaded(true);
    const map = shallowRef(mock as unknown as Map);
    const onLoad = vi.fn();

    const { unmount } = withSetupScope(() =>
      useMapReloadEvent({ map, callbacks: { onLoad } }),
    );

    unmount();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onLoad).not.toHaveBeenCalled();
  });
});
