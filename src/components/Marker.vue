<script lang="ts" setup>
import { inject, onMounted, nextTick } from 'vue';
import type { ShallowRef } from 'vue';
import { Map, Marker } from 'mapbox-gl';
import type { LngLatLike, MarkerOptions as Options } from 'mapbox-gl';

export interface MarkerOptions {
  lngLat: LngLatLike;
  markerOptions?: Options;
  className?: string;
}

const props = defineProps<MarkerOptions>();

const map = inject<ShallowRef<Map | null>>('map');

const { lngLat, markerOptions, className } = props;

function newMarker(map: Map | null | undefined) {
  if (!map) return;

  const el = document.createElement('div');
  if (className) el.className = `${className}`;

  console.log('lngLat', lngLat);

  return new Marker(el, markerOptions).setLngLat(lngLat).addTo(map);
}

onMounted(async () => {
  await nextTick();
  newMarker(map?.value);
});
</script>
