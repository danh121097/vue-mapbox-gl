<script lang="ts" setup>
import {
  onMounted,
  nextTick,
  onBeforeUnmount,
  ref,
  provide,
  shallowRef
} from 'vue';
import { Map, MapboxOptions } from 'mapbox-gl';
import { MapClickEvent } from '@enums';
import { MapAsset } from '@types';
import { loadAssets } from '@helpers';

export interface MapOptions {
  mapboxOptions: Partial<MapboxOptions>;
  preloadAssets?: MapAsset[];
}

const emits = defineEmits([...MapClickEvent]);

const props = defineProps<MapOptions>();
const { mapboxOptions, preloadAssets } = props;

let map = shallowRef<Map | null>(null);
const intialized = ref(false);
const DEFAULT_MAP_OPTIONS = { container: 'mapContainer' };

provide('map', map);

async function initMap() {
  return new Promise(async (resolve) => {
    map.value = new Map(Object.assign({}, DEFAULT_MAP_OPTIONS, mapboxOptions));

    map.value.touchZoomRotate.disableRotation();
    map.value.doubleClickZoom.disable();
    map.value.dragRotate.disable();

    MapClickEvent.forEach((event) => {
      map.value?.on(event, (e) => emits(event, e));
    });

    if (preloadAssets && preloadAssets.length)
      await loadAssets(map.value, preloadAssets);

    emits('intialized', map.value);

    map.value.on('load', () => {
      intialized.value = true;
      resolve(true);
    });
  });
}

onMounted(async () => {
  emits('intializing');
  await nextTick();
  await initMap();
});

onBeforeUnmount(() => {
  map.value && map.value.remove();
});
</script>

<template>
  <div id="mapContainer" class="mapboxgl-map-container">
    <slot v-if="intialized" />
  </div>
</template>

<style>
.mapboxgl-map-container {
  height: 100%;
  width: 100%;
}
</style>
