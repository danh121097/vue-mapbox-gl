<script lang="ts" setup>
import { computed, watchEffect } from 'vue';
import {
  FillLayer,
  GeoJsonSource,
  GeolocateControl,
  Mapbox,
  CircleLayer,
  LineLayer,
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
  zoom: 12,
  minZoom: 9,
  maxZoom: 20,
}));

const fillData = computed(() => {
  const s = circle([103.8097, 1.3535], 400, {
    units: 'meters',
  });
  return makeSource([s]);
});

const circleData = computed(() => {
  const s = circle([103.8097, 1.3535], 700, {
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

const { register: registerMap, mapInstance } = useMapbox();

watchEffect(() => {
  console.log('mapInstance.value', mapInstance.value);
});
</script>
<template>
  <Mapbox :options="options" @register="registerMap">
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
    <GeoJsonSource :data="fillData">
      <FillLayer
        :style="{
          'fill-color': '#ffffff',
          'fill-opacity': 0.5,
        }"
      />
      <LineLayer
        :style="{
          'line-color': '#ff0000',
          'line-width': 5,
        }"
      />
    </GeoJsonSource>
    <GeoJsonSource :data="circleData">
      <CircleLayer
        :style="{
          'circle-color': '#ff0000',
          'circle-radius': 5,
          'circle-opacity': 0.5,
        }"
      />
    </GeoJsonSource>
  </Mapbox>
</template>
