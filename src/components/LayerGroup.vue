<script lang="ts" setup>
import { inject, nextTick, onBeforeUnmount, onMounted } from 'vue';
import { Layer } from '@components';
import { mapLayerEvents } from '@constants';
import { MAP_KEY } from '@enums';
import { Map } from 'maplibre-gl';
import type { Vue3MapBox } from '@types';
import type { SourceSpecification } from 'maplibre-gl';
import type { ShallowRef } from 'vue';

interface LayerOptions {
  sourceId: string;
  id: string;
  source: SourceSpecification;
  paint?: Vue3MapBox.PaintSpecification;
  layout?: Vue3MapBox.LayoutSpecification;
  type: Vue3MapBox.LayerType;
  before?: string;
}

interface Props {
  layers: Omit<LayerOptions, 'source' | 'sourceId'>[];
  source: SourceSpecification;
  sourceId: string;
}

defineProps<Props>();
const emits = defineEmits(mapLayerEvents);

const map = inject<ShallowRef<Map>>(MAP_KEY);

function listenerLayerEvent() {
  mapLayerEvents.forEach((event) => {
    map?.value.on(event, (e) => emits(event, e));
  });
}

function removeLayerEvent() {
  if (map?.value)
    mapLayerEvents.forEach((event) => {
      map?.value.off(event, (e) => emits(event, e));
    });
}

onMounted(async () => {
  await nextTick();
  listenerLayerEvent();
});

onBeforeUnmount(() => {
  removeLayerEvent();
});
</script>

<template>
  <Layer
    v-for="layer in layers"
    :key="layer.id"
    v-bind="{ ...layer, source, sourceId }"
  />
</template>
