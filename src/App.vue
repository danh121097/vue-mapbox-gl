<script lang="ts" setup>
import { MapBox } from 'vue3-mapbox';
import 'vue3-mapbox/dist/style.css';
</script>

<template>
  <MapBox
    class="map"
    :options="{
      style: 'https://worldwidemaps.sqkii.com/api/maps/Streets/style.json',
      container: 'mapContainer',
      center: [0, 0]
    }"
  >
  </MapBox>
</template>
<style>
* {
  margin: 0;
  padding: 0;
  font-family: inherit;
  box-sizing: inherit;
}
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.map {
  height: 500px;
  width: 500px;
}
</style>
