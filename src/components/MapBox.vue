<script lang="ts" setup>
import {
  onMounted,
  nextTick,
  onBeforeUnmount,
  ref,
  provide,
  shallowRef
} from 'vue';
import { Map } from 'maplibre-gl';
import { mapEvents } from '@constants';
import { MapAsset } from '@types';
import { loadAssets } from '@helpers';
import { MAP_KEY, DEFAULT_MAP_OPTIONS } from '@enums';
import type { MapOptions } from 'maplibre-gl';

interface Options {
  options: MapOptions;
  preloadAssets?: MapAsset[];
}

const emits = defineEmits(['initialized', ...mapEvents]);
const props = defineProps<Options>();
const { options, preloadAssets } = props;

let map = shallowRef<Map | null>(null);
const intialized = ref(false);

provide(MAP_KEY, map);

async function newMap() {
  return new Promise(async (resolve) => {
    map.value = new Map(Object.assign({}, DEFAULT_MAP_OPTIONS, options));

    map.value.touchZoomRotate.disableRotation();
    map.value.doubleClickZoom.disable();
    map.value.dragRotate.disable();

    if (preloadAssets?.length) await loadAssets(map.value, preloadAssets);

    map.value.on('load', () => {
      const loaded = map.value?.loaded();
      if (loaded) {
        intialized.value = true;
        emits('initialized', map.value);
        resolve(true);
      }
    });
  });
}

function listenerMapEvent() {
  mapEvents.forEach((e) => {
    map.value?.on(e, (evt) => {
      emits(e, evt);
    });
  });
}

function removeListenerMapEvent() {
  mapEvents.forEach((e) => {
    map.value?.off(e, (evt) => {
      emits(e, evt);
    });
  });
}

onMounted(async () => {
  await nextTick();
  await newMap();
  listenerMapEvent();
});

onBeforeUnmount(() => {
  removeListenerMapEvent();
  map.value?.remove();
});
</script>

<template>
  <div
    :id="options.container.toString() || 'mapContainer'"
    class="map-container"
  >
    <slot v-if="intialized" />
  </div>
</template>

<style>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
