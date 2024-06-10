import type { ShallowRef } from 'vue'
import type { Map, AnimationOptions, PointLike, LngLatLike } from 'maplibre-gl'
import type { Nullable, Undefinedable } from '@libs/types'

export function usePanBy(
  map: ShallowRef<Nullable<Map>>,
  options?: AnimationOptions & { offset: PointLike }
) {
  const offset = ref<PointLike | undefined>(options?.offset)
  const aimationOptions = ref<Undefinedable<AnimationOptions>>(options)

  watchEffect(() => {
    if (map.value && aimationOptions.value) map.value.panBy(offset.value!, aimationOptions.value)
  })

  function panBy(offsetVal: PointLike, options?: AnimationOptions) {
    offset.value = offsetVal
    if (options) aimationOptions.value = options
  }

  return {
    panBy
  }
}

export function usePanTo(
  map: ShallowRef<Nullable<Map>>,
  options?: AnimationOptions & { lnglat: LngLatLike }
) {
  const lnglat = ref<LngLatLike | undefined>(options?.lnglat)
  const aimationOptions = ref<Undefinedable<AnimationOptions>>(options)

  watchEffect(() => {
    if (map.value && aimationOptions.value) map.value.panTo(lnglat.value!, aimationOptions.value)
  })

  function panTo(offsetVal: LngLatLike, options?: AnimationOptions) {
    lnglat.value = offsetVal
    if (options) aimationOptions.value = options
  }

  return {
    panTo
  }
}
