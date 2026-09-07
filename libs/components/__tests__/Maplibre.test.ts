import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, defineComponent, h, nextTick, shallowReactive } from 'vue';
import type { App, Component } from 'vue';
import type { MapOptions, StyleSpecification } from 'maplibre-gl';
import type { MaplibreActions } from '@libs/types';
import type { MockMap } from '../../__tests__/mock-maplibre';

vi.mock('maplibre-gl', async (importOriginal) => {
  const { mockMaplibreModule } = await import('../../__tests__/mock-maplibre');
  return mockMaplibreModule(importOriginal as () => Promise<any>);
});

// Cast to the base `Component` type: the SFC's own prop types expand
// `MapOptions` deeply enough to blow vue-tsc's instantiation budget in `h()`.
const Maplibre = (await import('../Maplibre.vue')).default as Component;

const STYLE = 'https://example.test/style.json';

let app: App | undefined;

afterEach(() => {
  app?.unmount();
  app = undefined;
});

/**
 * Mounts `<Maplibre>` with reactive options and waits for the map to exist.
 * `@vue/test-utils` is not a dependency, so the app is driven directly.
 *
 * `shallowReactive`, so the component receives the option objects exactly as
 * written — the way a plain `:options="opts"` binding hands them over.
 */
async function mountMaplibre(
  options: Partial<MapOptions>,
  onError?: (error: unknown) => void,
) {
  const props = shallowReactive({ options });
  let actions: MaplibreActions | null = null;
  const host = document.createElement('div');

  app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(
            Maplibre,
            {
              options: props.options,
              onError,
              register: (registered: MaplibreActions) => {
                // `mapInstance` is a live ref, so it resolves once the map exists
                actions = registered;
              },
            },
            // A default-slot child, so the slot gate is observable in the DOM
            { default: () => h('span', { 'data-child': '' }) },
          );
      },
    }),
  );
  app.mount(host);

  // Container ref → map creation both settle on the microtask queue
  await nextTick();
  await nextTick();
  await nextTick();

  return {
    props,
    getMap: () => actions!.mapInstance.value as unknown as MockMap,
    getActions: () => actions!,
    hasChild: () => host.querySelector('[data-child]') !== null,
  };
}

describe('<Maplibre> option watchers', () => {
  it('creates the map once the container is mounted', async () => {
    const { getMap } = await mountMaplibre({
      style: STYLE,
      center: [0, 0],
      zoom: 1,
    });
    expect(getMap()).toBeTruthy();
  });

  it('moves the map when :options.center changes after mount', async () => {
    const { props, getMap } = await mountMaplibre({
      style: STYLE,
      center: [0, 0],
      zoom: 1,
    });
    const map = getMap();
    map.setCenter.mockClear();

    props.options = { ...props.options, center: [12, 34] };
    await nextTick();
    await nextTick();

    expect(map.setCenter).toHaveBeenCalledWith([12, 34]);
  });

  it('applies zoom changes after mount', async () => {
    const { props, getMap } = await mountMaplibre({
      style: STYLE,
      center: [0, 0],
      zoom: 1,
    });
    const map = getMap();
    map.setZoom.mockClear();

    props.options = { ...props.options, zoom: 7 };
    await nextTick();
    await nextTick();

    expect(map.setZoom).toHaveBeenCalledWith(7);
  });
});

describe('<Maplibre> setMapOptions', () => {
  it('lets later :options changes through for keys it did not override', async () => {
    const { props, getMap, getActions } = await mountMaplibre({
      style: STYLE,
      center: [0, 0],
      zoom: 1,
    });
    const map = getMap();

    getActions().setMapOptions({ zoom: 5 });
    await nextTick();
    await nextTick();
    expect(map.setZoom).toHaveBeenCalledWith(5);
    map.setCenter.mockClear();

    // The override used to snapshot every option, so a prop that changed
    // afterwards was shadowed by its stale copy.
    props.options = { ...props.options, center: [12, 34] };
    await nextTick();
    await nextTick();

    expect(map.setCenter).toHaveBeenCalledWith([12, 34]);
  });

  it('does not re-issue setStyle for an object style it did not change', async () => {
    const style: StyleSpecification = {
      version: 8,
      sources: {},
      layers: [],
    };
    const { getMap, getActions } = await mountMaplibre({
      style,
      center: [0, 0],
      zoom: 1,
    });
    const map = getMap();
    map.setStyle.mockClear();

    // Re-issuing setStyle here would drop every layer added at runtime.
    getActions().setMapOptions({ zoom: 5 });
    await nextTick();
    await nextTick();

    expect(map.setStyle).not.toHaveBeenCalled();
  });
});

describe('<Maplibre> error state', () => {
  it('keeps the default slot mounted through a runtime map error', async () => {
    const onError = vi.fn();
    const { getMap, hasChild } = await mountMaplibre(
      { style: STYLE, center: [0, 0], zoom: 1 },
      onError,
    );
    const map = getMap();

    map.fire('load');
    await nextTick();
    expect(hasChild()).toBe(true);

    // A failed tile after load. Unmounting the slot here would tear every
    // layer, marker and popup off a map that is still working.
    const tileError = { error: new Error('404 tile') };
    map.fire('error', tileError);
    await nextTick();
    await nextTick();

    expect(onError).toHaveBeenCalledWith(tileError);
    expect(hasChild()).toBe(true);
  });
});
