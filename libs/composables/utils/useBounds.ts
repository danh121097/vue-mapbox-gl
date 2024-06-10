import { watchEffect, ref } from 'vue'
import type { Nullable, Undefinedable } from '@libs/types'
import type { ShallowRef } from 'vue'
import type {
  Map,
  LngLatBoundsLike,
  FitBoundsOptions,
  CameraOptions
} from 'maplibre-gl'

export function useFitBounds(
  map: ShallowRef<Nullable<Map>>,
  options?: FitBoundsOptions
) {
  const bounds = ref<LngLatBoundsLike>()

  let boundsOptions: Undefinedable<FitBoundsOptions> = options

  watchEffect(() => {
    if (map.value && bounds.value)
      map.value.fitBounds(bounds.value, boundsOptions)
  })

  function setFitBounds(
    boundsVal: LngLatBoundsLike,
    options?: FitBoundsOptions
  ) {
    bounds.value = boundsVal
    if (options) boundsOptions = options
  }

  return {
    setFitBounds,
    bounds
  }
}

export function useCameraForBounds(
  map: ShallowRef<Nullable<Map>>,
  options?: CameraOptions & { bounds: LngLatBoundsLike }
) {
  const bbox = ref<LngLatBoundsLike | undefined>(options?.bounds)
  let cameraOptions: Undefinedable<CameraOptions> = options

  watchEffect(() => {
    if (map.value && bbox.value)
      map.value.cameraForBounds(bbox.value, cameraOptions)
  })

  function cameraForBounds(
    boundsVal: LngLatBoundsLike,
    options?: CameraOptions
  ) {
    bbox.value = boundsVal
    if (options) cameraOptions = options
  }

  return {
    cameraForBounds,
    bbox
  }
}
