import type { ShallowRef } from 'vue'
import type { Map, AnimationOptions } from 'maplibre-gl'
import type { Nullable, Undefinedable } from '@libs/types'

export function useZoomTo(
  map: ShallowRef<Nullable<Map>>,
  options?: AnimationOptions & { zoom: number }
) {
  const zoom = ref<number | undefined>(options?.zoom)
  const aimationOptions = ref<Undefinedable<AnimationOptions>>(options)

  watchEffect(() => {
    if (map.value && aimationOptions.value) map.value.zoomTo(zoom.value!, aimationOptions.value)
  })

  function zoomTo(zoomVal: number, options?: AnimationOptions) {
    zoom.value = zoomVal
    if (options) aimationOptions.value = options
  }

  return {
    zoomTo
  }
}

export function useZoomIn(map: ShallowRef<Nullable<Map>>, options?: AnimationOptions) {
  const aimationOptions = ref<Undefinedable<AnimationOptions>>(options)

  watchEffect(() => {
    if (map.value && aimationOptions.value) map.value.zoomIn(aimationOptions.value)
  })

  function zoomIn(options?: AnimationOptions) {
    if (options) aimationOptions.value = options
  }

  return {
    zoomIn
  }
}

export function useZoomOut(map: ShallowRef<Nullable<Map>>, options?: AnimationOptions) {
  const aimationOptions = ref<Undefinedable<AnimationOptions>>(options)

  watchEffect(() => {
    if (map.value && aimationOptions.value) map.value.zoomOut(aimationOptions.value)
  })

  function zoomOut(options?: AnimationOptions) {
    if (options) aimationOptions.value = options
  }

  return {
    zoomOut
  }
}
