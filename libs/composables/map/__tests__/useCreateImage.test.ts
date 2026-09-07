import { describe, it, expect } from 'vitest';
import { effectScope, shallowRef } from 'vue';
import type { Map } from 'maplibre-gl';
import { MockMap } from '../../../__tests__/mock-maplibre';
import { useCreateImage } from '../useCreateImage';
import type { ImageDatas } from '@libs/types';

/** Smallest valid image payload MapLibre's `addImage` accepts. */
function pixel(): ImageDatas {
  return {
    width: 1,
    height: 1,
    data: new Uint8Array([0, 0, 0, 0]),
  } as unknown as ImageDatas;
}

/** Runs `useCreateImage` inside a detached scope, mirroring `<Image>`. */
function createInScope(
  map: MockMap | null,
  id: string,
  image: ImageDatas | string,
) {
  const scope = effectScope();
  const mapRef = shallowRef(map as unknown as Map | null);
  const actions = scope.run(() =>
    useCreateImage({
      map: mapRef,
      id,
      image,
    }),
  )!;
  return { scope, actions, mapRef };
}

/** Lets the microtask queue and any pending timers drain. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('useCreateImage scope ownership', () => {
  it('removes its image when the owning scope is stopped', async () => {
    const map = new MockMap();
    const { scope, actions } = createInScope(map, 'marker-icon', pixel());

    await actions.loadPromise;
    expect(map.imageIds()).toContain('marker-icon');
    expect(actions.isImageReady.value).toBe(true);

    scope.stop();

    expect(map.imageIds()).not.toContain('marker-icon');
  });

  it('keeps images owned by other scopes intact', async () => {
    const map = new MockMap();
    const first = createInScope(map, 'icon-a', pixel());
    const second = createInScope(map, 'icon-b', pixel());

    await Promise.all([first.actions.loadPromise, second.actions.loadPromise]);
    expect(map.imageIds().sort()).toEqual(['icon-a', 'icon-b']);

    first.scope.stop();

    expect(map.imageIds()).toEqual(['icon-b']);
  });

  it('does not re-add an image whose load finishes after disposal', async () => {
    const map = new MockMap();
    // A URL load is still suspended on `await` when the scope is stopped
    const { scope } = createInScope(
      map,
      'pending-icon',
      'https://example.test/icon.png',
    );

    scope.stop();
    expect(map.imageIds()).toEqual([]);

    await flush();

    expect(map.imageIds()).toEqual([]);
  });

  it('leaves a later batch alone when an earlier load resolves late', async () => {
    const map = new MockMap();
    const stale = createInScope(map, 'icon', 'https://example.test/old.png');

    // Supersede the first batch the way `<Image>` does on a reload
    stale.scope.stop();
    const fresh = createInScope(map, 'icon', pixel());

    await fresh.actions.loadPromise;
    await flush();

    expect(map.imageIds()).toEqual(['icon']);
    expect(fresh.actions.isImageReady.value).toBe(true);
  });
});

describe('useCreateImage loadPromise settlement', () => {
  it('resolves rather than rejects when disposed before the image loads', async () => {
    const map = new MockMap();
    // A URL keeps the load pending across the disposal below
    const { scope, actions } = createInScope(
      map,
      'pending-icon',
      'https://example.test/icon.png',
    );

    scope.stop();

    await expect(actions.loadPromise).resolves.toBeUndefined();
  });

  it('does not emit an unhandled rejection when nobody awaits loadPromise', async () => {
    const map = new MockMap();
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);

    try {
      // A pending URL load means disposal settles the promise, which is where
      // an unconditional reject used to escape unobserved
      const { scope } = createInScope(
        map,
        'orphan-icon',
        'https://example.test/orphan.png',
      );
      scope.stop();

      // Node reports unhandled rejections after the microtask queue drains
      await flush();

      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('settles even when disposed before a map ever exists', async () => {
    // `<Image>` mounts before the map is created; its batch must still settle
    // or `Promise.allSettled` never resolves and `loading` stays true forever
    const { scope, actions } = createInScope(null, 'no-map-icon', pixel());

    scope.stop();

    let settled = false;
    void actions.loadPromise.then(() => {
      settled = true;
    });
    await flush();

    expect(settled).toBe(true);
  });
});

describe('useCreateImage explicit removal', () => {
  it('keeps the image off the map after remove()', async () => {
    const map = new MockMap();
    const { actions } = createInScope(map, 'icon', pixel());
    await actions.loadPromise;
    expect(map.imageIds()).toContain('icon');

    actions.remove();
    // Creation used to be an effect that tracked the status `remove()`
    // resets, so the removal was undone on the very next flush.
    await flush();

    expect(map.imageIds()).not.toContain('icon');
    expect(actions.isImageReady.value).toBe(false);
  });
});
