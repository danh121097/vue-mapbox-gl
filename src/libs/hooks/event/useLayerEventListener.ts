import type { Nullable } from '@libs/types'
import type { Map, LayerSpecification, MapLayerEventType } from 'maplibre-gl'
import type { MaybeRef } from 'vue'

interface LayerEventProps<T extends keyof MapLayerEventType> {
  map: MaybeRef<Nullable<Map>>
  layer: MaybeRef<Nullable<LayerSpecification | string>>
  event: keyof MapLayerEventType
  on: (e: MapLayerEventType[T]) => void
}

export function useLayerEventListener<T extends keyof MapLayerEventType>(
  props: LayerEventProps<T>
) {
  const layerEventFn = <K extends T>(e: MapLayerEventType[K]) => {
    props.on && props.on(e)
  }

  const stopEffect = watchEffect(onCleanUp => {
    const map = unref(props.map)
    const layer = unref(props.layer)
    if (map && layer) {
      const layerId = typeof layer === 'string' ? layer : layer.id
      map.on<T>(props.event as T, layerId, layerEventFn)
    }
    onCleanUp(remove)
  })

  function remove() {
    const map = unref(props.map)
    const layer = unref(props.layer)
    if (map && layer) {
      const layerId = typeof layer === 'string' ? layer : layer.id
      map.off<T>(props.event as T, layerId, layerEventFn)
    }
  }

  onUnmounted(() => {
    stopEffect()
  })

  return {
    remove
  }
}
