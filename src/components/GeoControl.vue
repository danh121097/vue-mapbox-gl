<script lang="ts" setup>
import { inject, nextTick, onMounted } from 'vue';
import { GeolocateControl, Map } from 'maplibre-gl';
import { MAP_KEY, DEFAULT_GEO_CONTROL_OPTIONS } from '@enums';
import { geolocateControlEvents } from '@constants';
import type { GeolocateOptions } from 'maplibre-gl';
import type { ShallowRef } from 'vue';
import type { GeoControlEvents } from '@constants';

interface Options {
  options?: GeolocateOptions;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface GeoEvent {
  coords: GeolocationCoordinates;
  target: GeolocateControl;
  timestamp: number;
  type: 'geolocate';
}

const emits = defineEmits(['geocontrol', ...geolocateControlEvents]);
const props = defineProps<Options>();
const { options, position } = props;

const map = inject<ShallowRef<Map | null>>(MAP_KEY);

let geoControl: GeolocateControl | null = null;

function addControl(map: Map | null | undefined) {
  if (!map) return;

  geoControl = new GeolocateControl(
    Object.assign({}, DEFAULT_GEO_CONTROL_OPTIONS, options)
  );
  map.addControl(geoControl, position);
  emits('geocontrol', geoControl);
  geolocateControlEvents.forEach((event: GeoControlEvents) => {
    geoControl?.on(event, (geoEvent: GeoEvent) => {
      emits(event, geoEvent);
    });
  });
}

function trigger() {
  geoControl?.trigger();
}

defineExpose({
  trigger
});

onMounted(async () => {
  await nextTick();
  addControl(map?.value);
});
</script>
<template>
  <section id="geoControl">
    <slot />
  </section>
</template>
