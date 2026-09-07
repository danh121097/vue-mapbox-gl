import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { withSetup } from '../../../test-utils';
import { useRotateTo, useResetNorth, RotationStatus } from '../useRotate';
import { AnimatingMockMap, hasSettled } from './animating-mock-map';

describe('useRotateTo', () => {
  it('settles when rotating to the current bearing, which fires no rotateend', async () => {
    const map = new AnimatingMockMap();
    const { rotateTo, isRotating, rotationStatus } = withSetup(() =>
      useRotateTo({ map: ref(map as any), autoRotate: false }),
    );
    expect(map.getBearing()).toBe(0);

    const promise = rotateTo(0, { duration: 300 });
    expect(isRotating.value).toBe(true);

    map.complete();
    expect(map.listenerCount('rotateend')).toBe(0);
    expect(await hasSettled(promise)).toBe(true);
    await expect(promise).resolves.toBeUndefined();
    expect(isRotating.value).toBe(false);
    expect(rotationStatus.value).toBe(RotationStatus.Completed);
  });

  it('waits for the default ease when called without options', async () => {
    const map = new AnimatingMockMap();
    const { rotateTo, isRotating } = withSetup(() =>
      useRotateTo({ map: ref(map as any), autoRotate: false }),
    );

    const promise = rotateTo(90);
    expect(map.rotateTo).toHaveBeenCalledWith(
      90,
      undefined,
      expect.objectContaining({ vmlAnimationId: expect.any(Number) }),
    );
    expect(await hasSettled(promise)).toBe(false);
    expect(isRotating.value).toBe(true);

    map.complete();
    await expect(promise).resolves.toBeUndefined();
    expect(isRotating.value).toBe(false);
  });
});

describe('useResetNorth', () => {
  it('waits for the default ease when called without options', async () => {
    const map = new AnimatingMockMap();
    const { resetNorth, isRotating } = withSetup(() =>
      useResetNorth({ map: ref(map as any), autoReset: false }),
    );

    const promise = resetNorth();
    expect(await hasSettled(promise)).toBe(false);
    expect(isRotating.value).toBe(true);

    map.complete();
    await expect(promise).resolves.toBeUndefined();
    expect(isRotating.value).toBe(false);
  });
});
