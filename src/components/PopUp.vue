<script lang="ts" setup>
import { inject, onMounted, nextTick, onBeforeUnmount } from 'vue';
import type { ShallowRef } from 'vue';
import { Map, Popup } from 'mapbox-gl';
import type { LngLatLike, PopupOptions as Options } from 'mapbox-gl';
import { point } from '@turf/helpers';
// @ts-ignore
import transformTranslate from '@turf/transform-translate';

export interface PopUpOptions {
  lngLat: LngLatLike;
  radius?: number;
  options?: Options;
  content: string;
  className?: string;
}

const emits = defineEmits(['click']);

const props = defineProps<PopUpOptions>();
const { lngLat, radius, options, content, className } = props;

const map = inject<ShallowRef<Map | null>>('map');
let popup: Popup;

function newPopUp(map: Map | null | undefined) {
  if (!map) return;

  const geo = transformTranslate(
    point(lngLat as number[]),
    radius ? radius + 10 : 0,
    0,
    {
      units: 'meters'
    }
  );

  const [lng, lat] = geo.geometry.coordinates;

  popup = new Popup(Object.assign({}, options, { className }))
    .setLngLat(radius ? [lng, lat] : lngLat)
    .setHTML(content)
    .addTo(map);

  popup.getElement().addEventListener('click', onClick);

  return popup;
}

function onClick(e: unknown) {
  emits('click', e);
}

onMounted(async () => {
  await nextTick();
  newPopUp(map?.value);
});

onBeforeUnmount(() => {
  popup.getElement().removeEventListener('click', onClick);
  popup.remove();
});
</script>
