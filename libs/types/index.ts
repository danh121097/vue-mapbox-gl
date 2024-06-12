import type { MapboxStatus } from '@libs/enums';
import type { ComputedRef } from 'vue';
import type {
  ExpressionSpecification,
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

export type Expression = [ExpressionSpecification, ...any[]];
export interface StyleFunction {
  stops?: any[][];
  property?: string;
  base?: number;
  type?: 'identity' | 'exponential' | 'interval' | 'categorical';
  default?: any;
  colorSpace?: 'rgb' | 'lab' | 'hcl';
}
export interface FillLayout extends Layout {
  'fill-sort-key'?: number | Expression;
}

export interface FillPaint {
  'fill-antialias'?: boolean | Expression;
  'fill-opacity'?: number | StyleFunction | Expression;
  'fill-color'?: string | StyleFunction | Expression;
  'fill-outline-color'?: string | StyleFunction | Expression;
  'fill-translate'?: number[];
  'fill-translate-anchor'?: 'map' | 'viewport';
  'fill-pattern'?: string | Expression;
}

export type FillLayerStyle = FillLayout & FillPaint;

export interface CircleLayout extends Layout {
  'circle-sort-key'?: number | Expression;
}

export interface CirclePaint {
  'circle-radius'?: number | StyleFunction | Expression;
  'circle-color'?: string | StyleFunction | Expression;
  'circle-blur'?: number | StyleFunction | Expression;
  'circle-opacity'?: number | StyleFunction | Expression;
  'circle-translate'?: number[] | Expression;
  'circle-translate-anchor'?: 'map' | 'viewport';
  'circle-pitch-scale'?: 'map' | 'viewport';
  'circle-pitch-alignment'?: 'map' | 'viewport';
  'circle-stroke-width'?: number | StyleFunction | Expression;
  'circle-stroke-color'?: string | StyleFunction | Expression;
  'circle-stroke-opacity'?: number | StyleFunction | Expression;
}

export type CircleLayerStyle = CircleLayout & CirclePaint;

export interface LineLayout extends Layout {
  'line-cap'?: 'butt' | 'round' | 'square' | Expression;
  'line-join'?: 'bevel' | 'round' | 'miter' | Expression;
  'line-miter-limit'?: number | Expression;
  'line-round-limit'?: number | Expression;
  'line-sort-key'?: number | Expression;
}

export interface LinePaint {
  'line-opacity'?: number | StyleFunction | Expression;
  'line-color'?: string | StyleFunction | Expression;
  'line-translate'?: number[] | Expression;
  'line-translate-anchor'?: 'map' | 'viewport';
  'line-width'?: number | StyleFunction | Expression;
  'line-gap-width'?: number | StyleFunction | Expression;
  'line-offset'?: number | StyleFunction | Expression;
  'line-blur'?: number | StyleFunction | Expression;
  'line-dasharray'?: number[] | Expression;
  'line-pattern'?: string | Expression;
  'line-gradient'?: Expression;
}

export type LineLayerStyle = LineLayout & LinePaint;

export interface SymbolLayout extends Layout {
  'symbol-placement'?: 'point' | 'line' | 'line-center';
  'symbol-spacing'?: number | Expression;
  'symbol-avoid-edges'?: boolean;
  'symbol-sort-key'?: number | Expression;
  'symbol-z-order'?: 'auto' | 'viewport-y' | 'source';
  'icon-allow-overlap'?: boolean | StyleFunction | Expression;
  'icon-overlap'?: 'never' | 'always' | 'cooperative';
  'icon-ignore-placement'?: boolean | Expression;
  'icon-optional'?: boolean;
  'icon-rotation-alignment'?: 'map' | 'viewport' | 'auto';
  'icon-size'?: number | StyleFunction | Expression;
  'icon-text-fit'?: 'none' | 'width' | 'height' | 'both';
  'icon-text-fit-padding'?: number[] | Expression;
  'icon-image'?: string | StyleFunction | Expression;
  'icon-rotate'?: number | StyleFunction | Expression;
  'icon-padding'?: number | Expression;
  'icon-keep-upright'?: boolean;
  'icon-offset'?: number[] | StyleFunction | Expression;
  'icon-anchor'?: Anchor;
  'icon-pitch-alignment'?: 'map' | 'viewport' | 'auto';
  'text-pitch-alignment'?: 'map' | 'viewport' | 'auto';
  'text-rotation-alignment'?: 'map' | 'viewport' | 'viewport-glyph' | 'auto';
  'text-field'?: string | StyleFunction | Expression;
  'text-font'?: string[] | Expression;
  'text-size'?: number | StyleFunction | Expression;
  'text-max-width'?: number | StyleFunction | Expression;
  'text-line-height'?: number | Expression;
  'text-letter-spacing'?: number | Expression;
  'text-justify'?: 'auto' | 'left' | 'center' | 'right';
  'text-radial-offset'?: number | Expression;
  'text-variable-anchor'?: Anchor[];
  'text-variable-anchor-offset'?: Array<string | [number, number]>;
  'text-anchor'?: Anchor;
  'text-max-angle'?: number | Expression;
  'text-writing-mode'?: Array<'horizontal' | 'vertical'>;
  'text-rotate'?: number | StyleFunction | Expression;
  'text-padding'?: number | Expression;
  'text-keep-upright'?: boolean;
  'text-transform'?:
    | 'none'
    | 'uppercase'
    | 'lowercase'
    | StyleFunction
    | Expression;
  'text-offset'?: number[] | Expression;
  'text-allow-overlap'?: boolean;
  'text-overlap'?: 'never' | 'always' | 'cooperative';
  'text-ignore-placement'?: boolean;
  'text-optional'?: boolean;
}

export interface SymbolPaint {
  'icon-opacity'?: number | StyleFunction | Expression;
  'icon-color'?: string | StyleFunction | Expression;
  'icon-halo-color'?: string | StyleFunction | Expression;
  'icon-halo-width'?: number | StyleFunction | Expression;
  'icon-halo-blur'?: number | StyleFunction | Expression;
  'icon-translate'?: number[] | Expression;
  'icon-translate-anchor'?: 'map' | 'viewport';
  'text-opacity'?: number | StyleFunction | Expression;
  'text-color'?: string | StyleFunction | Expression;
  'text-halo-color'?: string | StyleFunction | Expression;
  'text-halo-width'?: number | StyleFunction | Expression;
  'text-halo-blur'?: number | StyleFunction | Expression;
  'text-translate'?: number[] | Expression;
  'text-translate-anchor'?: 'map' | 'viewport';
}

export type SymbolLayerStyle = SymbolLayout & SymbolPaint;

export type AnyLayout = FillLayout | CircleLayout | LineLayout | SymbolLayout;

export type AnyPaint = FillPaint | CirclePaint | LinePaint | SymbolPaint;
