import type { ShallowRef } from 'vue'
import type { Map, LngLatBoundsLike, FitBoundsOptions, CameraOptions } from 'maplibre-gl'
import type { Nullable, Undefinedable } from '@libs/types'

export function useFitBounds(map: ShallowRef<Nullable<Map>>, options?: FitBoundsOptions) {
  let boundsOptions: Undefinedable<FitBoundsOptions> = options

  const bounds = ref<LngLatBoundsLike>()

  watchEffect(() => {
    if (map.value && bounds.value) map.value.fitBounds(bounds.value, boundsOptions)
  })

  function setFitBounds(boundsVal: LngLatBoundsLike, options?: FitBoundsOptions) {
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
  let cameraOptions: Undefinedable<CameraOptions> = options

  const bbox = ref<LngLatBoundsLike | undefined>(options?.bounds)

  watchEffect(() => {
    if (map.value && bbox.value) map.value.cameraForBounds(bbox.value, cameraOptions)
  })

  function cameraForBounds(boundsVal: LngLatBoundsLike, options?: CameraOptions) {
    bbox.value = boundsVal
    if (options) cameraOptions = options
  }

  return {
    cameraForBounds,
    bbox
  }
}
