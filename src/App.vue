<script lang="ts" setup>
import { MapBox } from '@components';
import '../dist/style.css';
</script>

<template>
  <div class="container">
    <MapBox
      class="map"
      :options="{
        style: '',
        container: 'mapContainer'
      }"
    >
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
