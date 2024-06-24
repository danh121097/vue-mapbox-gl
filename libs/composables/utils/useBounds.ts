import { watchEffect, ref } from 'vue';
import type { Nullable, Undefinedable } from '@libs/types';
import type { ShallowRef } from 'vue';
import type {
  Map,
  LngLatBoundsLike,
  FitBoundsOptions,
  CameraForBoundsOptions,
} from 'maplibre-gl';

export function useFitBounds(
  map: ShallowRef<Nullable<Map>>,
  options?: FitBoundsOptions,
) {
  const bounds = ref<LngLatBoundsLike>();

  const boundsOptions = ref<Undefinedable<FitBoundsOptions>>(options);

  watchEffect(() => {
    if (map.value && bounds.value)
      map.value.fitBounds(bounds.value, boundsOptions.value);
  });

  function setFitBounds(
    boundsVal: LngLatBoundsLike,
    options?: FitBoundsOptions,
  ) {
    bounds.value = boundsVal;
    if (options) boundsOptions.value = options;
  }

  return {
    setFitBounds,
    bounds,
  };
}

export function useCameraForBounds(
  map: ShallowRef<Nullable<Map>>,
  options?: CameraForBoundsOptions & { bounds: LngLatBoundsLike },
) {
  const bbox = ref<LngLatBoundsLike | undefined>(options?.bounds);
  const cameraOptions = ref<Undefinedable<CameraForBoundsOptions>>(options);

  watchEffect(() => {
    if (map.value && bbox.value)
      map.value.cameraForBounds(bbox.value, cameraOptions.value);
  });

  function cameraForBounds(
    boundsVal: LngLatBoundsLike,
    options?: CameraForBoundsOptions,
  ) {
    bbox.value = boundsVal;
    if (options) cameraOptions.value = options;
  }

  return {
    cameraForBounds,
    bbox,
  };
}
