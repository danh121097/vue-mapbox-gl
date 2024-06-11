<script lang="ts" setup>
import { computed, watchEffect } from 'vue';
import {
  FillLayer,
  GeoJsonSource,
  GeolocateControl,
  Mapbox,
} from '@libs/components';
import { useMapbox } from '@libs/composables';
import type { GeolocateSuccess } from '@libs/types';
import type { MapOptions, SourceSpecification } from 'maplibre-gl';
import circle from '@turf/circle';
import 'maplibre-gl/dist/maplibre-gl.css';

const options = computed<MapOptions>(() => ({
  container: 'map',
  style: 'https://worldwidemaps.sqkii.com/api/maps/purple/style.json',
  center: [103.8198, 1.3521],
  minZoom: 9,
  maxZoom: 20,
}));

const data = computed(() => {
  const s = circle([106.6521209, 10.8013524], 200, {
    properties: {
      id: 'circle',
      price: 10000,
    },
    units: 'meters',
  });
  return makeSource([s]);
});

function onTrackUserLocationStart(ev: GeolocateSuccess) {
  console.log('onTrackUserLocationStart', ev);
}

function onTrackUserLocationEnd(ev: GeolocateSuccess) {
  console.log('onTrackUserLocationEnd', ev);
}

function onGeolocate(ev: GeolocateSuccess) {
  console.log('onGeolocate', ev.target._watchState);
}

function makeSource(features: any[]): SourceSpecification {
  return {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features,
    },
  };
}

const { register, mapInstance } = useMapbox();

watchEffect(() => {
  console.log('mapInstance.value', mapInstance.value);
});
</script>
<template>
  <Mapbox :options="options" :register="register">
    <GeolocateControl
      :options="{
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
      }"
      @trackuserlocationstart="onTrackUserLocationStart"
      @trackuserlocationend="onTrackUserLocationEnd"
      @geolocate="onGeolocate"
    />
    <GeoJsonSource :data="data">
      <FillLayer
        :style="{
          'fill-color': '#ffffff',
          'fill-opacity': 0.5,
        }"
      />
    </GeoJsonSource>
  </Mapbox>
</template>
