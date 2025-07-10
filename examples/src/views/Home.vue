<script lang="ts" setup>
import { computed } from 'vue';
import { GeolocateControls, Mapbox } from '@libs/components';
import { useMapbox } from '@libs/composables';
import { type MapOptions } from 'vue3-mapbox';
import 'vue3-mapbox/dist/style.css';

const options = computed<MapOptions>(() => ({
  container: 'map',
  style: 'https://worldwidemaps.sqkii.com/api/maps/purple/style.json',
  center: [103.8198, 1.3521],
  zoom: 12,
  minZoom: 9,
  maxZoom: 20,
}));

// Enhanced useMapbox with better error handling and validation
const { register: registerMap } = useMapbox();
</script>
<template>
  <Mapbox :options="options" debug @register="registerMap">
    <GeolocateControls
      :options="{
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
      }"
    />
  </Mapbox>
</template>
