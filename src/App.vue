<script lang="ts" setup>
import { MapBox, Marker } from '@components';
import 'vue3-mapbox/dist/style.css';
</script>

<template>
  <MapBox
    class="map"
    :options="{
      style: 'https://worldwidemaps.sqkii.com/api/maps/purple/style.json',
      container: 'mapContainer',
      center: [103.85876175581991, 1.294674696996273],
      zoom: 9,
      maxZoom: 19,
      minZoom: 9
    }"
  >
    <Marker
      :lng-lat="[103.85876175581991, 1.294674696996273]"
      class-name="hello"
    />
  </MapBox>
</template>
<style>
* {
  margin: 0;
  padding: 0;
  font-family: inherit;
  box-sizing: inherit;
}
.hello {
  background-image: url(/icon.png);
  background-size: cover;
  width: 30px;
  height: 34px;
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
