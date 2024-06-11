<script lang="ts" setup>
import { computed } from 'vue';
import { Mapbox, GeolocateControl } from '@libs/components';
import maplibre from 'maplibre-gl';
import type { MapOptions } from 'maplibre-gl';
import type { GeolocateSuccess } from '@libs/types';
import 'maplibre-gl/dist/maplibre-gl.css';

const options = computed<MapOptions>(() => ({
  container: 'map',
  style: 'https://worldwidemaps.sqkii.com/api/maps/purple/style.json',
  center: [103.8198, 1.3521],
  minZoom: 9,
  maxZoom: 20,
}));

function onTrackUserLocationStart(ev: GeolocateSuccess) {
  console.log('onTrackUserLocationStart', ev);
}

function onTrackUserLocationEnd(ev: GeolocateSuccess) {
  console.log('onTrackUserLocationEnd', ev);
}

function onGeolocate(ev: GeolocateSuccess) {
  console.log('maplibre.', parseInt(maplibre.getVersion().split('.')[0], 10));

  console.log('onGeolocate', ev.target._watchState);
}
</script>
<template>
  <Mapbox :options="options">
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
  </Mapbox>
</template>
