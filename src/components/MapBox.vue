<script lang="ts" setup>
import {
  onMounted,
  nextTick,
  onBeforeUnmount,
  ref,
  provide,
  shallowRef
} from 'vue';
import { Map } from '@maptiler/sdk';
import { mapEvents } from '@constants';
import { MAP_KEY, DEFAULT_MAP_OPTIONS } from '@enums';
import type { MapOptions } from '@maptiler/sdk';

interface Options {
  options: MapOptions;
}

const emits = defineEmits(['initialized', ...mapEvents]);
const props = defineProps<Options>();
const { options } = props;

let map = shallowRef<Map | null>(null);
const intialized = ref(false);

provide(MAP_KEY, map);

async function newMap() {
  return new Promise((resolve) => {
    map.value = new Map(Object.assign({}, DEFAULT_MAP_OPTIONS, options));
    map.value.touchZoomRotate.disableRotation();
    map.value.doubleClickZoom.disable();
    map.value.dragRotate.disable();

    map.value?.on('load', () => {
      const loaded = map.value?.loaded();
      const isStyleLoaded = map.value?.isStyleLoaded();

      if (loaded && isStyleLoaded) {
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
  map?.value?.remove();
});
</script>

<template>
  <div :id="options.container.toString()" class="map-container">
    <slot v-if="intialized" />
  </div>
</template>

<style>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
