import { useMapReloadEvent } from '@libs/hooks'
import { hasLayer } from '@libs/helpers'
import type { Map, CustomLayerInterface, LayerSpecification } from 'maplibre-gl'
import type { Nullable } from '@libs/types'
import type { MaybeRef } from 'vue'

interface CreateCustomLayerProps {
  map: MaybeRef<Nullable<Map>>
  customLayer: MaybeRef<CustomLayerInterface | (new () => CustomLayerInterface)>
  beforeId?: string
}

export function useCreateCustomLayer({
  map: mapRef,
  beforeId,
  customLayer: customLayerRef
}: CreateCustomLayerProps) {
  const layerId = ref<string | undefined>()
  const layer = shallowRef<any>(null)
  const getLayer = computed(() => layer.value)

  useMapReloadEvent(mapRef, {
    unLoad: removeLayer,
    onLoad: createLayer
  })

  function createLayer() {
    const map = unref(mapRef)
    const customLayer = unref(customLayerRef)
    let sourceLayer = customLayer

    if (typeof customLayer === 'function' && customLayer instanceof Object)
      sourceLayer = new customLayer()

    layerId.value = (sourceLayer as CustomLayerInterface).id!

    if (map && layerId && !layer.value && !hasLayer(map, layerId.value)) {
      map.addLayer(sourceLayer as CustomLayerInterface, beforeId)
      layer.value = map.getLayer(layerId.value) as LayerSpecification
    }
  }

  function removeLayer() {
    const map = unref(mapRef)
    layer.value = null
    if (map && layerId.value && hasLayer(map, layerId.value)) map.removeLayer(layerId.value)
  }

  function setBeforeId(beforeIdVal?: string) {
    const map = unref(mapRef)
    if (map && layerId.value && layer.value && hasLayer(map, layerId.value))
      map.moveLayer(layerId.value, beforeIdVal)
  }

  return {
    layerId,
    getLayer,
    removeLayer,
    setBeforeId
  }
}
