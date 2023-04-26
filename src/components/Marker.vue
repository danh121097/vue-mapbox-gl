<script lang="ts" setup>
import { inject, onMounted, nextTick, onBeforeUnmount } from 'vue';
import type { ShallowRef } from 'vue';
import { Map, Marker } from 'mapbox-gl';
import type { LngLatLike, MarkerOptions as Options } from 'mapbox-gl';

export interface MarkerOptions {
  lngLat: LngLatLike;
  markerOptions?: Options;
  className?: string;
}

const emits = defineEmits(['click']);
const props = defineProps<MarkerOptions>();

const map = inject<ShallowRef<Map | null>>('map');
let marker: Marker;

const { lngLat, markerOptions, className } = props;

function newMarker(map: Map | null | undefined) {
  if (!map) return;

  const el = document.createElement('div');
  if (className) el.className = `${className}`;

  marker = new Marker(el, markerOptions).setLngLat(lngLat).addTo(map);
  marker.getElement().addEventListener('click', onClick);
  return marker;
}

function onClick(e: unknown) {
  emits('click', e);
}

onMounted(async () => {
  await nextTick();
  newMarker(map?.value);
});

onBeforeUnmount(() => {
  marker.getElement().removeEventListener('click', onClick);
  marker.remove();
});
</script>
