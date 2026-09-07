import { describe, it, expect, vi } from 'vitest';
import { nextTick, ref, shallowRef, watch } from 'vue';
import { Marker } from 'maplibre-gl';
import type { Map } from 'maplibre-gl';
import { withSetup, withSetupScope } from '../../../test-utils';
import { MockMap } from '../../../__tests__/mock-maplibre';
import { useCreateMarker, MarkerStatus } from '../useCreateMarker';

describe('useCreateMarker reactivity contract', () => {
  it('exposes the marker once a map becomes available', async () => {
    const map = shallowRef<Map | null>(null);

    // autoAdd is off so the assertion targets creation, not MapLibre's
    // DOM/WebGL attachment path
    const { marker, markerStatus, isMarkerCreated } = withSetup(() =>
      useCreateMarker({ map, lnglat: [10, 20], autoAdd: false }),
    );

    expect(marker.value).toBeNull();
    expect(isMarkerCreated.value).toBe(false);
    expect(markerStatus.value).toBe(MarkerStatus.NotCreated);

    map.value = new MockMap() as unknown as Map;
    await nextTick();

    expect(marker.value).toBeInstanceOf(Marker);
    expect(isMarkerCreated.value).toBe(true);
    expect(markerStatus.value).toBe(MarkerStatus.Created);
  });

  it('rebuilds the marker on the new map when the map is replaced', async () => {
    const map = shallowRef<Map | null>(new MockMap() as unknown as Map);

    const { marker, markerStatus } = withSetup(() =>
      useCreateMarker({ map, lnglat: [10, 20], autoAdd: false }),
    );

    const first = marker.value;
    expect(first).toBeInstanceOf(Marker);

    map.value = new MockMap() as unknown as Map;
    await nextTick();

    expect(marker.value).toBeInstanceOf(Marker);
    expect(marker.value).not.toBe(first);
    expect(markerStatus.value).toBe(MarkerStatus.Created);
  });

  it('clears the marker again when the map goes away', async () => {
    const map = shallowRef<Map | null>(new MockMap() as unknown as Map);

    const { marker, isMarkerCreated } = withSetup(() =>
      useCreateMarker({ map, lnglat: [10, 20], autoAdd: false }),
    );

    expect(isMarkerCreated.value).toBe(true);

    map.value = null;
    await nextTick();

    expect(marker.value).toBeNull();
    expect(isMarkerCreated.value).toBe(false);
  });

  it('rebuilds with the custom element when a template ref resolves late', async () => {
    const map = shallowRef(new MockMap() as unknown as Map);
    const el = ref<HTMLElement | undefined>(undefined);

    const { marker } = withSetup(() =>
      useCreateMarker({ map, el, autoAdd: false }),
    );

    // The map is present at setup, so the marker is built with MapLibre's
    // default pin. A template ref is undefined until the component mounts.
    expect(marker.value?.getElement().id).toBe('');

    const custom = document.createElement('div');
    custom.id = 'custom-pin';
    el.value = custom;
    await nextTick();

    expect(marker.value?.getElement().id).toBe('custom-pin');
  });
});

describe('useCreateMarker lifecycle', () => {
  it('creates the marker exactly once for a stable map', async () => {
    const map = shallowRef(new MockMap() as unknown as Map);

    const { marker, markerStatus } = withSetup(() =>
      useCreateMarker({ map, lnglat: [10, 20], autoAdd: false }),
    );

    const created = marker.value;
    expect(created).toBeInstanceOf(Marker);

    let rebuilds = 0;
    watch(marker, () => {
      rebuilds++;
    });

    for (let i = 0; i < 5; i++) await nextTick();

    // Creation used to sit in a watchEffect that read markerStatus and wrote
    // it in the same run, so the effect was its own dependency — and its
    // onCleanUp tore the marker down before each re-run. The result was a
    // create/destroy cycle on a map that never changed.
    expect(rebuilds).toBe(0);
    expect(marker.value).toBe(created);
    expect(markerStatus.value).toBe(MarkerStatus.Created);
  });

  it('moves the existing marker instead of rebuilding it', async () => {
    const map = shallowRef(new MockMap() as unknown as Map);
    const lnglat = ref<[number, number]>([10, 20]);

    const { marker } = withSetup(() =>
      useCreateMarker({ map, lnglat, autoAdd: false }),
    );

    const created = marker.value;

    lnglat.value = [30, 40];
    await nextTick();

    // A position change is applied to the marker that already exists. Tearing
    // it down and building another would drop any element, popup or drag
    // listener the consumer attached to it.
    expect(marker.value).toBe(created);
    expect(marker.value?.getLngLat().lng).toBe(30);
    expect(marker.value?.getLngLat().lat).toBe(40);
  });
});

describe('useCreateMarker unmount', () => {
  it('removes the marker when the host component unmounts', () => {
    const map = shallowRef(new MockMap() as unknown as Map);
    const removeSpy = vi.spyOn(Marker.prototype, 'remove');

    const { result, unmount } = withSetupScope(() =>
      useCreateMarker({ map, lnglat: [10, 20], autoAdd: false }),
    );
    expect(result.isMarkerCreated.value).toBe(true);

    unmount();

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(result.marker.value).toBeNull();
    expect(result.isMarkerCreated.value).toBe(false);
    removeSpy.mockRestore();
  });
});
