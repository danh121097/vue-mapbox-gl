<script lang="ts" setup>
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import transformTranslate from '@turf/transform-translate';

import { inject, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { Map, Popup, Marker } from 'maplibre-gl';
import { point } from '@turf/helpers';
import { MAP_KEY, Units } from '@enums';
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
  units?: Units;
}

const emits = defineEmits(['added', 'removed', ...popupEvents]);
const props = defineProps<Options>();
const { lngLat, offset, options, className, marker, units, content } = props;

const map = inject<ShallowRef<Map | null>>(MAP_KEY);
let popup: Popup;

function newGeoTransformTranslate(lngLat: LngLatLike) {
  return new Promise((resolve) => {
    const geo = transformTranslate(point(lngLat as number[]), offset || 0, 0, {
      units: units || 'meters'
    });

    const [lng, lat] = geo.geometry.coordinates;

    resolve([lng, lat]);
  });
}

async function setPopUp() {
  const _lngLat = (await newGeoTransformTranslate(lngLat)) as [number, number];

  return new Promise((resolve) => {
    popup = new Popup(Object.assign({}, options, { className })).setLngLat(
      offset ? _lngLat : lngLat
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

function removePopupEvents() {
  popupEvents.forEach((event: PopupEvents) => {
    popup?.off(event, () => emits(event));
  });
}

function removePopUp() {
  emits('removed');
}

onMounted(async () => {
  await nextTick();
  await setPopUp();
  addPopUp();
  listenPopupEvents();
});

onBeforeUnmount(() => {
  removePopupEvents();
  removePopUp();
});
</script>
<template>
  <section id="popupContent">
    <slot />
  </section>
</template>
