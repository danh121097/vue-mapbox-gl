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
import type { MapCreationStatus } from '@libs/enums';

export type Nullable<T> = T | null;

export type Undefinedable<T> = T | undefined;

export interface CreateMaplibreActions {
  mapInstance: ComputedRef<Map | null>;
  mapCreationStatus: MapCreationStatus;
  isMapReady: boolean;
  isMapLoading: boolean;
  hasMapError: boolean;
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
  ) => any[] | undefined;
  querySourceFeatures: (
    sourceID: string,
    options?: QuerySourceFeatureOptions,
  ) => any[] | undefined;
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

// Use any for expressions to avoid type conflicts
export type Expressions = any;
export interface StyleFunction {
  stops?: any[][];
  property?: string;
  base?: number;
  type?: 'identity' | 'exponential' | 'interval' | 'categorical';
  default?: any;
  colorSpace?: 'rgb' | 'lab' | 'hcl';
}
export interface FillLayout extends Layout {
  'fill-sort-key'?: number | Expressions | undefined;
}

export interface FillPaint {
  'fill-antialias'?: boolean | Expressions | undefined;
  'fill-opacity'?: number | StyleFunction | Expressions | undefined;
  'fill-color'?: string | StyleFunction | Expressions | undefined;
  'fill-outline-color'?: string | StyleFunction | Expressions | undefined;
  'fill-translate'?: any;
  'fill-translate-anchor'?: any;
  'fill-pattern'?: string | Expressions | undefined;
}

export type FillLayerStyle = FillLayout & FillPaint;

export interface CircleLayout extends Layout {
  'circle-sort-key'?: number | Expressions | undefined;
}

export interface CirclePaint {
  'circle-radius'?: number | StyleFunction | Expressions | undefined;
  'circle-color'?: string | StyleFunction | Expressions | undefined;
  'circle-blur'?: number | StyleFunction | Expressions | undefined;
  'circle-opacity'?: number | StyleFunction | Expressions | undefined;
  'circle-translate'?: any;
  'circle-translate-anchor'?: any;
  'circle-pitch-scale'?: any;
  'circle-pitch-alignment'?: any;
  'circle-stroke-width'?: number | StyleFunction | Expressions | undefined;
  'circle-stroke-color'?: string | StyleFunction | Expressions | undefined;
  'circle-stroke-opacity'?: number | StyleFunction | Expressions | undefined;
}

export type CircleLayerStyle = CircleLayout & CirclePaint;

export interface LineLayout extends Layout {
  'line-cap'?: 'butt' | 'round' | 'square' | Expressions | undefined;
  'line-join'?: 'bevel' | 'round' | 'miter' | Expressions | undefined;
  'line-miter-limit'?: number | Expressions | undefined;
  'line-round-limit'?: number | Expressions | undefined;
  'line-sort-key'?: number | Expressions | undefined;
}

export interface LinePaint {
  'line-opacity'?: number | StyleFunction | Expressions | undefined;
  'line-color'?: string | StyleFunction | Expressions | undefined;
  'line-translate'?: any;
  'line-translate-anchor'?: any;
  'line-width'?: number | StyleFunction | Expressions | undefined;
  'line-gap-width'?: number | StyleFunction | Expressions | undefined;
  'line-offset'?: number | StyleFunction | Expressions | undefined;
  'line-blur'?: number | StyleFunction | Expressions | undefined;
  'line-dasharray'?: number[] | Expressions | undefined;
  'line-pattern'?: string | Expressions | undefined;
  'line-gradient'?: Expressions | undefined;
}

export type LineLayerStyle = LineLayout & LinePaint;

export interface SymbolLayout extends Layout {
  'symbol-placement'?: 'point' | 'line' | 'line-center' | undefined;
  'symbol-spacing'?: number | Expressions | undefined;
  'symbol-avoid-edges'?: boolean | undefined;
  'symbol-sort-key'?: number | Expressions | undefined;
  'symbol-z-order'?: 'auto' | 'viewport-y' | 'source' | undefined;
  'icon-allow-overlap'?: boolean | StyleFunction | Expressions | undefined;
  'icon-overlap'?: 'never' | 'always' | 'cooperative' | undefined;
  'icon-ignore-placement'?: boolean | Expressions | undefined;
  'icon-optional'?: boolean | undefined;
  'icon-rotation-alignment'?: 'map' | 'viewport' | 'auto' | undefined;
  'icon-size'?: number | StyleFunction | Expressions | undefined;
  'icon-text-fit'?: 'none' | 'width' | 'height' | 'both' | undefined;
  'icon-text-fit-padding'?: number[] | Expressions | undefined;
  'icon-image'?: string | StyleFunction | Expressions | undefined;
  'icon-rotate'?: number | StyleFunction | Expressions | undefined;
  'icon-padding'?: number | Expressions | undefined;
  'icon-keep-upright'?: boolean | undefined;
  'icon-offset'?: number[] | StyleFunction | Expressions | undefined;
  'icon-anchor'?: Anchor | undefined;
  'icon-pitch-alignment'?: 'map' | 'viewport' | 'auto' | undefined;
  'text-pitch-alignment'?: 'map' | 'viewport' | 'auto' | undefined;
  'text-rotation-alignment'?:
    | 'map'
    | 'viewport'
    | 'viewport-glyph'
    | 'auto'
    | undefined;
  'text-field'?: string | StyleFunction | Expressions | undefined;
  'text-font'?: string[] | Expressions | undefined;
  'text-size'?: number | StyleFunction | Expressions | undefined;
  'text-max-width'?: number | StyleFunction | Expressions | undefined;
  'text-line-height'?: number | Expressions | undefined;
  'text-letter-spacing'?: number | Expressions | undefined;
  'text-justify'?: 'auto' | 'left' | 'center' | 'right' | undefined;
  'text-radial-offset'?: number | Expressions | undefined;
  'text-variable-anchor'?: Anchor[] | undefined;
  'text-variable-anchor-offset'?: Array<string | [number, number]> | undefined;
  'text-anchor'?: Anchor | undefined;
  'text-max-angle'?: number | Expressions | undefined;
  'text-writing-mode'?: Array<'horizontal' | 'vertical'> | undefined;
  'text-rotate'?: number | StyleFunction | Expressions | undefined;
  'text-padding'?: number | Expressions | undefined;
  'text-keep-upright'?: boolean | undefined;
  'text-transform'?:
    | 'none'
    | 'uppercase'
    | 'lowercase'
    | StyleFunction
    | Expressions
    | undefined;
  'text-offset'?: number[] | Expressions | undefined;
  'text-allow-overlap'?: boolean | undefined;
  'text-overlap'?: 'never' | 'always' | 'cooperative' | undefined;
  'text-ignore-placement'?: boolean | undefined;
  'text-optional'?: boolean | undefined;
}

export interface SymbolPaint {
  'icon-opacity'?: number | StyleFunction | Expressions | undefined;
  'icon-color'?: string | StyleFunction | Expressions | undefined;
  'icon-halo-color'?: string | StyleFunction | Expressions | undefined;
  'icon-halo-width'?: number | StyleFunction | Expressions | undefined;
  'icon-halo-blur'?: number | StyleFunction | Expressions | undefined;
  'icon-translate'?: any;
  'icon-translate-anchor'?: any;
  'text-opacity'?: number | StyleFunction | Expressions | undefined;
  'text-color'?: string | StyleFunction | Expressions | undefined;
  'text-halo-color'?: string | StyleFunction | Expressions | undefined;
  'text-halo-width'?: number | StyleFunction | Expressions | undefined;
  'text-halo-blur'?: number | StyleFunction | Expressions | undefined;
  'text-translate'?: any;
  'text-translate-anchor'?: any;
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
