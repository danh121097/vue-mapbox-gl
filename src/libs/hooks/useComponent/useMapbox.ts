import { MapboxStatus } from '@libs/enums'
import type {
  LngLatBoundsLike,
  LngLatLike,
  Map,
  MapGeoJSONFeature,
  PaddingOptions,
  PointLike,
  QueryRenderedFeaturesOptions,
  QuerySourceFeatureOptions,
  StyleSpecification
} from 'maplibre-gl'
import type { MabLibreMethods, MapboxActions, Nullable } from '@libs/types'
import type { EffectScope } from 'vue'

export function useMapbox(): [(componentAction: MapboxActions) => void, MabLibreMethods] {
  const instanceRef = ref<MapboxActions>()
  const loadedRef = ref<boolean>(false)

  const mapInstance = shallowRef<Nullable<Map>>(null)
  const mapStatus = ref<MapboxStatus>(MapboxStatus.NotLoaded)

  let watchScope: EffectScope

  function register(instance: MapboxActions) {
    if (unref(loadedRef) && instance === unref(instanceRef)) return

    instanceRef.value = instance

    loadedRef.value = true

    watchScope?.stop()

    watchScope = effectScope()
    watchScope.run(() => {
      watch(
        () => instance.getMapInstance.value,
        map => {
          mapInstance.value = map
        },
        {
          immediate: true
        }
      )
      watch(
        () => instance.getMapStatus.value,
        status => {
          mapStatus.value = status
        },
        {
          immediate: true
        }
      )
    })
  }

  function getMapInstance(): Map | null | undefined {
    const mapInstance = unref(instanceRef.value?.getMapInstance)
    if (!mapInstance) {
      console.warn('useMapbox: The map is undefined')
    }
    return mapInstance
  }
  function getInstance(): MapboxActions | undefined {
    const instance = unref(instanceRef)
    if (!instance) {
      console.warn('useMapbox: The Actions is undefined')
    }
    return instance
  }
  const methods: MabLibreMethods = {
    getMapInstance: computed(() => mapInstance.value),
    getMapStatus: computed(() => mapStatus.value),
    getContainer: () => {
      return getMapInstance()?.getContainer()
    },
    getCanvasContainer: () => {
      return getMapInstance()?.getCanvasContainer()
    },
    getCanvas: () => {
      return getMapInstance()?.getCanvas()
    },
    getStyle: () => {
      return getMapInstance()?.getStyle()
    },
    getBounds: () => {
      return getMapInstance()?.getBounds()
    },
    getCenter: () => {
      return getMapInstance()?.getCenter()
    },
    getZoom: () => {
      return getMapInstance()?.getZoom()
    },
    getBearing: () => {
      return getMapInstance()?.getBearing()
    },
    getPadding: () => {
      return getMapInstance()?.getPadding()
    },
    getPitch: () => {
      return getMapInstance()?.getPitch()
    },
    getMinZoom: () => {
      return getMapInstance()?.getMinZoom()
    },
    getMaxZoom: () => {
      return getMapInstance()?.getMaxZoom()
    },
    getMinPitch: () => {
      return getMapInstance()?.getMinPitch()
    },
    getMaxPitch: () => {
      return getMapInstance()?.getMaxPitch()
    },
    getFilter: (layerId: string) => {
      return getMapInstance()?.getFilter(layerId)
    },
    getLayer: (layerId: string) => {
      return getMapInstance()?.getLayer(layerId)
    },
    getLayoutProperty: (layerId: string, name: string) => {
      return getMapInstance()?.getLayoutProperty(layerId, name)
    },
    getPaintProperty: (layerId: string, name: string) => {
      return getMapInstance()?.getPaintProperty(layerId, name)
    },
    getSource: (sourceId: string) => {
      return getMapInstance()?.getSource(sourceId)
    },
    project: (lnglat: LngLatLike) => {
      return getMapInstance()?.project(lnglat)
    },
    unproject: (point: PointLike) => {
      return getMapInstance()?.unproject(point)
    },
    queryRenderedFeatures: (
      point: PointLike | [PointLike, PointLike] | QueryRenderedFeaturesOptions | undefined,
      options?: QueryRenderedFeaturesOptions | undefined
    ): MapGeoJSONFeature[] => {
      return getMapInstance()?.queryRenderedFeatures(point, options) || []
    },
    querySourceFeatures: (
      sourceId: string,
      parameters?: QuerySourceFeatureOptions | null | undefined
    ): MapGeoJSONFeature[] => {
      return getMapInstance()?.querySourceFeatures(sourceId, parameters) || []
    },
    queryTerrainElevation: (lnglat: LngLatLike) => {
      return getMapInstance()?.queryTerrainElevation(lnglat)
    },
    isStyleLoaded: () => {
      return getMapInstance()?.isStyleLoaded()
    },
    isMoving: () => {
      return getMapInstance()?.isMoving()
    },
    isZooming: () => {
      return getMapInstance()?.isZooming()
    },
    isRotating: () => {
      return getMapInstance()?.isRotating()
    },
    isEasing: () => {
      return getMapInstance()?.isEasing()
    },
    resize: () => {
      getMapInstance()?.resize()
    },
    remove: () => {
      getMapInstance()?.remove()
    },
    triggerRepaint: () => {
      getMapInstance()?.triggerRepaint()
    },
    setFeatureState: (
      options: {
        id: number | string
        source: string
        sourceLayer?: string
      },
      state: Record<string, any>
    ) => {
      getMapInstance()?.setFeatureState(options, state)
    },
    removeFeatureState: (
      options: {
        id: number | string
        source: string
        sourceLayer?: string
      },
      key: string
    ) => {
      getMapInstance()?.removeFeatureState(options, key)
    },
    getFeatureState: (options: { id: number | string; source: string; sourceLayer?: string }) => {
      return getMapInstance()?.getFeatureState(options)
    },
    setPadding: (padding?: PaddingOptions) => {
      padding && getMapInstance()?.setPadding(padding)
    },
    setRenderWorldCopies: (val: boolean) => {
      getInstance()?.setRenderWorldCopies?.(val)
    },
    setMinZoom: (zoom: number) => {
      getInstance()?.setMaxZoom?.(zoom)
    },
    setMinPitch: (pitch: number) => {
      getInstance()?.setMinPitch?.(pitch)
    },
    setMaxZoom: (zoom: number) => {
      getInstance()?.setMaxZoom?.(zoom)
    },
    setMaxPitch: (pitch: number) => {
      getInstance()?.setMaxPitch?.(pitch)
    },
    setMaxBounds: (bounds: LngLatBoundsLike) => {
      getInstance()?.setMaxBounds?.(bounds)
    },
    setStyle: (style: string | StyleSpecification) => {
      getInstance()?.setStyle?.(style)
    },
    setPitch: (pitch: number) => {
      getInstance()?.setPitch?.(pitch)
    },
    setZoom: (zoom: number) => {
      getInstance()?.setZoom?.(zoom)
    },
    setBearing: (bearing: number) => {
      getInstance()?.setBearing?.(bearing)
    },
    setCenter: (center: LngLatLike) => {
      getInstance()?.setCenter?.(center)
    }
  }
  return [register, methods]
}
