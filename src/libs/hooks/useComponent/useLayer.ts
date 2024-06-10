import { hasLayer } from '@libs/helpers'
import type { CreateLayerActions, Nullable } from '@libs/types'
import type { Map, LayerSpecification, FilterSpecification } from 'maplibre-gl'
import type { EffectScope, ComputedRef } from 'vue'

interface Methods<T extends LayerSpecification> {
  getLayerId: ComputedRef<string | undefined>
  getLayer: ComputedRef<Nullable<LayerSpecification>>
  getFilter: () => void | FilterSpecification
  getLayoutProperty: (name: keyof T['layout']) => any
  getPaintProperty: (name: keyof T['paint']) => any
  setBeforeId: (beforeId?: string) => void
  setFilter: (filter?: FilterSpecification) => void
  setPaintProperty: (
    name: string,
    value: any,
    options?: {
      validate: boolean
    }
  ) => void
  setLayoutProperty: (
    name: string,
    value: any,
    options?: {
      validate: boolean
    }
  ) => void
  setZoomRange: (minzoom?: number, maxzoom?: number) => void
  removeLayer: () => void
  setStyle: (styleVal: T['layout'] & T['paint']) => void
}

export function useLayer<T extends LayerSpecification>(): [
  (componentAction: CreateLayerActions<T>, map: Map) => void,
  Methods<T>
] {
  const instanceRef = ref<CreateLayerActions<T>>()
  const loadedRef = ref<boolean>(false)

  const mapInstanceRef = shallowRef<Nullable<Map>>(null)
  const layerRef = shallowRef<Nullable<LayerSpecification>>(null)
  const layerIdRef = ref<string>()

  let watchScope: EffectScope

  function register(instance: CreateLayerActions<T>, map: Map) {
    if (unref(loadedRef) && instance === unref(instanceRef)) return

    instanceRef.value = instance
    mapInstanceRef.value = map

    loadedRef.value = true

    watchScope?.stop()

    watchScope = effectScope()
    watchScope.run(() => {
      watch(
        () => instance.getLayer.value,
        layer => {
          layerRef.value = layer
          layerIdRef.value = layer?.id
        },
        {
          immediate: true
        }
      )
    })
  }

  function getInstance(): CreateLayerActions<T> | undefined {
    const instance = unref(instanceRef)
    if (!instance) console.warn('useLayer: The Actions is undefined')
    return instance
  }

  const methods: Methods<T> = {
    getLayerId: computed(() => layerIdRef.value),
    getLayer: computed(() => layerRef.value),
    getFilter: () => {
      if (
        mapInstanceRef.value &&
        layerIdRef.value &&
        hasLayer(mapInstanceRef.value, layerIdRef.value)
      )
        mapInstanceRef.value.getFilter(layerIdRef.value)
    },
    getLayoutProperty: (name: keyof T['layout']) => {
      if (
        mapInstanceRef.value &&
        layerIdRef.value &&
        hasLayer(mapInstanceRef.value, layerIdRef.value)
      ) {
        return mapInstanceRef.value.getLayoutProperty(layerIdRef.value, name as string)
      }
    },
    getPaintProperty: (name: keyof T['paint']) => {
      if (
        mapInstanceRef.value &&
        layerIdRef.value &&
        hasLayer(mapInstanceRef.value, layerIdRef.value)
      ) {
        return mapInstanceRef.value.getPaintProperty(layerIdRef.value, name as string)
      }
    },
    setBeforeId: (beforeId?: string) => {
      getInstance()?.setBeforeId(beforeId)
    },
    setFilter: (filter?: FilterSpecification) => {
      getInstance()?.setFilter(filter)
    },
    setPaintProperty: (name: string, value: any, options?: { validate: boolean }) => {
      getInstance()?.setPaintProperty(name, value, options)
    },
    setLayoutProperty: (name: string, value: any, options?: { validate: boolean }) => {
      getInstance()?.setLayoutProperty(name, value, options)
    },
    setZoomRange: (minzoom?: number, maxzoom?: number) => {
      getInstance()?.setZoomRange(minzoom, maxzoom)
    },
    removeLayer: () => {
      getInstance()?.removeLayer()
    },
    setStyle: (styleVal: T['layout'] & T['paint']) => {
      getInstance()?.setStyle(styleVal)
    }
  }

  return [register, methods]
}
