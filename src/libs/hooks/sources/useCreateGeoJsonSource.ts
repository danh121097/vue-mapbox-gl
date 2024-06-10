import { getNanoid, hasSource, getMainVersion } from '@libs/helpers'
import { useMapReloadEvent } from '@libs/hooks'
import { MapboxSourceType } from '@libs/enums'
import type { MaybeRef, ShallowRef } from 'vue'
import type {
  Map,
  GeoJSONSource,
  GeoJSONSourceOptions,
  MapSourceDataEvent,
  SourceSpecification
} from 'maplibre-gl'
import type { Nullable } from '@libs/types'

interface CreateGeoJsonSourceProps {
  map: MaybeRef<Nullable<Map>>
  id?: string
  data?: SourceSpecification
  options?: Partial<GeoJSONSourceOptions>
  register?: (actions: CreateGeoJsonSourceActions, map: Map) => void
}

export interface CreateGeoJsonSourceActions {
  sourceId: string
  getSource: ShallowRef<Nullable<GeoJSONSource>>
  setData: (data: SourceSpecification) => void
}

const defaultData: SourceSpecification = {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: []
  }
}

export function useCreateGeoJsonSource({
  map: mapRef,
  id,
  register,
  options = {},
  data = defaultData
}: CreateGeoJsonSourceProps) {
  const sourceId = getNanoid(id)
  const sourceType = MapboxSourceType.Geojson
  const source = shallowRef<Nullable<GeoJSONSource>>(null)
  const getSource = computed(() => source.value)

  useMapReloadEvent(mapRef, {
    unLoad: removeSource,
    onLoad: initSource
  })

  function sourcedataEventFn(e: MapSourceDataEvent) {
    const map = unref(mapRef)!
    let isSourceLoaded = e.isSourceLoaded
    if (getMainVersion() === 1) isSourceLoaded = true

    if (!source.value && e.sourceId === sourceId && isSourceLoaded) {
      source.value = map?.getSource(sourceId) as GeoJSONSource

      console.log('dkm', source.value)

      register?.(
        {
          sourceId,
          getSource,
          setData
        },
        map
      )
      map?.off('sourcedata', sourcedataEventFn)
    }
  }

  function initSource() {
    const map = unref(mapRef)
    if (map && !source.value && !hasSource(map, sourceId)) {
      console.log('data init', data)

      map.addSource(sourceId, {
        ...options,
        type: sourceType,
        data: data as any
      })
      map.on('sourcedata', sourcedataEventFn)
    }
  }

  function setData(dataVal: SourceSpecification) {
    const map = unref(mapRef)

    console.log('dataVal', dataVal)

    console.log('hasSource(map, sourceId)', map && hasSource(map, sourceId))

    console.log(' hahahahaxxxxx', source.value)

    if (map && source.value && hasSource(map, sourceId)) {
      dataVal && source.value.setData(dataVal as any)
    }
  }

  function removeSource() {
    const map = unref(mapRef)
    source.value = null
    if (map && hasSource(map, sourceId)) {
      map.removeSource(sourceId)
      map.off('sourcedata', sourcedataEventFn)
    }
  }

  onUnmounted(() => {
    removeSource()
  })

  return {
    sourceId,
    getSource,
    setData,
    removeSource
  }
}
