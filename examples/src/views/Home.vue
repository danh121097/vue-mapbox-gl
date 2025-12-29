<script lang="ts" setup>
import { computed } from 'vue';
import {
  GeolocateControls,
  Maplibre,
  useMaplibre,
  type MapOptions,
} from 'vue3-maplibre-gl';
import 'vue3-maplibre-gl/dist/style.css';

const options = computed<MapOptions>(() => ({
  container: 'map',
  style: 'https://worldwidemaps.sqkii.com/api/maps/test/style.json',
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
