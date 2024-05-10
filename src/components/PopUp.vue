<script lang="ts" setup>
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import transformTranslate from '@turf/transform-translate';

import { inject, onMounted, nextTick } from 'vue';
import { Map, Popup, Marker } from 'maplibre-gl';
import { MAP_KEY } from '@enums';
import { popupEvents } from '@constants';
import type { PopupEvents } from '@constants';
import type { ShallowRef } from 'vue';
import type { LngLatLike, PopupOptions } from 'maplibre-gl';

interface Options {
  lngLat: LngLatLike | [number, number];
  content?: string;
  offset?: number;
  options?: PopupOptions;
  className?: string;
  marker?: Marker;
}

const emits = defineEmits(['added', 'removed', ...popupEvents]);
const props = defineProps<Options>();
const { lngLat, options, className, marker, content } = props;

const map = inject<ShallowRef<Map | null>>(MAP_KEY);
let popup: Popup;

async function setPopUp() {
  return new Promise((resolve) => {
    popup = new Popup(Object.assign({}, options, { className })).setLngLat(
      lngLat
    );
    resolve(popup);
  });
}

function addPopUp() {
  if (marker) marker.setPopup(popup);
  else {
    if (content) popup.setHTML(content);
    if (className) popup.addClassName(className);
    popup?.addTo(map?.value as Map);
  }
  emits('added', popup);
}

function listenPopupEvents() {
  popupEvents.forEach((event: PopupEvents) => {
    popup?.on(event, () => emits(event));
  });
}

onMounted(async () => {
  await nextTick();
  await setPopUp();
  addPopUp();
  listenPopupEvents();
});
</script>
<template>
  <section id="popupContent">
    <slot />
  </section>
</template>
