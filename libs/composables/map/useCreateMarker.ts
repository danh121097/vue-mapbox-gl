import { watchEffect, watch, unref, shallowRef } from 'vue';
import { Marker } from 'maplibre-gl';
import { lngLatLikeHasValue } from '@libs/helpers';
import type { Nullable } from '@libs/types';
import type { MaybeRef, Ref } from 'vue';
import type {
  Alignment,
  Listener,
  LngLatLike,
  Map,
  MarkerOptions,
  Popup,
} from 'maplibre-gl';

interface CreateMarkerProps {
  map: MaybeRef<Nullable<Map>>;
  lnglat?: LngLatLike;
  popup?: MaybeRef<Nullable<Popup>>;
  el?: Ref<HTMLElement | undefined>;
  options?: MarkerOptions;
  on?: {
    dragstart?: (e: Event) => void;
    drag?: (e: Event) => void;
    dragend?: (e: Event) => void;
  };
}

export function useCreateMarker({
  map: mapRef,
  lnglat: lnglatVal,
  popup: popupRef,
  el,
  options = {},
  on = {},
}: CreateMarkerProps) {
  const marker = shallowRef<Nullable<Marker>>(null);
  let oPopup = unref(popupRef);

  function dragstartEventFn(ev: Event) {
    on.dragstart?.(ev);
  }

  function dragEventFn(ev: Event) {
    on.drag?.(ev);
  }

  function dragendEventFn(ev: Event) {
    on.dragend?.(ev);
  }

  watchEffect((onCleanUp) => {
    const map = unref(mapRef);
    if (map && !marker.value) {
      marker.value = new Marker({
        ...options,
        element: el?.value,
      });

      if (lnglatVal && lngLatLikeHasValue(lnglatVal)) setLngLat(lnglatVal);

      oPopup && setPopup(oPopup);
      marker.value.addTo(map);

      marker.value.on('dragstart', dragstartEventFn as Listener);
      marker.value.on('drag', dragEventFn as Listener);
      marker.value.on('dragend', dragendEventFn as Listener);
    }

    onCleanUp(removeMarker);
  });

  watch(() => unref(popupRef)!, setPopup);

  function setLngLat(lnglat: LngLatLike) {
    if (marker.value) marker.value.setLngLat(lnglat);
  }

  function setPopup(popup?: Popup | null) {
    oPopup = popup;
    if (marker.value) marker.value.setPopup(popup!);
  }

  function setOffset(offset: [number, number]) {
    if (marker.value) marker.value.setOffset(offset);
  }

  function setDraggable(draggable: boolean) {
    if (marker.value) marker.value.setDraggable(draggable);
  }

  function togglePopup() {
    if (marker.value) marker.value.togglePopup();
  }

  function getElement() {
    if (marker.value) return marker.value.getElement();
    return null;
  }

  function setRotation(rotation: number) {
    if (marker.value) marker.value.setRotation(rotation);
  }

  function setRotationAlignment(alignment: Alignment) {
    if (marker.value) marker.value.setRotationAlignment(alignment);
  }

  function setPitchAlignment(alignment: Alignment) {
    if (marker.value) marker.value.setPitchAlignment(alignment);
  }

  function setOpacity(opacity: string, opacityWhenCovered?: string) {
    if (marker.value) marker.value.setOpacity(opacity, opacityWhenCovered);
  }

  function removeMarker() {
    if (marker.value) {
      marker.value.off('dragstart', dragstartEventFn as Listener);
      marker.value.off('drag', dragEventFn as Listener);
      marker.value.off('dragend', dragendEventFn as Listener);
      marker.value.remove();
    }
    marker.value = null;
  }

  return {
    setLngLat,
    setPopup,
    setOffset,
    setDraggable,
    togglePopup,
    getElement,
    setRotation,
    setRotationAlignment,
    setPitchAlignment,
    setOpacity,
    removeMarker,
  };
}
