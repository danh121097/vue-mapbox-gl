<script lang="ts" setup>
import { inject, onMounted, nextTick, onBeforeUnmount, ref } from 'vue';
import { Map, Marker } from '@maptiler/sdk';
import { MAP_KEY } from '@enums';
import { markerDOMEvents, markerMapEvents } from '@constants';
import type { MarkerDOMEvents, MarkerMapEvents } from '@constants';
import type { LngLatLike, MarkerOptions } from '@maptiler/sdk';
import type { ShallowRef, Ref } from 'vue';

interface Options {
  lngLat: LngLatLike | [number, number];
  options?: MarkerOptions;
  className?: string;
  cursor?: string;
}

const emits = defineEmits([
  'added',
  'update:coordinates',
  'removed',
  ...markerMapEvents,
  ...markerDOMEvents
]);
const props = defineProps<Options>();
const { lngLat, options, className, cursor } = props;

const map = inject<ShallowRef<Map | null>>(MAP_KEY);
const marker = ref({}) as Ref<Marker>;

function newMarker(map: Map | null | undefined) {
  if (!map) return;

  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = className || '';
    el.style.cursor = cursor || 'default';
    marker.value = new Marker({
      element: el,
      ...options
    })
      .setLngLat(lngLat)
      .addTo(map);
    resolve(marker.value);
  });
}

function listenMarkerEvents(): void {
  let coordinates: LngLatLike;
  // Listen to Marker Mapbox events
  markerMapEvents.forEach((event: MarkerMapEvents) => {
    marker.value.on(event, (e: { target: Marker }) => {
      if (event === 'dragend') {
        if (lngLat instanceof Array)
          coordinates = [e.target._lngLat.lng, e.target._lngLat.lat];
        else coordinates = e.target._lngLat;

        emits('update:coordinates', coordinates);
      }
      emits(event, e);
    });
  });
  // Listen to Marker DOM events
  markerDOMEvents.forEach((event: MarkerDOMEvents) => {
    marker.value.getElement().addEventListener(event, (e) => {
      emits(event, e);
    });
  });
}

function removeMarkerFromMap(marker: Marker): void {
  marker.remove();
  emits('removed');
}

onMounted(async () => {
  await nextTick();
  await newMarker(map?.value);
  listenMarkerEvents();
});

onBeforeUnmount(() => {
  removeMarkerFromMap(marker.value);
});
</script>
<template>
  <section id="marker">
    <slot />
  </section>
</template>
