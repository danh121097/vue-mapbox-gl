<script lang="ts" setup>
import { MapBox, GeoControl, Layer } from '@components';
import 'maplibre-gl/dist/maplibre-gl.css';
import boundary from './boundary.json';

const BOUNDARY_LINE_LAYER = {
  PAINT: {
    'line-color': '#7147cd',
    'line-width': 10,
    'line-opacity': 0.7
  },
  LAYOUT: {
    'line-join': 'bevel',
    'line-round-limit': 1
  }
};

function trackend(data: { coords: GeolocationCoordinates }) {
  console.log(data);
}
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
      minZoom: 9,
      apiKey: 'ztwBSN2Gdk1gdq5hBBUw',
      geolocateControl: false,
      navigationControl: false
    }"
  >
    <GeoControl @trackuserlocationend="trackend" />
    <Layer
      id="boundary_line_layer"
      source-id="boundary"
      type="line"
      :source="(boundary as any)"
      :paint="BOUNDARY_LINE_LAYER.PAINT"
      :layout="(BOUNDARY_LINE_LAYER.LAYOUT as any)"
    />
    <!-- <Marker
      :lng-lat="[103.85876175581991, 1.294674696996273]"
      class-name="hello"
    /> -->
    <!-- <template v-if="!!superMap">
      <Marker
        :lng-lat="[103.85876175581991, 1.294674696996273]"
        class-name="hello"
      />
      <Layer
        id="boundary_line_layer"
        source-id="boundary"
        type="line"
        :source="(boundary as any)"
        :paint="BOUNDARY_LINE_LAYER.PAINT"
        :layout="(BOUNDARY_LINE_LAYER.LAYOUT as any)"
      />
    </template> -->
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
