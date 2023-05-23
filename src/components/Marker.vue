<script lang="ts" setup>
import { inject, onMounted, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { Map, Marker } from 'maplibre-gl';
import { MAP_KEY } from '@enums';
import { markerDOMEvents, markerMapEvents } from '@constants';
import type { MarkerDOMEvents, MarkerMapEvents } from '@constants';

import type { LngLatLike, MarkerOptions } from 'maplibre-gl';
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
const isMarkerAvailable = ref(false);
const marker = ref({}) as Ref<Marker>;

watch(marker, (_marker) => {
  if ('_map' in _marker) isMarkerAvailable.value = true;
  else isMarkerAvailable.value = false;
});

function newMarker(map: Map | null | undefined) {
  if (!map) return;

  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = className || '';
    el.style.cursor = cursor || 'default';
    new Marker(el, options).setLngLat(lngLat).addTo(map);
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
  <section>
    <slot name="markers" />
  </section>
</template>
