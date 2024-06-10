import { Map, FullscreenControl } from 'maplibre-gl'
import type { ShallowRef, Ref } from 'vue'
import type { ControlPosition } from 'maplibre-gl'
import type { Nullable } from '@libs/types'

interface FullscreenControlProps {
  map: ShallowRef<Nullable<Map>>
  container?: Ref<HTMLElement | string | undefined | null> | HTMLElement | string
  position?: ControlPosition
}

export function useFullscreenControl({
  map,
  container,
  position = 'bottom-right'
}: FullscreenControlProps) {
  const fullscreenControl = shallowRef<Nullable<FullscreenControl>>(null)

  const stopEffect = watchEffect(() => {
    if (map.value && !fullscreenControl.value) {
      let containerElement: HTMLElement | null | undefined

      if (typeof unref(container) === 'string')
        containerElement = document.querySelector<HTMLElement>(unref(container) as string)
      else containerElement = unref(container) as HTMLElement

      fullscreenControl.value = new FullscreenControl({
        container: containerElement || document.body
      })

      map.value.addControl(fullscreenControl.value, position)
    }
  })

  function remove() {
    stopEffect()
    if (map.value && fullscreenControl.value) map.value.removeControl(fullscreenControl.value)
    fullscreenControl.value = null
  }

  onUnmounted(() => {
    remove()
  })

  return {
    fullscreenControl,
    remove
  }
}
