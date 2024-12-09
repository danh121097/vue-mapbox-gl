<script lang="ts" setup>
import { inject, ref, watchEffect } from 'vue';
import { MapProvideKey, GeolocateEvents } from '@libs/enums';
import {
  useGeolocateControl,
  useGeolocateEventListener,
} from '@libs/composables';
import type {
  GeolocateSuccess,
  GeolocationPositionError,
  GeolocateEventTypes,
} from '@libs/types';
import type {
  ControlPosition,
  GeolocateControl,
  GeolocateControlOptions,
} from 'maplibre-gl';

interface GeolocateControlProps {
  position: ControlPosition;
  options: GeolocateControlOptions;
}

interface Emits {
  (e: keyof GeolocateEventTypes, ev: any): void;
  (e: 'register', ev: GeolocateControl): void;
  (e: 'geolocate', ev: GeolocateSuccess): void;
  (e: 'error', ev: GeolocationPositionError): void;
  (e: 'outofmaxbounds', ev: GeolocateSuccess): void;
  (e: 'trackuserlocationstart', ev: GeolocateSuccess): void;
  (e: 'trackuserlocationend', ev: GeolocateSuccess): void;
}

const props = defineProps<Partial<GeolocateControlProps>>();
const emits = defineEmits<Emits>();

const mapInstance = inject(MapProvideKey, ref(null));

const { geolocateControl } = useGeolocateControl({
  map: mapInstance,
  ...props,
});

watchEffect(() => {
  if (geolocateControl.value) emits('register', geolocateControl.value);
});

GeolocateEvents.map((evt) => {
  useGeolocateEventListener({
    geolocate: geolocateControl,
    event: evt,
    on: (data) => {
      emits(evt, data);
    },
  });
});
</script>
<template></template>

<style lang="scss">
.maplibregl-compact {
  display: none;
}
</style>
