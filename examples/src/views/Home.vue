<script lang="ts" setup>
import type { MapOptions } from 'maplibre-gl'
import { computed } from 'vue'
import { Mapbox } from 'vue3-mapbox'
import 'maplibre-gl/dist/maplibre-gl.css'

const options = computed<MapOptions>(() => ({
  container: 'map',
  style: 'https://worldwidemaps.sqkii.com/api/maps/purple/style.json',
  center: [103.8198, 1.3521],
  minZoom: 9,
  maxZoom: 20
}))
</script>
<template>
  <Mapbox :options="options" />
</template>
