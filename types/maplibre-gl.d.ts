import type { ImageDatas } from '@/libs'

declare namespace maplibregl {
  export interface Map {
    addImage(id: string, image: ImageDatas, options?: ImageOptions): void
    setConfig(importId: string, config: MapboxOptionsConfig): Map
  }

  export interface Transition {
    delay?: number | undefined
    duration?: number | undefined
  }

  export type SourceType =
    | 'vector'
    | 'raster'
    | 'raster-dem'
    | 'geojson'
    | 'image'
    | 'video'
    | 'canvas'
    | 'custom'

  export type LayerType =
    | 'background'
    | 'fill'
    | 'line'
    | 'symbol'
    | 'raster'
    | 'circle'
    | 'fill-extrusion'
    | 'heatmap'
    | 'hillshade'
    | 'sky'

  export interface GeoJSONSourceOptions {
    data: GeoJSON.GeoJSON | string
  }

  export interface GeoJSONSource {
    setData(data: GeoJSON.GeoJSON | string): this
  }

  export interface VectorSourceOptions {
    attribution?: string
    bounds?: [number, number, number, number]
    maxzoom?: number // 0-22
    minzoom?: number // 0-22
    promteId?: string
    scheme?: 'xyz' | 'tms' // xyz
    tiles?: string[]
    url?: string
    volatile?: boolean // false
  }

  export interface RasterDemSourceOptions {
    attribution?: string
    bounds?: [number, number, number, number]
    maxzoom?: number // 0-22
    minzoom?: number // 0-22
    encoding?: 'terrarium' | 'mapbox' // mapbox
    tiles?: string[]
    tileSize?: number
    url?: string
    volatile?: boolean // false
  }

  export interface RasterSourceOptions {
    attribution?: string
    bounds?: [number, number, number, number]
    maxzoom?: number // 0-22
    minzoom?: number // 0-22
    scheme?: 'xyz' | 'tms' // xyz
    tiles?: string[]
    tileSize?: number
    url?: string
    volatile?: boolean // false
  }

  export interface AttributionControlOptions {
    compact?: boolean // false
    customAttribution?: string | string[]
  }

  export type ControlPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

  export interface GeolocateControlOptions {
    positionOptions?: PositionOptions | undefined
    fitBoundsOptions?: FitBoundsOptions | undefined
    trackUserLocation?: boolean | undefined
    showAccuracyCircle?: boolean | undefined
    showUserLocation?: boolean | undefined
    showUserHeading?: boolean | undefined
    geolocation?: Geolocation | undefined
  }

  export interface NavigationControlOptions {
    showCompass?: boolean
    showZoom?: boolean
    visualizePitch?: boolean
  }

  export interface ScaleControlOptions {
    maxWidth?: number
    unit?: 'imperial' | 'metric' | 'nautical'
  }

  export interface Marker {
    setOccludedOpacity(opacity: number): void
  }

  export interface StyleImageInterface {
    width: number
    height: number
    data: Uint8Array | Uint8ClampedArray
    onAdd(map: Map): void
    render(): void
    onRemove(): void
  }
}
