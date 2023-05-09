<script lang="ts" setup>
import { MapBox, LayerGroup } from '@components';
import '../dist/style.css';
</script>

<template>
  <div class="container">
    <MapBox
      class="map"
      :options="{
        style:
          'https://api.maptiler.com/maps/396cecfe-3c92-4124-8071-3d2aff387ac9/style.json?key=ztwBSN2Gdk1gdq5hBBUw',
        container: 'mapContainer',
        center: [0, 0]
      }"
    >
      <LayerGroup source-id="" source="" layers=""></LayerGroup>
    </MapBox>
  </div>
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
