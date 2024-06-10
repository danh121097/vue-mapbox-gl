import { watchEffect, ref } from 'vue'
import type { ShallowRef } from 'vue'
import type { Map, FitBoundsOptions, PointLike } from 'maplibre-gl'
import type { Nullable, Undefinedable } from '@libs/types'

export function useFitScreenCoordinates(map: ShallowRef<Nullable<Map>>) {
  const p0 = ref<PointLike>()
  const p1 = ref<PointLike>()

  let options: Undefinedable<Omit<FitBoundsOptions, 'bearing'>> = undefined
  let bearing: Undefinedable<number> = undefined

  function fitScreenCoordinates(
    p0Val: PointLike,
    p1Val: PointLike,
    optionsVal?: Omit<FitBoundsOptions, 'bearing'>,
    bearingVal?: number
  ) {
    p0.value = p0Val
    p1.value = p1Val
    if (optionsVal) options = optionsVal
    if (bearingVal) bearing = bearingVal
  }
  watchEffect(() => {
    if (map.value && p0.value && p1.value) {
      bearing = bearing ?? map.value.getBearing()
      map.value.fitScreenCoordinates(p0.value, p1.value, bearing, options)
    }
  })

  return {
    fitScreenCoordinates,
    p0,
    p1
  }
}
