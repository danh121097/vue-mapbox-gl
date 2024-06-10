import type { ComputedRef } from 'vue'
import type { MapboxStatus } from '@libs/enums'
import type {
  LngLatBoundsLike,
  LngLatLike,
  Map,
  MapEventType,
  MapMouseEvent,
  MapOptions,
  MapStyleImageMissingEvent,
  StyleSpecification
} from 'maplibre-gl'

export type Nullable<T> = T | null

export type Undefinedable<T> = T | undefined

export interface CreateMaplibreActions {
  mapInstance: ComputedRef<Map | null>
  mapStatus: ComputedRef<MapboxStatus>
  setStyle: (style: string | StyleSpecification) => void
  setCenter: (center: LngLatLike) => void
  setBearing: (bearing: number) => void
  setZoom: (zoom: number) => void
  setMinZoom: (zoom: number) => void
  setMaxZoom: (zoom: number) => void
  setPitch: (pitch: number) => void
  setMinPitch: (pitch: number) => void
  setMaxPitch: (pitch: number) => void
  setMaxBounds: (bounds: LngLatBoundsLike) => void
  setRenderWorldCopies: (renderWorldCopies: boolean) => void
}

export type MaplibreActions = CreateMaplibreActions & {
  setMapOptions: (options: Partial<MapOptions>) => void
}

export interface MapEventTypes extends MapEventType {
  styleimagemissing: MapStyleImageMissingEvent
  preclick: MapMouseEvent
  mouseleave: MapMouseEvent
  mouseenter: MapMouseEvent
}
