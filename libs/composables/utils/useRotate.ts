import { watchEffect, ref } from 'vue';
import type { Nullable, Undefinedable } from '@libs/types';
import type { ShallowRef } from 'vue';
import type { Map, AnimationOptions } from 'maplibre-gl';

export function useRotateTo(
  map: ShallowRef<Nullable<Map>>,
  options?: AnimationOptions & { bearing: number },
) {
  const bearing = ref<number | undefined>(options?.bearing);
  const aimationOptions = ref<Undefinedable<AnimationOptions>>(options);

  watchEffect(() => {
    if (map.value && aimationOptions.value)
      map.value.rotateTo(bearing.value!, aimationOptions.value);
  });

  function rotateTo(bearingVal: number, options?: AnimationOptions) {
    bearing.value = bearingVal;
    if (options) aimationOptions.value = options;
  }

  return {
    rotateTo,
  };
}

export function useResetNorth(
  map: ShallowRef<Nullable<Map>>,
  options?: AnimationOptions,
) {
  const aimationOptions = ref<Undefinedable<AnimationOptions>>(options);

  watchEffect(() => {
    if (map.value && aimationOptions.value)
      map.value.resetNorth(aimationOptions.value);
  });

  function resetNorth(options?: AnimationOptions) {
    if (options) aimationOptions.value = options;
  }

  return {
    resetNorth,
  };
}

export function useResetNorthPitch(
  map: ShallowRef<Nullable<Map>>,
  options?: AnimationOptions,
) {
  const aimationOptions = ref<Undefinedable<AnimationOptions>>(options);

  watchEffect(() => {
    if (map.value && aimationOptions.value)
      map.value.resetNorthPitch(aimationOptions.value);
  });

  function resetNorthPitch(options?: AnimationOptions) {
    if (options) aimationOptions.value = options;
  }

  return {
    resetNorthPitch,
  };
}

export function useSnapToNorth(
  map: ShallowRef<Nullable<Map>>,
  options?: AnimationOptions,
) {
  const aimationOptions = ref<Undefinedable<AnimationOptions>>(options);

  watchEffect(() => {
    if (map.value && aimationOptions.value)
      map.value.snapToNorth(aimationOptions.value);
  });

  function snapToNorth(options?: AnimationOptions) {
    if (options) aimationOptions.value = options;
  }

  return {
    snapToNorth,
  };
}
