import type {
  Map,
  LngLatLike,
  LngLatBoundsLike,
  PaddingOptions,
  Point,
  LngLat,
  PointLike,
  LayerSpecification,
  GeolocateControl,
  GeoJSONSource,
  VideoSource,
  ImageSource,
  CanvasSource,
  FilterSpecification,
  PropertyValueSpecification,
  ColorSpecification,
  ResolvedImageSpecification,
  DataDrivenPropertyValueSpecification,
  ExpressionSpecification,
  FormattedSpecification,
  PaddingSpecification,
  VariableAnchorOffsetCollectionSpecification,
  StyleImageInterface,
  StyleSpecification,
  QueryRenderedFeaturesOptions,
  QuerySourceFeatureOptions,
  MapGeoJSONFeature,
  MapEventType,
  MapMouseEvent,
  MapStyleImageMissingEvent,
  MapOptions
} from 'maplibre-gl'
import type { ComputedRef } from 'vue'
import type { MapboxStatus } from '@libs/enums'

export type Nullable<T> = T | null

export type Undefinedable<T> = T | undefined

export interface CreateBaseLayerActions<Layer extends LayerSpecification> {
  layerId: string
  getLayer: ComputedRef<Nullable<Layer>>
  setBeforeId: (beforeId?: string) => void
  setFilter: (filter?: FilterSpecification) => void
  setPaintProperty: (name: string, value: any, options?: { validate: boolean }) => void
  setLayoutProperty: (name: string, value: any, options?: { validate: boolean }) => void
  setZoomRange: (minzoom?: number, maxzoom?: number) => void
  removeLayer: () => void
}

export interface CreateLayerActions<Layer extends LayerSpecification>
  extends CreateBaseLayerActions<Layer> {
  setStyle: (styleVal: Layer['layout'] & Layer['paint']) => void
}

export interface ChainCameraItem {
  lngLat: LngLatLike
  lookAtLngLat: LngLatLike
  duration: number
  altitude: number
  easing?:
    | 'linear'
    | 'easeInQuad'
    | 'easeOutQuad'
    | 'easeInOutQuad'
    | 'easeInCubic'
    | 'easeOutCubic'
    | 'easeInOutCubic'
}

export interface CreateMapboxActions {
  getMapInstance: ComputedRef<Map | null>
  getMapStatus: ComputedRef<MapboxStatus>
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

export type MapboxActions = CreateMapboxActions & {
  setMapOptions: (options: Partial<MapOptions>) => void
}

export type MabLibreMethods = CreateMapboxActions & {
  getMapInstance: ComputedRef<Nullable<Map>>
  getContainer: () => HTMLElement | undefined
  getCanvasContainer: () => HTMLElement | undefined
  getCanvas: () => HTMLCanvasElement | undefined
  getStyle: () => StyleSpecification | undefined
  getBounds: () => LngLatBoundsLike | undefined
  getCenter: () => LngLatLike | undefined
  getZoom: () => number | undefined
  getBearing: () => number | undefined
  getPadding: () => PaddingOptions | undefined
  getPitch: () => number | undefined
  getMinZoom: () => number | undefined
  getMaxZoom: () => number | undefined
  getMinPitch: () => number | undefined
  getMaxPitch: () => number | undefined
  getFilter: (layerId: string) => void | FilterSpecification
  getLayer: (layerId: string) => any | undefined
  getPaintProperty: (layerId: string, name: string) => any | undefined
  getLayoutProperty: (layerId: string, name: string) => any | undefined
  getSource: (sourceId: string) => any | undefined
  triggerRepaint: () => void
  project: (lnglat: LngLatLike) => Point | undefined
  unproject: (point: Point) => LngLat | undefined
  queryRenderedFeatures: (
    point: PointLike | [PointLike, PointLike] | QueryRenderedFeaturesOptions | undefined,
    options?: QueryRenderedFeaturesOptions | undefined
  ) => MapGeoJSONFeature[]
  querySourceFeatures: (
    sourceID: string,
    options?: QuerySourceFeatureOptions | null | undefined
  ) => MapGeoJSONFeature[]
  queryTerrainElevation: (
    lnglat: LngLatLike,
    options: { exaggerated: boolean }
  ) => number | null | undefined
  isStyleLoaded: () => void | boolean
  isMoving: () => boolean | undefined
  isZooming: () => boolean | undefined
  isRotating: () => boolean | undefined
  isEasing: () => boolean | undefined
  resize: () => void
  remove: () => void
  setFeatureState: (
    options: {
      id: number | string
      source: string
      sourceLayer?: string
    },
    state: Record<string, any>
  ) => void
  removeFeatureState: (
    options: {
      id: number | string
      source: string
      sourceLayer?: string
    },
    key: string
  ) => void
  getFeatureState: (options: {
    id: number | string
    source: string
    sourceLayer?: string
  }) => Record<string, any> | undefined
  setPadding: (padding: PaddingOptions) => void
}

export interface GeolocateSuccess {
  coords: GeolocationCoordinates
  target: GeolocateControl & { _watchState: string }
  timestamp: number
}

export interface GeolocateEventTypes {
  geolocate: GeolocateSuccess
  error: GeolocationPositionError
  outofmaxbounds: GeolocateSuccess
  trackuserlocationstart: GeolocateSuccess
  trackuserlocationend: GeolocateSuccess
}

export type MapboxGeoJSONFeature = GeoJSON.Feature<GeoJSON.Geometry> & {
  layer: LayerSpecification
  source: string
  sourceLayer: string
  state: { [key: string]: any }
}

export interface MapboxOptionsConfig {
  showPlaceLabels?: boolean
  showRoadLabels?: boolean
  showPointOfInterestLabels?: boolean
  showBuildingLabels?: boolean
  lightPreset?: string
  font?: string
  [propName: string]: any
}

export interface MapboxOptions {
  config?: {
    [propName: string]: MapboxOptionsConfig
  }
}

export type AnySourceImpl =
  | GeoJSONSource
  | VideoSource
  | ImageSource
  | CanvasSource
  | VectorSourceOptions

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

type Visibility = 'visible' | 'none'

export interface Layout {
  visibility?: Visibility | undefined
}

export interface BackgroundLayout extends Layout {}

export interface Transition {
  delay?: number | undefined
  duration?: number | undefined
}

export interface BackgroundPaint {
  'background-color'?: PropertyValueSpecification<ColorSpecification>
  'background-pattern'?: PropertyValueSpecification<ResolvedImageSpecification>
  'background-opacity'?: PropertyValueSpecification<number>
}

export type BackgroundLayerStyle = BackgroundLayout & BackgroundPaint

export interface CircleLayout extends Layout {
  'circle-sort-key'?: DataDrivenPropertyValueSpecification<number>
}

export interface CirclePaint {
  'circle-radius'?: DataDrivenPropertyValueSpecification<number>
  'circle-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>
  'circle-blur'?: DataDrivenPropertyValueSpecification<number>
  'circle-opacity'?: DataDrivenPropertyValueSpecification<number>
  'circle-translate'?: PropertyValueSpecification<[number, number]>
  'circle-translate-anchor'?: PropertyValueSpecification<'map' | 'viewport'>
  'circle-pitch-scale'?: PropertyValueSpecification<'map' | 'viewport'>
  'circle-pitch-alignment'?: PropertyValueSpecification<'map' | 'viewport'>
  'circle-stroke-width'?: DataDrivenPropertyValueSpecification<number>
  'circle-stroke-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>
  'circle-stroke-opacity'?: DataDrivenPropertyValueSpecification<number>
}

export type CircleLayerStyle = CircleLayout & CirclePaint

export interface FillExtrusionLayout extends Layout {}

export interface FillExtrusionPaint {
  'fill-extrusion-opacity'?: PropertyValueSpecification<number>
  'fill-extrusion-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>
  'fill-extrusion-translate'?: PropertyValueSpecification<[number, number]>
  'fill-extrusion-translate-anchor'?: PropertyValueSpecification<'map' | 'viewport'>
  'fill-extrusion-pattern'?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>
  'fill-extrusion-height'?: DataDrivenPropertyValueSpecification<number>
  'fill-extrusion-base'?: DataDrivenPropertyValueSpecification<number>
  'fill-extrusion-vertical-gradient'?: PropertyValueSpecification<boolean>
}

export type FillExtrusionLayerStyle = FillExtrusionLayout & FillExtrusionPaint

export interface FillLayout extends Layout {
  'fill-sort-key'?: DataDrivenPropertyValueSpecification<number>
}

export interface FillPaint {
  'fill-antialias'?: PropertyValueSpecification<boolean>
  'fill-opacity'?: DataDrivenPropertyValueSpecification<number>
  'fill-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>
  'fill-outline-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>
  'fill-translate'?: PropertyValueSpecification<[number, number]>
  'fill-translate-anchor'?: PropertyValueSpecification<'map' | 'viewport'>
  'fill-pattern'?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>
}

export type FillLayerStyle = FillLayout & FillPaint

export interface HeatmapLayout extends Layout {}

export interface HeatmapPaint {
  'heatmap-radius'?: DataDrivenPropertyValueSpecification<number>
  'heatmap-weight'?: DataDrivenPropertyValueSpecification<number>
  'heatmap-intensity'?: PropertyValueSpecification<number>
  'heatmap-color'?: ExpressionSpecification
  'heatmap-opacity'?: PropertyValueSpecification<number>
}

export type HeatmapLayerStyle = HeatmapLayout & HeatmapPaint

export interface HillshadeLayout extends Layout {}

export interface HillshadePaint {
  'hillshade-illumination-direction'?: PropertyValueSpecification<number>
  'hillshade-illumination-anchor'?: PropertyValueSpecification<'map' | 'viewport'>
  'hillshade-exaggeration'?: PropertyValueSpecification<number>
  'hillshade-shadow-color'?: PropertyValueSpecification<ColorSpecification>
  'hillshade-highlight-color'?: PropertyValueSpecification<ColorSpecification>
  'hillshade-accent-color'?: PropertyValueSpecification<ColorSpecification>
}

export type HillshadeLayerStyle = HillshadeLayout & HillshadePaint

export interface LineLayout extends Layout {
  'line-cap'?: PropertyValueSpecification<'butt' | 'round' | 'square'>
  'line-join'?: DataDrivenPropertyValueSpecification<'bevel' | 'round' | 'miter'>
  'line-miter-limit'?: PropertyValueSpecification<number>
  'line-round-limit'?: PropertyValueSpecification<number>
  'line-sort-key'?: DataDrivenPropertyValueSpecification<number>
}

export interface LinePaint {
  'line-opacity'?: DataDrivenPropertyValueSpecification<number>
  'line-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>
  'line-translate'?: PropertyValueSpecification<[number, number]>
  'line-translate-anchor'?: PropertyValueSpecification<'map' | 'viewport'>
  'line-width'?: DataDrivenPropertyValueSpecification<number>
  'line-gap-width'?: DataDrivenPropertyValueSpecification<number>
  'line-offset'?: DataDrivenPropertyValueSpecification<number>
  'line-blur'?: DataDrivenPropertyValueSpecification<number>
  'line-dasharray'?: PropertyValueSpecification<Array<number>>
  'line-pattern'?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>
  'line-gradient'?: ExpressionSpecification
}

export type LineLayerStyle = LineLayout & LinePaint

export interface RasterLayout extends Layout {}

export interface RasterPaint {
  'raster-opacity'?: PropertyValueSpecification<number>
  'raster-hue-rotate'?: PropertyValueSpecification<number>
  'raster-brightness-min'?: PropertyValueSpecification<number>
  'raster-brightness-max'?: PropertyValueSpecification<number>
  'raster-saturation'?: PropertyValueSpecification<number>
  'raster-contrast'?: PropertyValueSpecification<number>
  'raster-resampling'?: PropertyValueSpecification<'linear' | 'nearest'>
  'raster-fade-duration'?: PropertyValueSpecification<number>
}

export type RasterLayerStyle = RasterLayout & RasterPaint

export interface SymbolLayout extends Layout {
  'symbol-placement'?: PropertyValueSpecification<'point' | 'line' | 'line-center'>
  'symbol-spacing'?: PropertyValueSpecification<number>
  'symbol-avoid-edges'?: PropertyValueSpecification<boolean>
  'symbol-sort-key'?: DataDrivenPropertyValueSpecification<number>
  'symbol-z-order'?: PropertyValueSpecification<'auto' | 'viewport-y' | 'source'>
  'icon-allow-overlap'?: PropertyValueSpecification<boolean>
  'icon-overlap'?: PropertyValueSpecification<'never' | 'always' | 'cooperative'>
  'icon-ignore-placement'?: PropertyValueSpecification<boolean>
  'icon-optional'?: PropertyValueSpecification<boolean>
  'icon-rotation-alignment'?: PropertyValueSpecification<'map' | 'viewport' | 'auto'>
  'icon-size'?: DataDrivenPropertyValueSpecification<number>
  'icon-text-fit'?: PropertyValueSpecification<'none' | 'width' | 'height' | 'both'>
  'icon-text-fit-padding'?: PropertyValueSpecification<[number, number, number, number]>
  'icon-image'?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>
  'icon-rotate'?: DataDrivenPropertyValueSpecification<number>
  'icon-padding'?: DataDrivenPropertyValueSpecification<PaddingSpecification>
  'icon-keep-upright'?: PropertyValueSpecification<boolean>
  'icon-offset'?: DataDrivenPropertyValueSpecification<[number, number]>
  'icon-anchor'?: DataDrivenPropertyValueSpecification<
    | 'center'
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
  >
  'icon-pitch-alignment'?: PropertyValueSpecification<'map' | 'viewport' | 'auto'>
  'text-pitch-alignment'?: PropertyValueSpecification<'map' | 'viewport' | 'auto'>
  'text-rotation-alignment'?: PropertyValueSpecification<
    'map' | 'viewport' | 'viewport-glyph' | 'auto'
  >
  'text-field'?: DataDrivenPropertyValueSpecification<FormattedSpecification>
  'text-font'?: DataDrivenPropertyValueSpecification<Array<string>>
  'text-size'?: DataDrivenPropertyValueSpecification<number>
  'text-max-width'?: DataDrivenPropertyValueSpecification<number>
  'text-line-height'?: PropertyValueSpecification<number>
  'text-letter-spacing'?: DataDrivenPropertyValueSpecification<number>
  'text-justify'?: DataDrivenPropertyValueSpecification<'auto' | 'left' | 'center' | 'right'>
  'text-radial-offset'?: DataDrivenPropertyValueSpecification<number>
  'text-variable-anchor'?: PropertyValueSpecification<
    Array<
      | 'center'
      | 'left'
      | 'right'
      | 'top'
      | 'bottom'
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right'
    >
  >
  'text-variable-anchor-offset'?: DataDrivenPropertyValueSpecification<VariableAnchorOffsetCollectionSpecification>
  'text-anchor'?: DataDrivenPropertyValueSpecification<
    | 'center'
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
  >
  'text-max-angle'?: PropertyValueSpecification<number>
  'text-writing-mode'?: PropertyValueSpecification<Array<'horizontal' | 'vertical'>>
  'text-rotate'?: DataDrivenPropertyValueSpecification<number>
  'text-padding'?: PropertyValueSpecification<number>
  'text-keep-upright'?: PropertyValueSpecification<boolean>
  'text-transform'?: DataDrivenPropertyValueSpecification<'none' | 'uppercase' | 'lowercase'>
  'text-offset'?: DataDrivenPropertyValueSpecification<[number, number]>
  'text-allow-overlap'?: PropertyValueSpecification<boolean>
  'text-overlap'?: PropertyValueSpecification<'never' | 'always' | 'cooperative'>
  'text-ignore-placement'?: PropertyValueSpecification<boolean>
  'text-optional'?: PropertyValueSpecification<boolean>
}

export interface SymbolPaint {
  'icon-opacity'?: DataDrivenPropertyValueSpecification<number>
  'icon-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>
  'icon-halo-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>
  'icon-halo-width'?: DataDrivenPropertyValueSpecification<number>
  'icon-halo-blur'?: DataDrivenPropertyValueSpecification<number>
  'icon-translate'?: PropertyValueSpecification<[number, number]>
  'icon-translate-anchor'?: PropertyValueSpecification<'map' | 'viewport'>
  'text-opacity'?: DataDrivenPropertyValueSpecification<number>
  'text-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>
  'text-halo-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>
  'text-halo-width'?: DataDrivenPropertyValueSpecification<number>
  'text-halo-blur'?: DataDrivenPropertyValueSpecification<number>
  'text-translate'?: PropertyValueSpecification<[number, number]>
  'text-translate-anchor'?: PropertyValueSpecification<'map' | 'viewport'>
}

export type SymbolLayerStyle = SymbolLayout & SymbolPaint

export type AnyLayout =
  | BackgroundLayout
  | FillLayout
  | FillExtrusionLayout
  | LineLayout
  | SymbolLayout
  | RasterLayout
  | CircleLayout
  | HeatmapLayout
  | HillshadeLayout

export type AnyPaint =
  | BackgroundPaint
  | FillPaint
  | FillExtrusionPaint
  | LinePaint
  | SymbolPaint
  | RasterPaint
  | CirclePaint
  | HeatmapPaint
  | HillshadePaint

export type ImageDatas =
  | HTMLImageElement
  | ImageBitmap
  | ImageData
  | { width: number; height: number; data: Uint8Array | Uint8ClampedArray }
  | StyleImageInterface
export interface ImageOptions {
  pixelRatio?: number | undefined
  sdf?: boolean | undefined
  stretchX?: [number, number][]
  stretchY?: [number, number][]
  content?: [number, number, number, number]
}

export interface ImageSourceOptions {
  url?: string | undefined
  coordinates?: number[][] | undefined
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

export interface MapEventTypes extends MapEventType {
  styleimagemissing: MapStyleImageMissingEvent
  preclick: MapMouseEvent
  mouseleave: MapMouseEvent
  mouseenter: MapMouseEvent
}
