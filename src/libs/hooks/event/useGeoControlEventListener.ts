import type { Nullable, GeolocateEventTypes } from '@libs/types'
import type { GeolocateControl } from 'maplibre-gl'
import type { MaybeRef } from 'vue'

interface GeoEventProps {
  geo: MaybeRef<Nullable<GeolocateControl>>
  event: keyof GeolocateEventTypes
  on: <T extends keyof GeolocateEventTypes>(e: GeolocateEventTypes[T]) => void
}

export function useGeoControlEventListener(props: GeoEventProps) {
  const layerEventFn = (e: GeolocateEventTypes[keyof GeolocateEventTypes]) => {
    props.on && props.on(e)
  }

  const stopEffect = watchEffect(onCleanUp => {
    const map = unref(props.geo)
    if (map) map.on(props.event, layerEventFn)
    onCleanUp(remove)
  })

  function remove() {
    const map = unref(props.geo)
    if (map) map.off(props.event, layerEventFn)
  }

  onUnmounted(() => {
    stopEffect()
  })

  return {
    remove
  }
}
