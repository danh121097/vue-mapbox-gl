import { describe, it, expect } from 'vitest';
import { computed, nextTick, shallowRef } from 'vue';
import type { CircleLayerSpecification, Map } from 'maplibre-gl';
import { withSetup } from '../test-utils';
import { MockMap } from './mock-maplibre';
import { useCreateGeoJsonSource } from '../composables/sources/useCreateGeoJsonSource';
import { useCreateLayer } from '../composables/layers/useCreateLayer';

/**
 * `MockMap` plus the two behaviours a style swap depends on, which the plain
 * mock does not model: sources announce themselves through `sourcedata`, and
 * `removeSource` refuses while a layer still references the source.
 */
class StyleSwapMap extends MockMap {
  addSource(id: string, spec: unknown): void {
    super.addSource(id, spec);
    setTimeout(
      () => this.fire('sourcedata', { type: 'sourcedata', sourceId: id }),
      0,
    );
  }

  removeSource(id: string): void {
    const inUse = this.layerIds().some(
      (layerId) =>
        (this.getLayer(layerId) as { source?: string })?.source === id,
    );
    if (inUse) {
      throw new Error(
        `Source "${id}" cannot be removed while layer is using it.`,
      );
    }
    super.removeSource(id);
  }

  /**
   * `map.setStyle(next)` on its default `diff: true` path: MapLibre diffs the
   * serialized current style -- which includes everything this library added
   * at runtime -- against the new one, removes what the new style does not
   * declare, and fires only `style.load`.
   */
  swapStyleByDiff(): void {
    this.sourceIds().forEach((id) => super.removeSource(id));
    this.layerIds().forEach((id) => this.removeLayer(id));
    this.fire('style.load', { type: 'style.load', target: this });
  }

  /** `setStyle(next, { diff: false })`: the style is thrown away and reloaded. */
  swapStyleByReload(): void {
    this.sourceIds().forEach((id) => super.removeSource(id));
    this.layerIds().forEach((id) => this.removeLayer(id));
    this.setStyleLoaded(false);
    this.fire('styledataloading', { type: 'styledataloading', target: this });
    setTimeout(() => {
      this.setStyleLoaded(true);
      this.fire('styledata', { type: 'styledata', target: this });
      this.fire('style.load', { type: 'style.load', target: this });
    }, 0);
  }
}

/** Lets the deferred source creation, the rebuild timer and Vue's queue run. */
async function settle(): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();
  }
}

/** Mounts a GeoJSON source with a circle layer drawn from it. */
function mountSourceAndLayer(map: StyleSwapMap): void {
  const mapRef = shallowRef(map as unknown as Map);

  withSetup(() => {
    const source = useCreateGeoJsonSource({
      map: mapRef,
      id: 'points',
      data: { type: 'FeatureCollection', features: [] },
    });

    return useCreateLayer<CircleLayerSpecification>({
      map: mapRef,
      id: 'circles',
      source: computed(() => source.getSource.value),
      type: 'circle',
    });
  });
}

describe('changing the map style', () => {
  it('puts the source and layer back after an in-place style diff', async () => {
    const map = new StyleSwapMap();
    map.fire('load', { type: 'load', target: map });

    mountSourceAndLayer(map);
    await settle();

    expect(map.sourceIds()).toContain('points');
    expect(map.layerIds()).toContain('circles');

    // The default `setStyle` path removes both without reloading the style.
    // Nothing here used to notice, so the circles were gone until the next
    // full reload.
    map.swapStyleByDiff();
    await settle();

    expect(map.sourceIds()).toContain('points');
    expect(map.layerIds()).toContain('circles');
  });

  it('puts the source and layer back after a full style reload', async () => {
    const map = new StyleSwapMap();
    map.fire('load', { type: 'load', target: map });

    mountSourceAndLayer(map);
    await settle();

    map.swapStyleByReload();
    await settle();

    expect(map.sourceIds()).toContain('points');
    expect(map.layerIds()).toContain('circles');
    // The reload's trailing `style.load` must not start a second rebuild.
    expect(map.layerIds()).toHaveLength(1);
  });
});
