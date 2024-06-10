import { Popup } from 'maplibre-gl'
import { lngLatLikeHasValue } from '@libs/helpers'
import type { Ref, ShallowRef } from 'vue'
import type { LngLatLike, Map, PopupOptions } from 'maplibre-gl'
import type { Nullable } from '@libs/types'

interface CreatePopupProps {
  map: ShallowRef<Nullable<Map>>
  options?: PopupOptions
  el?: Ref<HTMLElement | undefined>
  lnglat?: LngLatLike
  show?: boolean
  on?: {
    open?: (popup: Popup) => void
    close?: (popup: Popup) => void
  }
}

export function useCreatePopup({
  map: mapRef,
  lnglat: lnglatVal,
  el,
  show: showVal = false,
  options = {},
  on = {}
}: CreatePopupProps) {
  const popup = shallowRef<Nullable<Popup>>(null)
  const getPopup = computed(() => popup.value)

  const stopEffect = watchEffect(onCleanUp => {
    const map = unref(mapRef)
    if (map && el?.value && !popup.value) {
      popup.value = new Popup({
        ...options
      })
      popup.value.setDOMContent(el.value)
      lngLatLikeHasValue(lnglatVal) && setLngLat(lnglatVal)
      showVal && show()
      popup.value.on('close', closeEventFn)
      popup.value.on('open', openEventFn)
    }
    onCleanUp(() => {
      remove()
    })
  })

  function openEventFn() {
    if (popup.value) on.open?.(popup.value)
  }

  async function closeEventFn() {
    if (popup.value) {
      await new Promise(resolve => resolve(true))
      on.close?.(popup.value)
    }
  }

  function setLngLat(lnglat: LngLatLike) {
    if (popup.value) popup.value.setLngLat(lnglat)
  }

  function setOffset(offset: [number, number]) {
    if (popup.value) popup.value.setOffset(offset)
  }

  function addClassName(className: string) {
    if (popup.value) popup.value.addClassName(className)
  }

  function removeClassName(className: string) {
    if (popup.value) popup.value.removeClassName(className)
  }

  function setMaxWidth(width: string) {
    if (popup.value) popup.value.setMaxWidth(width)
  }

  function show() {
    const map = unref(mapRef)
    if (map && popup.value && !popup.value.isOpen()) popup.value.addTo(map)
  }

  function remove() {
    removeEvent()
    hide()
    popup.value = null
  }

  function hide() {
    if (popup.value && popup.value.isOpen()) popup.value.remove()
  }

  function removeEvent() {
    if (popup.value) {
      popup.value.off('close', closeEventFn)
      popup.value.off('open', openEventFn)
    }
  }

  onUnmounted(() => {
    stopEffect()
  })

  return {
    getPopup,
    setLngLat,
    setOffset,
    addClassName,
    removeClassName,
    remove,
    show,
    hide,
    setMaxWidth
  }
}
