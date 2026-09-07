import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { withSetup } from '../../../test-utils';
import { createCameraAnimation } from '../createCameraAnimation';
import { AnimationStatus } from '../cameraAnimationTypes';
import { AnimatingMockMap, hasSettled } from './animating-mock-map';

function setup(map = new AnimatingMockMap()) {
  const animation = withSetup(() =>
    createCameraAnimation({ map: ref(map as any) }),
  );
  return { map, ...animation };
}

describe('createCameraAnimation', () => {
  it('resolves when its own completion event fires', async () => {
    const { map, executeAnimation, animationStatus } = setup();

    const promise = executeAnimation('flyTo', [{ center: [0, 0] }], 'moveend');
    // The map method receives an `eventData` token as its trailing argument.
    expect(map.flyTo).toHaveBeenCalledWith(
      { center: [0, 0] },
      expect.objectContaining({ vmlAnimationId: expect.any(Number) }),
    );
    expect(animationStatus.value).toBe(AnimationStatus.Running);

    map.complete();
    await expect(promise).resolves.toBeUndefined();
    expect(animationStatus.value).toBe(AnimationStatus.Completed);
    expect(map.listenerCount('moveend')).toBe(0);
  });

  it('ignores a completion event that does not carry its token', async () => {
    const { map, executeAnimation, isAnimating } = setup();

    const promise = executeAnimation('flyTo', [{}], 'moveend');
    map.fire('moveend', { type: 'moveend' });
    map.fire('moveend', { type: 'moveend', vmlAnimationId: -1 });

    expect(await hasSettled(promise)).toBe(false);
    expect(isAnimating.value).toBe(true);
  });

  it('does not resolve the second of two overlapping animations when the first is interrupted', async () => {
    const { map, executeAnimation, isAnimating } = setup();

    const first = executeAnimation('flyTo', [{ zoom: 5 }], 'moveend');
    // Starting the second ease stops the first, which fires the first's
    // `moveend` synchronously inside this call.
    const second = executeAnimation('flyTo', [{ zoom: 8 }], 'moveend');

    await expect(first).resolves.toBeUndefined();
    expect(await hasSettled(second)).toBe(false);
    expect(isAnimating.value).toBe(true);

    map.complete();
    await expect(second).resolves.toBeUndefined();
    expect(isAnimating.value).toBe(false);
  });

  it('resolves immediately for instant operations (no completionEvent)', async () => {
    const { map, executeAnimation } = setup();

    await expect(
      executeAnimation('jumpTo', [{ center: [0, 0] }]),
    ).resolves.toBeUndefined();
    expect(map.jumpTo).toHaveBeenCalledWith({ center: [0, 0] });
  });

  it('rejects when map is null', async () => {
    const { executeAnimation } = withSetup(() =>
      createCameraAnimation({ map: ref(null) }),
    );

    await expect(executeAnimation('flyTo', [{}], 'moveend')).rejects.toThrow(
      'Map instance not available',
    );
  });

  it('rejects on timeout, stops the map and detaches its listener', async () => {
    vi.useFakeTimers();
    try {
      const { map, executeAnimation, animationStatus } = setup();

      const promise = executeAnimation('flyTo', [{}], 'moveend', 100);
      vi.advanceTimersByTime(150);

      await expect(promise).rejects.toThrow('Animation timed out after 100ms');
      expect(map.stop).toHaveBeenCalled();
      expect(animationStatus.value).toBe(AnimationStatus.Error);
      expect(map.listenerCount('moveend')).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('is unaffected by unrelated map error events', async () => {
    const { map, executeAnimation, animationStatus } = setup();

    const promise = executeAnimation('flyTo', [{}], 'moveend');
    // e.g. a tile fetch failing while the camera is still moving
    map.fire('error', { type: 'error', error: new Error('404 tile') });

    expect(await hasSettled(promise)).toBe(false);
    expect(animationStatus.value).toBe(AnimationStatus.Running);
    expect(map.listenerCount('error')).toBe(0);

    map.complete();
    await expect(promise).resolves.toBeUndefined();
    expect(animationStatus.value).toBe(AnimationStatus.Completed);
  });

  it('rejects and detaches when the map method throws', async () => {
    const { map, executeAnimation, animationStatus } = setup();
    map.flyTo.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    await expect(executeAnimation('flyTo', [{}], 'moveend')).rejects.toThrow(
      'boom',
    );
    expect(animationStatus.value).toBe(AnimationStatus.Error);
    expect(map.listenerCount('moveend')).toBe(0);
  });

  it('getCurrentCamera returns camera state', () => {
    const { getCurrentCamera } = setup();

    expect(getCurrentCamera()).toEqual({
      center: { lng: 0, lat: 0 },
      zoom: 1,
      bearing: 0,
      pitch: 0,
    });
  });

  it('getCurrentCamera returns null when map is null', () => {
    const { getCurrentCamera } = withSetup(() =>
      createCameraAnimation({ map: ref(null) }),
    );

    expect(getCurrentCamera()).toBeNull();
  });

  it('stopAnimation calls map.stop()', () => {
    const { map, stopAnimation } = setup();

    stopAnimation();
    expect(map.stop).toHaveBeenCalled();
  });
});
