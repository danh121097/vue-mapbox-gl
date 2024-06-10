import { watchEffect, ref } from 'vue'
import type { ShallowRef } from 'vue'
import type { Map, EaseToOptions } from 'maplibre-gl'
import type { Nullable, Undefinedable } from '@libs/types'

export function useEaseTo(
  map: ShallowRef<Nullable<Map>>,
  options?: EaseToOptions
) {
  const flyOptions = ref<Undefinedable<EaseToOptions>>(options)

  watchEffect(() => {
    if (map.value && flyOptions.value) map.value.easeTo(flyOptions.value)
  })

  function easeTo(options?: EaseToOptions) {
    if (options) flyOptions.value = options
  }

  return {
    easeTo
  }
}
