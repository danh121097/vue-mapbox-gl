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

const LAYERS: Array<[string, Component]> = [
  ['CircleLayer', (await import('../CircleLayer.vue')).default as Component],
  ['FillLayer', (await import('../FillLayer.vue')).default as Component],
  ['LineLayer', (await import('../LineLayer.vue')).default as Component],
  ['SymbolLayer', (await import('../SymbolLayer.vue')).default as Component],
];

let app: App | undefined;

afterEach(() => {
  app?.unmount();
  app = undefined;
});

async function mountLayer(
  component: Component,
  map: MockMap,
  props: Record<string, unknown>,
): Promise<void> {
  map.addSource('features', { type: 'geojson' });
  const source = shallowRef<GeoJSONSource | null>(null);

  app = createApp(
    defineComponent({
      setup() {
        provide(MapProvideKey, shallowRef(map as unknown as Map));
        provide(SourceProvideKey, source);
        return () => h(component, { id: 'the-layer', ...props });
      },
    }),
  );
  app.mount(document.createElement('div'));
  await nextTick();

  source.value = { id: 'features' } as unknown as GeoJSONSource;
  await nextTick();
}

describe('layer filter default', () => {
  for (const [name, component] of LAYERS) {
    it(`<${name}> matches every feature when no filter is given`, async () => {
      // `FilterSpecification` includes `boolean`, so Vue's Boolean prop casting
      // used to hand an omitted `filter` down as `false`. That is a valid filter
      // that matches nothing: the layer was added to the map and rendered zero
      // features, with no error anywhere -- an invisible layer on a live source.
      const map = new MockMap();
      await mountLayer(component, map, {});

      expect(map.getLayer('the-layer')).toMatchObject({ filter: ['all'] });
    });

    it(`<${name}> still honours an explicit filter`, async () => {
      const map = new MockMap();
      await mountLayer(component, map, { filter: ['==', 'kind', 'coin'] });

      expect(map.getLayer('the-layer')).toMatchObject({
        filter: ['==', 'kind', 'coin'],
      });
    });
  }
});
