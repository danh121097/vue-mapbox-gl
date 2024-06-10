import { Marker } from 'maplibre-gl'
import { lngLatLikeHasValue } from '@libs/helpers'
import type { MaybeRef, Ref } from 'vue'
import type { LngLatLike, Map, MarkerOptions, Popup } from 'maplibre-gl'
import type { Nullable } from '@libs/types'

interface CreateMarkerProps {
  map: MaybeRef<Nullable<Map>>
  lnglat?: LngLatLike
  popup?: MaybeRef<Nullable<Popup>>
  el?: Ref<HTMLElement | undefined>
  options?: MarkerOptions
  on?: {
    dragstart?: (e: Event) => void
    drag?: (e: Event) => void
    dragend?: (e: Event) => void
  }
}

export function useCreateMarker({
  map: mapRef,
  lnglat: lnglatVal,
  popup: popupRef,
  el,
  options = {},
  on = {}
}: CreateMarkerProps) {
  const marker = shallowRef<Nullable<Marker>>(null)
  let oPopup = unref(popupRef)

  function dragstartEventFn(ev: Event) {
    on.dragstart?.(ev)
  }

  function dragEventFn(ev: Event) {
    on.drag?.(ev)
  }

  function dragendEventFn(ev: Event) {
    on.dragend?.(ev)
  }

  const stopEffect = watchEffect(onCleanUp => {
    const map = unref(mapRef)
    if (map && !marker.value) {
      marker.value = new Marker({
        ...options,
        element: el?.value
      })
      lngLatLikeHasValue(lnglatVal) && setLngLat(lnglatVal)

      oPopup && setPopup(oPopup)
      marker.value.addTo(map)
      marker.value.on('dragstart', dragstartEventFn)
      marker.value.on('drag', dragEventFn)
      marker.value.on('dragend', dragendEventFn)
    }
    onCleanUp(remove)
  })

  watch(() => unref(popupRef), setPopup)

  function setLngLat(lnglat: LngLatLike) {
    if (marker.value) marker.value.setLngLat(lnglat)
  }

  function setPopup(popup?: Popup | null) {
    oPopup = popup
    if (marker.value) marker.value.setPopup(popup!)
  }

  function setOffset(offset: [number, number]) {
    if (marker.value) marker.value.setOffset(offset)
  }

  function setDraggable(draggable: boolean) {
    if (marker.value) marker.value.setDraggable(draggable)
  }

  function togglePopup() {
    if (marker.value) marker.value.togglePopup()
  }

  function getElement() {
    if (marker.value) return marker.value.getElement()
    return null
  }

  function setRotation(rotation: number) {
    if (marker.value) marker.value.setRotation(rotation)
  }

  function setRotationAlignment(alignment: 'map' | 'viewport') {
    if (marker.value) marker.value.setRotationAlignment(alignment)
  }

  function setPitchAlignment(alignment: 'map' | 'viewport') {
    if (marker.value) marker.value.setPitchAlignment(alignment)
  }

  function remove() {
    if (marker.value) {
      marker.value.off('dragstart', dragstartEventFn)
      marker.value.off('drag', dragEventFn)
      marker.value.off('dragend', dragendEventFn)
      marker.value.remove()
    }
    marker.value = null
  }

  onUnmounted(() => {
    stopEffect()
    oPopup = null
  })

  return {
    setLngLat,
    setPopup,
    setOffset,
    setDraggable,
    togglePopup,
    getElement,
    setRotation,
    setRotationAlignment,
    setPitchAlignment
  }
}
