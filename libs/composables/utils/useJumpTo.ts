import { watchEffect, ref } from 'vue'
import type { ShallowRef } from 'vue'
import type { Map, CameraOptions } from 'maplibre-gl'
import type { Nullable, Undefinedable } from '@libs/types'

export function useJumpTo(
  map: ShallowRef<Nullable<Map>>,
  options?: CameraOptions
) {
  const jumpOptions = ref<Undefinedable<CameraOptions>>(options)

  watchEffect(() => {
    if (map.value && jumpOptions.value) map.value.flyTo(jumpOptions.value)
  })

  function jumpTo(options?: CameraOptions) {
    if (options) jumpOptions.value = options
  }

  return {
    jumpTo
  }
}
