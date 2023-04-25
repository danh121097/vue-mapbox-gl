<script lang="ts" setup>
import {
  onMounted,
  nextTick,
  onBeforeUnmount,
  ref,
  useAttrs,
  provide,
  shallowRef
} from 'vue';
import { Map, MapboxOptions } from 'mapbox-gl';
import { MapClickEvent } from '@enums';

export interface MapOptions {
  mapboxOptions?: Partial<MapboxOptions>;
  preload?: (assets: unknown) => void;
}

const emits = defineEmits([
  'onMapClick',
  'onMapDblclick',
  'onMapMousedown',
  'onMapMouseup',
  'onMapMousemove',
  'onMapMouseenter',
  'onMapMouseleave',
  'onMapMouseover',
  'onMapMouseout',
  'onMapTouchstart',
  'onMapTouchend',
  'onMapTouchcancel',
  'onMapIntialized',
  'onMapIntializing'
]);

const props = defineProps<MapOptions>();
const { mapboxOptions } = props;

let map = shallowRef<Map | null>(null);
const attrs = useAttrs();
const intialized = ref(false);
const DEFAULT_MAP_OPTIONS = { container: 'mapContainer' };

provide('map', map);

async function initMap() {
  return new Promise((resolve) => {
    map.value = new Map(Object.assign({}, DEFAULT_MAP_OPTIONS, mapboxOptions));

    map.value.touchZoomRotate.disableRotation();
    map.value.doubleClickZoom.disable();
    map.value.dragRotate.disable();

    MapClickEvent.forEach((e) => {
      if (!!attrs[`onMap${e}`])
        map.value?.on(e.toLowerCase(), attrs[`onMap${e}`] as any);
    });

    emits('onMapIntialized', map.value);

    map.value.on('load', () => {
      intialized.value = true;
      resolve(true);
    });
  });
}

onMounted(async () => {
  emits('onMapIntializing');
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

  canvas {
    width: 100%;
    width: 100%;
  }
}
</style>
