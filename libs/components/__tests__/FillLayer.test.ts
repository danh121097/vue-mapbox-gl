import { afterEach, describe, expect, it } from 'vitest';
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  provide,
  shallowRef,
} from 'vue';
import type { App, Component } from 'vue';
import type { GeoJSONSource, Map } from 'maplibre-gl';
import { MapProvideKey, SourceProvideKey } from '@libs/enums';
import { MockMap } from '../../__tests__/mock-maplibre';

const FillLayer = (await import('../FillLayer.vue')).default as Component;

let app: App | undefined;

afterEach(() => {
  app?.unmount();
  app = undefined;
});

/**
 * Mounts `<FillLayer>` under a source that arrives after the map, the way
 * `<GeoJsonSource>` provides one: the layer is created when the source turns
 * up, not when the component mounts.
 */
async function mountLayer(
  map: MockMap,
  props: Record<string, unknown>,
): Promise<void> {
  map.addSource('fills', { type: 'geojson' });
  const source = shallowRef<GeoJSONSource | null>(null);

  app = createApp(
    defineComponent({
      setup() {
        provide(MapProvideKey, shallowRef(map as unknown as Map));
        provide(SourceProvideKey, source);
        return () => h(FillLayer, { id: 'fills-layer', ...props });
      },
    }),
  );
  app.mount(document.createElement('div'));
  await nextTick();

  source.value = { id: 'fills' } as unknown as GeoJSONSource;
  await nextTick();
}

describe('<FillLayer> zoom range', () => {
  it('puts an explicit minzoom of 0 on the layer', async () => {
    // The component used to pass `props.minzoom || 1`, and `0` is falsy, so the
    // one value the reference documented as the floor was the one value that
    // could not be set.
    const map = new MockMap();
    await mountLayer(map, { minzoom: 0, maxzoom: 12 });

    expect(map.getLayer('fills-layer')).toMatchObject({
      minzoom: 0,
      maxzoom: 12,
    });
  });

  it('falls back to the documented full range when neither is given', async () => {
    // `useCreateLayer` declares `minzoom = 0` and `maxzoom = 24`. The component
    // coalesced to `1` and `22` on the way past, so an omitted range silently
    // clipped the layer at both ends -- and the reference documented the
    // composable's numbers, which no layer ever got.
    const map = new MockMap();
    await mountLayer(map, {});

    expect(map.getLayer('fills-layer')).toMatchObject({
      minzoom: 0,
      maxzoom: 24,
    });
  });
});
