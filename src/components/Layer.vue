<script lang="ts" setup>
import { onMounted, nextTick, inject, toRefs, watch } from 'vue';
import { GeoJSONSource, Map } from 'maplibre-gl';
import { mapLayerEvents } from '@constants';
import { MAP_KEY } from '@enums';
import type { Vue3MapBox } from '@types';
import type { SourceSpecification, LayerSpecification } from 'maplibre-gl';
import type { ShallowRef } from 'vue';

interface LayerOptions {
  sourceId: string;
  id: string;
  source: SourceSpecification;
  paint?: Vue3MapBox.PaintSpecification;
  layout?: Vue3MapBox.LayoutSpecification;
  type: Vue3MapBox.LayerType;
  before?: string;
  minzoom?: number;
  maxzoom?: number;
}

const emits = defineEmits(mapLayerEvents);
const props = defineProps<LayerOptions>();
const { sourceId, id, source, before, paint, layout } = toRefs(props);

const map = inject<ShallowRef<Map>>(MAP_KEY);
const LAYER = {
  paint: props.paint || {},
  layout: props.layout || {},
  type: props.type,
  id: id.value,
  source: sourceId.value,
  minzoom: props.minzoom,
  maxzoom: props.maxzoom
};

watch(source, (value) => {
  const source = map?.value?.getSource(sourceId.value) as GeoJSONSource;
  if (source) source.setData((value as any).data);
});

watch(
  () => paint?.value,
  (value) => {
    if (!value) return;
    const layer = map?.value?.getLayer(props.id);
    if (!layer) return;
    Object.entries(value).forEach(([key, value]) => {
      map?.value?.setPaintProperty(props.id, key, value);
    });
  },
  {
    deep: true
  }
);

watch(
  () => layout?.value,
  (value) => {
    if (!value) return;
    const layer = map?.value?.getLayer(props.id);
    if (!layer) return;
    Object.entries(value).forEach(([key, value]) => {
      map?.value?.setLayoutProperty(props.id, key, value);
    });
  },
  {
    deep: true
  }
);

function addLayer(map?: Map) {
  if (!map) return;

  return new Promise((resolve) => {
    if (!map.getSource(sourceId.value))
      map.addSource(sourceId.value, source.value);
    map.addLayer(LAYER as unknown as LayerSpecification, before?.value);
    resolve(true);
  });
}

function listenerLayerEvent() {
  mapLayerEvents.forEach((event) => {
    map?.value.on(event, id.value, (e) => emits(event, e));
  });
}

onMounted(async () => {
  await nextTick();
  await addLayer(map?.value);
  listenerLayerEvent();
});
</script>
<template>
  <section id="layer">
    <slot />
  </section>
</template>
