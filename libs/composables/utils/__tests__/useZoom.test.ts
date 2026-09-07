import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { withSetup } from '../../../test-utils';
import { useZoomTo, useZoomIn, ZoomStatus } from '../useZoom';
import { AnimatingMockMap, hasSettled } from './animating-mock-map';

describe('useZoomTo', () => {
  it('settles when zooming to the current level, which fires no zoomend', async () => {
    const map = new AnimatingMockMap();
    const { zoomTo, isZooming, zoomStatus } = withSetup(() =>
      useZoomTo({ map: ref(map as any), autoZoom: false }),
    );
    expect(map.getZoom()).toBe(1);

    const promise = zoomTo(1, { duration: 300 });
    expect(isZooming.value).toBe(true);

    map.complete();
    expect(map.listenerCount('zoomend')).toBe(0);
    expect(await hasSettled(promise)).toBe(true);
    await expect(promise).resolves.toBeUndefined();
    expect(isZooming.value).toBe(false);
    expect(zoomStatus.value).toBe(ZoomStatus.Completed);
  });

  it('does not resolve before the default ease completes when called without options', async () => {
    const map = new AnimatingMockMap();
    const { zoomTo, isZooming } = withSetup(() =>
      useZoomTo({ map: ref(map as any), autoZoom: false }),
    );

    const promise = zoomTo(10);
    expect(map.zoomTo).toHaveBeenCalledWith(
      10,
      undefined,
      expect.objectContaining({ vmlAnimationId: expect.any(Number) }),
    );
    expect(await hasSettled(promise)).toBe(false);
    expect(isZooming.value).toBe(true);

    map.complete();
    await expect(promise).resolves.toBeUndefined();
    expect(isZooming.value).toBe(false);
    expect(map.getZoom()).toBe(10);
  });
});

describe('useZoomIn', () => {
  it('waits for the default ease when called without options', async () => {
    const map = new AnimatingMockMap();
    const { zoomIn, isZooming } = withSetup(() =>
      useZoomIn({ map: ref(map as any), autoZoom: false }),
    );

    const promise = zoomIn();
    expect(await hasSettled(promise)).toBe(false);
    expect(isZooming.value).toBe(true);

    map.complete();
    await expect(promise).resolves.toBeUndefined();
    expect(isZooming.value).toBe(false);
  });
});
