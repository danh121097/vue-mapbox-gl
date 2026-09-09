<script lang="ts" setup>
import { computed } from 'vue';
import {
  GeolocateControls,
  Maplibre,
  useMaplibre,
  type MapOptions,
} from 'vue3-maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// A consumer also imports the package stylesheet, 'vue3-maplibre-gl/dist/style.css'.
// This demo resolves the package to libs/ (see vite.config.ts), where that
// stylesheet is the <style> block of Maplibre.vue and the component applies it.

const options = computed<MapOptions>(() => ({
  container: 'map',
  // OpenFreeMap: a free, keyless, public style, so this demo runs with no
  // account and no API key.
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [103.8198, 1.3521],
  zoom: 12,
  minZoom: 9,
  maxZoom: 20,
}));

const { register: registerMap } = useMaplibre();
</script>
<template>
  <Maplibre :options="options" debug @register="registerMap">
    <GeolocateControls
      :options="{
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
      }"
    />
  </Maplibre>
</template>
