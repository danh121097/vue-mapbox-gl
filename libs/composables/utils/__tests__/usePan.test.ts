import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { withSetup } from '../../../test-utils';
import { usePanTo } from '../usePan';
import { AnimatingMockMap, hasSettled } from './animating-mock-map';

describe('usePanTo', () => {
  it('waits for the default ease when called without options', async () => {
    const map = new AnimatingMockMap();
    const { panTo, isPanning } = withSetup(() =>
      usePanTo({ map: ref(map as any), autoPan: false }),
    );

    const promise = panTo([1, 2]);
    expect(map.panTo).toHaveBeenCalledWith(
      [1, 2],
      undefined,
      expect.objectContaining({ vmlAnimationId: expect.any(Number) }),
    );
    expect(await hasSettled(promise)).toBe(false);
    expect(isPanning.value).toBe(true);

    map.complete();
    await expect(promise).resolves.toBeUndefined();
    expect(isPanning.value).toBe(false);
  });
});
