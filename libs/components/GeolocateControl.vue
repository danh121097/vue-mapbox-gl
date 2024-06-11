<script lang="ts" setup>
import { inject, ref, defineProps, defineEmits } from 'vue';
import { MapProvideKey, GeolocateEvents } from '@libs/enums';
import {
  useGeolocateControl,
  useGeolocateEventListener,
} from '@libs/composables';
import type { ControlPosition, GeolocateControlOptions } from 'maplibre-gl';
import type {
  GeolocateSuccess,
  GeolocationPositionError,
  GeolocateEventTypes,
} from '@libs/types';

interface GeolocateControlProps {
  position?: ControlPosition;
  options?: GeolocateControlOptions;
}

interface Emits {
  (e: keyof GeolocateEventTypes, ev: any): void;
  (e: 'geolocate', ev: GeolocateSuccess): void;
  (e: 'error', ev: GeolocationPositionError): void;
  (e: 'outofmaxbounds', ev: GeolocateSuccess): void;
  (e: 'trackuserlocationstart', ev: GeolocateSuccess): void;
  (e: 'trackuserlocationend', ev: GeolocateSuccess): void;
}

const props = defineProps<GeolocateControlProps>();
const emits = defineEmits<Emits>();

const mapInstance = inject(MapProvideKey, ref(null));

const { geolocateControl } = useGeolocateControl({
  map: mapInstance,
  ...props,
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
