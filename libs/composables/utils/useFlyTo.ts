import { watchEffect, ref } from 'vue'
import type { ShallowRef } from 'vue'
import type { Map, FlyToOptions } from 'maplibre-gl'
import type { Nullable, Undefinedable } from '@libs/types'

export function useFlyTo(
  map: ShallowRef<Nullable<Map>>,
  options?: FlyToOptions
) {
  const flyOptions = ref<Undefinedable<FlyToOptions>>(options)

  watchEffect(() => {
    if (map.value && flyOptions.value) map.value.flyTo(flyOptions.value)
  })

  function flyTo(options?: FlyToOptions) {
    if (options) flyOptions.value = options
  }

  return {
    flyTo
  }
}
