import { describe, it, expect } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import type { Map } from 'maplibre-gl';
import { withSetup } from '../../../test-utils';
import { MockMap } from '../../../__tests__/mock-maplibre';
import {
  useFitScreenCoordinates,
  FitScreenCoordinatesStatus,
} from '../useFitScreenCoordinates';

/** A map that reports its style as loaded, which is what gates an immediate fit. */
function loadedMap(): MockMap {
  const map = new MockMap();
  map.fire('load', { type: 'load' });
  return map;
}

describe('useFitScreenCoordinates listener hygiene', () => {
  it('keeps one deferred styledata listener and drops it with the map', async () => {
    const first = loadedMap();
    const map = shallowRef<Map | null>(first as unknown as Map);

    const { fitScreenCoordinates } = withSetup(() =>
      useFitScreenCoordinates({ map }),
    );

    fitScreenCoordinates([0, 0], [10, 10]);
    expect(first.fitScreenCoordinates).toHaveBeenCalledTimes(1);

    // A replacement map arrives with no style, so the re-fit is deferred
    // behind a styledata listener.
    const second = new MockMap();
    map.value = second as unknown as Map;
    await nextTick();
    expect(second.listenerCount('styledata')).toBe(1);

    const third = new MockMap();
    map.value = third as unknown as Map;
    await nextTick();

    // The effect used to attach that listener with no cleanup registered, so
    // every map it moved off kept one forever — and because the effect also
    // re-triggered itself, they accumulated on the live map too.
    expect(second.listenerCount('styledata')).toBe(0);
    expect(third.listenerCount('styledata')).toBe(1);
  });

  it('detaches the deferred listener once the style arrives', async () => {
    const first = loadedMap();
    const map = shallowRef<Map | null>(first as unknown as Map);

    const { fitScreenCoordinates } = withSetup(() =>
      useFitScreenCoordinates({ map }),
    );
    fitScreenCoordinates([0, 0], [10, 10]);

    const second = new MockMap();
    map.value = second as unknown as Map;
    await nextTick();

    second.fire('load', { type: 'load' });
    second.fire('styledata', { type: 'styledata', target: second });

    expect(second.fitScreenCoordinates).toHaveBeenCalledTimes(1);
    expect(second.listenerCount('styledata')).toBe(0);

    // A later style mutation must not re-fit — the listener is spent.
    second.fire('styledata', { type: 'styledata', target: second });
    expect(second.fitScreenCoordinates).toHaveBeenCalledTimes(1);
  });

  it('re-applies on the first styledata even while sources are still pending', async () => {
    const first = loadedMap();
    const map = shallowRef<Map | null>(first as unknown as Map);

    const { fitScreenCoordinates, status } = withSetup(() =>
      useFitScreenCoordinates({ map }),
    );
    fitScreenCoordinates([0, 0], [10, 10]);

    const second = new MockMap();
    map.value = second as unknown as Map;
    await nextTick();

    // `isStyleLoaded()` is typically still false on the first `styledata`
    // because sources have not finished loading — the camera move must not
    // be gated on it.
    expect(second.isStyleLoaded()).toBe(false);
    second.fire('styledata', { type: 'styledata', target: second });

    expect(second.fitScreenCoordinates).toHaveBeenCalledTimes(1);
    expect(status.value).toBe(FitScreenCoordinatesStatus.Set);
  });
});
