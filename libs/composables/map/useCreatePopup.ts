import { computed, onUnmounted, shallowRef, unref, watchEffect } from 'vue';
import { Popup } from 'maplibre-gl';
import { lngLatLikeHasValue } from '@libs/helpers';
import type { Nullable } from '@libs/types';
import type { Ref, ShallowRef } from 'vue';
import type { LngLatLike, Map, PopupOptions } from 'maplibre-gl';

interface CreatePopupProps {
  map: ShallowRef<Nullable<Map>>;
  options?: PopupOptions;
  el?: Ref<HTMLElement | undefined>;
  lnglat?: LngLatLike;
  show?: boolean;
  withMap?: boolean;
  html?: string;
  on?: {
    open?: (popup: Popup) => void;
    close?: (popup: Popup) => void;
  };
}

export function useCreatePopup({
  map: mapRef,
  lnglat: lnglatVal,
  html,
  el,
  show: showVal = true,
  withMap: withMapVal = true,
  options = {},
  on = {},
}: CreatePopupProps) {
  const popup = shallowRef<Nullable<Popup>>(null);
  const popupInstance = computed(() => popup.value);

  const stopEffect = watchEffect((onCleanUp) => {
    const map = unref(mapRef);

    if (map && el?.value && !popup.value) {
      popup.value = new Popup({
        ...options,
      });

      popup.value.setDOMContent(el.value);
      if (lnglatVal && lngLatLikeHasValue(lnglatVal)) setLngLat(lnglatVal);
      if (showVal) show();
      if (withMapVal) addToMap();
      if (html) setHTMLContent();
      popup.value.on('close', closeEventFn);
      popup.value.on('open', openEventFn);
    }

    onCleanUp(() => {
      removePopup();
    });
  });

  function openEventFn() {
    if (popup.value) on.open?.(popup.value);
  }

  async function closeEventFn() {
    if (popup.value) {
      await new Promise((resolve) => resolve(true));
      on.close?.(popup.value);
    }
  }

  function setLngLat(lnglat: LngLatLike) {
    if (popup.value) popup.value.setLngLat(lnglat);
  }

  function setOffset(offset: [number, number]) {
    if (popup.value) popup.value.setOffset(offset);
  }

  function addClassName(className: string) {
    if (popup.value) popup.value.addClassName(className);
  }

  function removeClassName(className: string) {
    if (popup.value) popup.value.removeClassName(className);
  }

  function setMaxWidth(width: string) {
    if (popup.value) popup.value.setMaxWidth(width);
  }

  function show() {
    const map = unref(mapRef);
    if (map && popup.value && !popup.value.isOpen()) popup.value.addTo(map);
  }

  function hide() {
    if (popup.value && popup.value.isOpen()) popup.value.remove();
  }

  function addToMap() {
    const map = unref(mapRef);
    if (popup.value && map) popup.value.addTo(map);
  }

  function setHTMLContent() {
    if (popup.value && html) popup.value.setHTML(html);
  }

  function removePopup() {
    removeEvent();
    hide();
    popup.value = null;
  }

  function removeEvent() {
    if (popup.value) {
      popup.value.off('close', closeEventFn);
      popup.value.off('open', openEventFn);
    }
  }

  onUnmounted(() => {
    stopEffect();
  });

  return {
    popupInstance,
    setLngLat,
    setOffset,
    addClassName,
    removeClassName,
    removePopup,
    show,
    hide,
    setMaxWidth,
    addToMap,
    setHTMLContent,
  };
}
