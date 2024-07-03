<script lang="ts" setup>
import { computed, watchEffect } from 'vue';
import {
  GeolocateControl,
  Mapbox,
  GeoJsonSource,
  SymbolLayer,
  Image,
} from '@libs/components';
import { useFitBounds, useMapbox } from '@libs/composables';
import type { LngLatBoundsLike, MapOptions } from 'vue3-mapbox';
import circle from '@turf/circle';
import bbox from '@turf/bbox';
import 'vue3-mapbox/dist/style.css';

const options = computed<MapOptions>(() => ({
  container: 'map',
  style: 'https://worldwidemaps.sqkii.com/api/maps/purple/style.json',
  center: [103.8198, 1.3521],
  zoom: 12,
  minZoom: 9,
  maxZoom: 20,
}));

const { register: registerMap, mapInstance } = useMapbox();

const { setFitBounds } = useFitBounds(mapInstance);

watchEffect(() => {
  console.log('mapInstance.value', mapInstance.value);
});

async function goToBounds() {
  const _circle = circle([106.69390849397668, 10.789432788366994], 356 * 1.2, {
    units: 'meters',
  });
  const box = bbox(_circle);

  console.log('box', box);

  await setFitBounds(box as LngLatBoundsLike, {
    duration: 2000,
    animate: true,
  });
}

const images = computed(() => {
  return ['sqkii'].map((name) => {
    return {
      id: name,
      image: `imgs/${name}.png`,
    };
  });
});

const centerIconSources = computed(() => {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [103.8198, 1.3521],
    },
  } as any;
});
</script>
<template>
  <Mapbox :options="options" @register="registerMap">
    <button
      style="position: absolute; top: 0; left: 0; z-index: 10"
      @click="goToBounds"
    >
      fit bounds
    </button>
    <GeolocateControl
      :options="{
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
      }"
    />
    <Image :images="images" />
    <GeoJsonSource :data="centerIconSources">
      <SymbolLayer
        :style="{
          'icon-image': 'sqkii',
          'icon-size': 0.5,
        }"
      />
    </GeoJsonSource>
  </Mapbox>
</template>
