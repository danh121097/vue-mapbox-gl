import type { MapboxStatus } from '@libs/enums';
import type { ComputedRef } from 'vue';
import type {
  FeatureIdentifier,
  FilterSpecification,
  GeolocateControl,
  LayerSpecification,
  LngLat,
  LngLatBoundsLike,
  LngLatLike,
  Map,
  MapEventType,
  MapGeoJSONFeature,
  MapOptions,
  PaddingOptions,
  Point,
  PointLike,
  QueryRenderedFeaturesOptions,
  QuerySourceFeatureOptions,
  StyleImageInterface,
  StyleSetterOptions,
  StyleSpecification,
} from 'maplibre-gl';

export type Nullable<T> = T | null;

export type Undefinedable<T> = T | undefined;

export interface CreateMaplibreActions {
  mapInstance: ComputedRef<Map | null>;
  mapStatus: ComputedRef<MapboxStatus>;
  setStyle: (style: string | StyleSpecification) => void;
  setCenter: (center: LngLatLike) => void;
  setBearing: (bearing: number) => void;
  setZoom: (zoom: number) => void;
  setMinZoom: (zoom: number) => void;
  setMaxZoom: (zoom: number) => void;
  setPitch: (pitch: number) => void;
  setMinPitch: (pitch: number) => void;
  setMaxPitch: (pitch: number) => void;
  setMaxBounds: (bounds: LngLatBoundsLike) => void;
  setRenderWorldCopies: (renderWorldCopies: boolean) => void;
}

export type MaplibreActions = CreateMaplibreActions & {
  setMapOptions: (options: Partial<MapOptions>) => void;
};

export type MaplibreMethods = CreateMaplibreActions & {
  getContainer: () => HTMLElement | undefined;
  getCanvasContainer: () => HTMLElement | undefined;
  getCanvas: () => HTMLCanvasElement | undefined;
  getStyle: () => StyleSpecification | undefined;
  getBounds: () => LngLatBoundsLike | undefined;
  getCenter: () => LngLatLike | undefined;
  getZoom: () => number | undefined;
  getBearing: () => number | undefined;
  getPadding: () => PaddingOptions | undefined;
  getPitch: () => number | undefined;
  getMinZoom: () => number | undefined;
  getMaxZoom: () => number | undefined;
  getMinPitch: () => number | undefined;
  getMaxPitch: () => number | undefined;
  getFilter: (layerId: string) => void | FilterSpecification;
  getLayer: (layerId: string) => any | undefined;
  getPaintProperty: (layerId: string, name: string) => any | undefined;
  getLayoutProperty: (layerId: string, name: string) => any | undefined;
  getSource: (sourceId: string) => any | undefined;
  triggerRepaint: () => void;
  project: (lnglat: LngLatLike) => Point | undefined;
  unproject: (point: Point) => LngLat | undefined;
  queryRenderedFeatures: (
    point: PointLike | [PointLike, PointLike],
    options?: QueryRenderedFeaturesOptions,
  ) => MapGeoJSONFeature[] | undefined;
  querySourceFeatures: (
    sourceID: string,
    options?: QuerySourceFeatureOptions,
  ) => MapGeoJSONFeature[] | undefined;
  queryTerrainElevation: (lnglat: LngLatLike) => number | null | undefined;
  isStyleLoaded: () => boolean | void;
  isMoving: () => boolean | undefined;
  isZooming: () => boolean | undefined;
  isRotating: () => boolean | undefined;
  isEasing: () => boolean | undefined;
  resize: () => void;
  remove: () => void;
  setFeatureState: (
    options: FeatureIdentifier,
    state: Record<string, any>,
  ) => void;
  removeFeatureState: (options: FeatureIdentifier, key: string) => void;
  getFeatureState: (
    options: FeatureIdentifier,
  ) => Record<string, any> | undefined;
  setPadding: (padding: PaddingOptions) => void;
};

export interface MapEventTypes extends MapEventType {}

export interface GeolocationPositionError {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}

export interface GeolocateSuccess {
  coords: GeolocationCoordinates;
  target: GeolocateControl;
  timestamp: number;
}

export interface GeolocateEventTypes {
  geolocate: GeolocateSuccess;
  error: GeolocationPositionError;
  outofmaxbounds: GeolocateSuccess;
  trackuserlocationstart: GeolocateSuccess;
  trackuserlocationend: GeolocateSuccess;
}

export type LayerTypes =
  | 'fill'
  | 'line'
  | 'symbol'
  | 'circle'
  | 'heatmap'
  | 'fill-extrusion'
  | 'raster'
  | 'hillshade'
  | 'background';

export type Anchor =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface CreateBaseLayerActions<Layer extends LayerSpecification> {
  layerId: string;
  getLayer: ComputedRef<Nullable<Layer>>;
  setBeforeId: (beforeId?: string) => void;
  setFilter: (filter?: FilterSpecification) => void;
  setPaintProperty: (
    name: string,
    value: any,
    options?: StyleSetterOptions,
  ) => void;
  setLayoutProperty: (
    name: string,
    value: any,
    options?: StyleSetterOptions,
  ) => void;
  setZoomRange: (minzoom?: number, maxzoom?: number) => void;
  removeLayer: () => void;
}

export interface CreateLayerActions<Layer extends LayerSpecification>
  extends CreateBaseLayerActions<Layer> {
  setStyle: (styleVal: AnyLayout & AnyPaint) => void;
}

export type Visibility = 'visible' | 'none';

export interface Layout {
  visibility?: Visibility;
}

export type ExpressionsName =
  // Types
  | 'array'
  | 'boolean'
  | 'collator'
  | 'format'
  | 'literal'
  | 'number'
  | 'number-format'
  | 'object'
  | 'string'
  | 'image'
  | 'to-boolean'
  | 'to-color'
  | 'to-number'
  | 'to-string'
  | 'typeof'
  // Feature data
  | 'feature-state'
  | 'geometry-type'
  | 'id'
  | 'line-progress'
  | 'properties'
  // Lookup
  | 'at'
  | 'get'
  | 'has'
  | 'in'
  | 'index-of'
  | 'length'
  | 'slice'
  | 'config'
  // Decision
  | '!'
  | '!='
  | '<'
  | '<='
  | '=='
  | '>'
  | '>='
  | 'all'
  | 'any'
  | 'case'
  | 'match'
  | 'coalesce'
  | 'within'
  // Ramps, scales, curves
  | 'interpolate'
  | 'interpolate-hcl'
  | 'interpolate-lab'
  | 'step'
  // Variable binding
  | 'let'
  | 'var'
  // String
  | 'concat'
  | 'downcase'
  | 'is-supported-script'
  | 'resolved-locale'
  | 'upcase'
  // Color
  | 'hsl'
  | 'hsla'
  | 'rgb'
  | 'rgba'
  | 'to-rgba'
  // Math
  | '-'
  | '*'
  | '/'
  | '%'
  | '^'
  | '+'
  | 'abs'
  | 'acos'
  | 'asin'
  | 'atan'
  | 'ceil'
  | 'cos'
  | 'distance'
  | 'e'
  | 'floor'
  | 'ln'
  | 'ln2'
  | 'log10'
  | 'log2'
  | 'max'
  | 'min'
  | 'pi'
  | 'random'
  | 'round'
  | 'sin'
  | 'sqrt'
  | 'tan'
  // Camera
  | 'distance-from-center'
  | 'pitch'
  | 'zoom'
  | 'raster-value'
  // Lights
  | 'measure-light'
  // Heatmap
  | 'heatmap-density';

export type Expressions = [ExpressionsName, ...any[]];
export interface StyleFunction {
  stops?: any[][];
  property?: string;
  base?: number;
  type?: 'identity' | 'exponential' | 'interval' | 'categorical';
  default?: any;
  colorSpace?: 'rgb' | 'lab' | 'hcl';
}
export interface FillLayout extends Layout {
  'fill-sort-key'?: number | Expressions;
}

export interface FillPaint {
  'fill-antialias'?: boolean | Expressions;
  'fill-opacity'?: number | StyleFunction | Expressions;
  'fill-color'?: string | StyleFunction | Expressions;
  'fill-outline-color'?: string | StyleFunction | Expressions;
  'fill-translate'?: number[];
  'fill-translate-anchor'?: 'map' | 'viewport';
  'fill-pattern'?: string | Expressions;
}

export type FillLayerStyle = FillLayout & FillPaint;

export interface CircleLayout extends Layout {
  'circle-sort-key'?: number | Expressions;
}

export interface CirclePaint {
  'circle-radius'?: number | StyleFunction | Expressions;
  'circle-color'?: string | StyleFunction | Expressions;
  'circle-blur'?: number | StyleFunction | Expressions;
  'circle-opacity'?: number | StyleFunction | Expressions;
  'circle-translate'?: number[] | Expressions;
  'circle-translate-anchor'?: 'map' | 'viewport';
  'circle-pitch-scale'?: 'map' | 'viewport';
  'circle-pitch-alignment'?: 'map' | 'viewport';
  'circle-stroke-width'?: number | StyleFunction | Expressions;
  'circle-stroke-color'?: string | StyleFunction | Expressions;
  'circle-stroke-opacity'?: number | StyleFunction | Expressions;
}

export type CircleLayerStyle = CircleLayout & CirclePaint;

export interface LineLayout extends Layout {
  'line-cap'?: 'butt' | 'round' | 'square' | Expressions;
  'line-join'?: 'bevel' | 'round' | 'miter' | Expressions;
  'line-miter-limit'?: number | Expressions;
  'line-round-limit'?: number | Expressions;
  'line-sort-key'?: number | Expressions;
}

export interface LinePaint {
  'line-opacity'?: number | StyleFunction | Expressions;
  'line-color'?: string | StyleFunction | Expressions;
  'line-translate'?: number[] | Expressions;
  'line-translate-anchor'?: 'map' | 'viewport';
  'line-width'?: number | StyleFunction | Expressions;
  'line-gap-width'?: number | StyleFunction | Expressions;
  'line-offset'?: number | StyleFunction | Expressions;
  'line-blur'?: number | StyleFunction | Expressions;
  'line-dasharray'?: number[] | Expressions;
  'line-pattern'?: string | Expressions;
  'line-gradient'?: Expressions;
}

export type LineLayerStyle = LineLayout & LinePaint;

export interface SymbolLayout extends Layout {
  'symbol-placement'?: 'point' | 'line' | 'line-center';
  'symbol-spacing'?: number | Expressions;
  'symbol-avoid-edges'?: boolean;
  'symbol-sort-key'?: number | Expressions;
  'symbol-z-order'?: 'auto' | 'viewport-y' | 'source';
  'icon-allow-overlap'?: boolean | StyleFunction | Expressions;
  'icon-overlap'?: 'never' | 'always' | 'cooperative';
  'icon-ignore-placement'?: boolean | Expressions;
  'icon-optional'?: boolean;
  'icon-rotation-alignment'?: 'map' | 'viewport' | 'auto';
  'icon-size'?: number | StyleFunction | Expressions;
  'icon-text-fit'?: 'none' | 'width' | 'height' | 'both';
  'icon-text-fit-padding'?: number[] | Expressions;
  'icon-image'?: string | StyleFunction | Expressions;
  'icon-rotate'?: number | StyleFunction | Expressions;
  'icon-padding'?: number | Expressions;
  'icon-keep-upright'?: boolean;
  'icon-offset'?: number[] | StyleFunction | Expressions;
  'icon-anchor'?: Anchor;
  'icon-pitch-alignment'?: 'map' | 'viewport' | 'auto';
  'text-pitch-alignment'?: 'map' | 'viewport' | 'auto';
  'text-rotation-alignment'?: 'map' | 'viewport' | 'viewport-glyph' | 'auto';
  'text-field'?: string | StyleFunction | Expressions;
  'text-font'?: string[] | Expressions;
  'text-size'?: number | StyleFunction | Expressions;
  'text-max-width'?: number | StyleFunction | Expressions;
  'text-line-height'?: number | Expressions;
  'text-letter-spacing'?: number | Expressions;
  'text-justify'?: 'auto' | 'left' | 'center' | 'right';
  'text-radial-offset'?: number | Expressions;
  'text-variable-anchor'?: Anchor[];
  'text-variable-anchor-offset'?: Array<string | [number, number]>;
  'text-anchor'?: Anchor;
  'text-max-angle'?: number | Expressions;
  'text-writing-mode'?: Array<'horizontal' | 'vertical'>;
  'text-rotate'?: number | StyleFunction | Expressions;
  'text-padding'?: number | Expressions;
  'text-keep-upright'?: boolean;
  'text-transform'?:
    | 'none'
    | 'uppercase'
    | 'lowercase'
    | StyleFunction
    | Expressions;
  'text-offset'?: number[] | Expressions;
  'text-allow-overlap'?: boolean;
  'text-overlap'?: 'never' | 'always' | 'cooperative';
  'text-ignore-placement'?: boolean;
  'text-optional'?: boolean;
}

export interface SymbolPaint {
  'icon-opacity'?: number | StyleFunction | Expressions;
  'icon-color'?: string | StyleFunction | Expressions;
  'icon-halo-color'?: string | StyleFunction | Expressions;
  'icon-halo-width'?: number | StyleFunction | Expressions;
  'icon-halo-blur'?: number | StyleFunction | Expressions;
  'icon-translate'?: number[] | Expressions;
  'icon-translate-anchor'?: 'map' | 'viewport';
  'text-opacity'?: number | StyleFunction | Expressions;
  'text-color'?: string | StyleFunction | Expressions;
  'text-halo-color'?: string | StyleFunction | Expressions;
  'text-halo-width'?: number | StyleFunction | Expressions;
  'text-halo-blur'?: number | StyleFunction | Expressions;
  'text-translate'?: number[] | Expressions;
  'text-translate-anchor'?: 'map' | 'viewport';
}

export type SymbolLayerStyle = SymbolLayout & SymbolPaint;

export type AnyLayout = FillLayout | CircleLayout | LineLayout | SymbolLayout;

export type AnyPaint = FillPaint | CirclePaint | LinePaint | SymbolPaint;

export type ImageDatas =
  | HTMLImageElement
  | ImageBitmap
  | ImageData
  | {
      width: number;
      height: number;
      data: Uint8Array | Uint8ClampedArray;
    }
  | StyleImageInterface;
