import type { MaybeRef } from 'vue'
import type { Map } from 'maplibre-gl'
import type { Nullable } from '@libs/types'

interface CallBackFn {
  (map: Map): void
}

export function useMapReloadEvent(
  mapRef: MaybeRef<Nullable<Map>>,
  cbObj: {
    unLoad?: CallBackFn
    onLoad: CallBackFn
  }
) {
  const map = unref(mapRef)
  let isMapLoad = !!(map as any)?._loaded

  isMapLoad && loadEventFn(true)

  function unLoadEventFn() {
    const map = unref(mapRef)
    if (!isMapLoad) return
    isMapLoad = false
    cbObj.unLoad && cbObj.unLoad(map!)
  }

  function loadEventFn(isForce: boolean = false) {
    const map = unref(mapRef)
    if (isMapLoad && !isForce) return
    isMapLoad = true
    cbObj.onLoad && cbObj.onLoad(map!)
  }

  function clear() {
    const map = unref(mapRef)
    if (map) {
      map.off('styledata', loadEventFn)
      map.off('styledataloading', unLoadEventFn)
      map.off('load', loadEventFn)
    }
  }

  const stopEffect = watchEffect(onCleanUp => {
    const map = unref(mapRef)
    if (!map) return
    if (!isMapLoad) map.on('load', loadEventFn)
    else loadEventFn()
    map.on('styledata', loadEventFn)
    map.on('styledataloading', unLoadEventFn)
    onCleanUp(clear)
  })

  onUnmounted(() => {
    unLoadEventFn()
    stopEffect()
    clear()
  })

  return {
    clear
  }
}
