<script lang="ts" setup>
import { computed } from 'vue';
import { useMapbox } from '@libs/composables';
import GeolocateControls from '@libs/components/GeolocateControls.vue';
import Mapbox from '@libs/components/Mapbox.vue';
import 'vue3-maplibre-gl/dist/style.css';

const options = computed(() => ({
  container: 'map',
  style: 'https://worldwidemaps.sqkii.com/api/maps/purple/style.json',
  center: [103.8198, 1.3521],
  zoom: 12,
  minZoom: 9,
  maxZoom: 20,
}));

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
