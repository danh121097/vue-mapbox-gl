import type { ComputedRef, EffectScope } from 'vue'
import type { CreateGeoJsonSourceActions } from '@libs/hooks'
import type { GeoJSONSource, SourceSpecification } from 'maplibre-gl'
import type { Point, Feature, GeoJsonProperties } from 'geojson'
import type { Nullable } from '@libs/types'

interface Methods {
  sourceId: ComputedRef<string | undefined>
  getSource: ComputedRef<Nullable<GeoJSONSource>>
  setData: (dataVal: SourceSpecification) => void
  getClusterExpansionZoom: (clusterId: number) => Promise<number>
  getClusterChildren: <T extends GeoJsonProperties = any>(
    clusterId: number
  ) => Promise<Feature<Point, T>[]>
  getClusterLeaves: <T extends GeoJsonProperties = any>(
    clusterId: number,
    limit?: number,
    offset?: number
  ) => Promise<Feature<Point, T>[]>
}

export function useGeoJsonSource(): [
  (componentAction: CreateGeoJsonSourceActions) => void,
  Methods
] {
  const instanceRef = ref<CreateGeoJsonSourceActions>()
  const loadedRef = ref<boolean>(false)

  const sourceRef = shallowRef<Nullable<GeoJSONSource>>(null)
  const sourceIdRef = ref<string>()

  let watchScope: EffectScope
  let componentMethods: CreateGeoJsonSourceActions

  function register(instance: CreateGeoJsonSourceActions) {
    if (unref(loadedRef) && instance === unref(instanceRef)) return
    instanceRef.value = instance

    loadedRef.value = true

    watchScope?.stop()

    watchScope = effectScope()
    watchScope.run(() => {
      watch(
        () => instance.getSource.value,
        source => {
          sourceRef.value = source
          sourceIdRef.value = instance.sourceId
        },
        {
          immediate: true
        }
      )
    })
  }

  function getSourceInstance(): GeoJSONSource | null | undefined {
    const sourceInstance = unref(sourceRef)
    if (!sourceInstance) console.warn('useGeoJsonSource: The GeoJSONSource is undefined')
    return sourceInstance
  }

  const methods: Methods = {
    sourceId: computed(() => sourceIdRef.value),
    getSource: computed(() => sourceRef.value),
    setData: (dataVal: SourceSpecification) => {
      componentMethods.setData?.(dataVal)
    },
    getClusterExpansionZoom: (clusterId: number) => {
      return new Promise((resolve, reject) => {
        return getSourceInstance()?.getClusterExpansionZoom(clusterId)
      })
    },
    getClusterChildren: <T extends GeoJsonProperties = any>(clusterId: number) => {
      return new Promise<Feature<Point, T>[]>((resolve, reject) => {
        return getSourceInstance()?.getClusterChildren(clusterId)
      })
    },
    getClusterLeaves: <T extends GeoJsonProperties = any>(
      clusterId: number,
      limit = 10,
      offset = 0
    ) => {
      return new Promise<Feature<Point, T>[]>((resolve, reject) => {
        return getSourceInstance()?.getClusterLeaves(clusterId, limit, offset)
      })
    }
  }

  return [register, methods]
}
