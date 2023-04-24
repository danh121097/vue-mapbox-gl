<script lang="ts" setup>
import mapboxgl, {
  Map,
  MapboxOptions,
  GeolocateControl,
  PositionOptions,
  FitBoundsOptions
} from 'mapbox-gl';
import { onMounted, nextTick } from 'vue';

export interface MapOptions {
  mapboxOptions?: Partial<MapboxOptions>;
  geolocateControlOptions?: {
    positionOptions?: PositionOptions;
    fitBoundsOptions?: FitBoundsOptions;
    trackUserLocation?: boolean;
    showAccuracyCircle?: boolean;
    showUserLocation?: boolean;
    showUserHeading?: boolean;
    geolocation?: Geolocation;
  };
}

const props = defineProps<MapOptions>();
const emits = defineEmits([
  'mapLoading',
  'mapLoaded',
  'mapClick',
  'gpsOn',
  'gpsOff'
]);

let map: Map | null = null;
let geoControl: GeolocateControl | null = null;

const DEFAULT_MAP_OPTIONS = { container: 'mapContainer' };

async function initMap() {
  return new Promise((resolve) => {
    map = new mapboxgl.Map(
      Object.assign({}, DEFAULT_MAP_OPTIONS, props.mapboxOptions)
    );
    geoControl = new mapboxgl.GeolocateControl(props.geolocateControlOptions);
    map.addControl(geoControl);

    // GPS off
    geoControl.on('error', () => emits('gpsOff'));
    // GPS on
    geoControl.on('geolocate', (e) => emits('gpsOn', e));

    map.touchZoomRotate.disableRotation();
    map.doubleClickZoom.disable();
    map.dragRotate.disable();

    resolve({ map, geoControl });
  });
}

onMounted(async () => {
  emits('mapLoading');
  await nextTick();
  await initMap();
  emits('mapLoaded');
});
</script>

<template>
  <div id="mapContainer" class="mapboxgl-map-container"></div>
</template>

<style>
.mapboxgl-map-container {
  height: 100%;
  width: 100%;
  canvas {
    width: 100%;
    width: 100%;
  }
}
</style>
