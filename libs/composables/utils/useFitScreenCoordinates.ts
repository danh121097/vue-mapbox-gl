import { watchEffect, ref } from 'vue';
import type { Nullable, Undefinedable } from '@libs/types';
import type { ShallowRef } from 'vue';
import type { Map, FitBoundsOptions, PointLike } from 'maplibre-gl';

export function useFitScreenCoordinates(map: ShallowRef<Nullable<Map>>) {
  const p0 = ref<PointLike>();
  const p1 = ref<PointLike>();

  const options =
    ref<Undefinedable<Omit<FitBoundsOptions, 'bearing'>>>(undefined);

  const bearing = ref<Undefinedable<number>>(undefined);

  function fitScreenCoordinates(
    p0Val: PointLike,
    p1Val: PointLike,
    optionsVal?: Omit<FitBoundsOptions, 'bearing'>,
    bearingVal?: number,
  ) {
    p0.value = p0Val;
    p1.value = p1Val;
    if (optionsVal) options.value = optionsVal;
    if (bearingVal) bearing.value = bearingVal;
  }

  watchEffect(() => {
    if (map.value && p0.value && p1.value) {
      bearing.value = bearing.value ?? map.value.getBearing();
      map.value.fitScreenCoordinates(
        p0.value,
        p1.value,
        bearing.value,
        options.value,
      );
    }
  });

  return {
    fitScreenCoordinates,
    p0,
    p1,
  };
}
