<script lang="ts" setup>
import { inject, nextTick, onMounted, ref } from 'vue';
import { MaptilerGeolocateControl, Map } from '@maptiler/sdk';
import { MAP_KEY, DEFAULT_GEO_CONTROL_OPTIONS } from '@enums';
import { geolocateControlEvents } from '@constants';
import type { GeolocateOptions } from '@maptiler/sdk';
import type { ShallowRef } from 'vue';
import type { GeoControlEvents } from '@constants';

interface Options {
  options?: GeolocateOptions;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const emits = defineEmits(['geocontrol', ...geolocateControlEvents]);
const props = defineProps<Options>();
const { options, position } = props;

const map = inject<ShallowRef<Map | null>>(MAP_KEY);
let geoControl: MaptilerGeolocateControl;

function addControl(map: Map | null | undefined) {
  if (!map) return;

  geoControl = new MaptilerGeolocateControl(
    Object.assign({}, DEFAULT_GEO_CONTROL_OPTIONS, options)
  );

  map.addControl(geoControl, position);
  emits('geocontrol', geoControl);

  geolocateControlEvents.forEach((evt: GeoControlEvents) => {
    console.log('event', evt);
    geoControl.on(
      evt,
      (data: {
        coords: GeolocationCoordinates;
        target: MaptilerGeolocateControl;
        timestamp: number;
        type: string;
      }) => {
        emits(evt, data);
      }
    );
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
