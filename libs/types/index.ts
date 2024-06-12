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
  visibility?: Visibility | undefined;
}

export type Expression = [ExpressionSpecification, ...any[]];
export interface StyleFunction {
  stops?: any[][] | undefined;
  property?: string | undefined;
  base?: number | undefined;
  type?: 'identity' | 'exponential' | 'interval' | 'categorical' | undefined;
  default?: any;
  colorSpace?: 'rgb' | 'lab' | 'hcl' | undefined;
}
export interface FillLayout extends Layout {
  'fill-sort-key'?: number | Expression | undefined;
}

export interface FillPaint {
  'fill-antialias'?: boolean | Expression | undefined;
  'fill-opacity'?: number | StyleFunction | Expression | undefined;
  'fill-color'?: string | StyleFunction | Expression | undefined;
  'fill-outline-color'?: string | StyleFunction | Expression | undefined;
  'fill-translate'?: number[] | undefined;
  'fill-translate-anchor'?: 'map' | 'viewport' | undefined;
  'fill-pattern'?: string | Expression | undefined;
}

export type FillLayerStyle = FillLayout & FillPaint;

export interface CircleLayout extends Layout {
  'circle-sort-key'?: number | Expression | undefined;
}

export interface CirclePaint {
  'circle-radius'?: number | StyleFunction | Expression | undefined;
  'circle-color'?: string | StyleFunction | Expression | undefined;
  'circle-blur'?: number | StyleFunction | Expression | undefined;
  'circle-opacity'?: number | StyleFunction | Expression | undefined;
  'circle-translate'?: number[] | Expression | undefined;
  'circle-translate-anchor'?: 'map' | 'viewport' | undefined;
  'circle-pitch-scale'?: 'map' | 'viewport' | undefined;
  'circle-pitch-alignment'?: 'map' | 'viewport' | undefined;
  'circle-stroke-width'?: number | StyleFunction | Expression | undefined;
  'circle-stroke-color'?: string | StyleFunction | Expression | undefined;
  'circle-stroke-opacity'?: number | StyleFunction | Expression | undefined;
}

export type CircleLayerStyle = CircleLayout & CirclePaint;

export interface LineLayout extends Layout {
  'line-cap'?: 'butt' | 'round' | 'square' | Expression | undefined;
  'line-join'?: 'bevel' | 'round' | 'miter' | Expression | undefined;
  'line-miter-limit'?: number | Expression | undefined;
  'line-round-limit'?: number | Expression | undefined;
  'line-sort-key'?: number | Expression | undefined;
}

export interface LinePaint {
  'line-opacity'?: number | StyleFunction | Expression | undefined;
  'line-color'?: string | StyleFunction | Expression | undefined;
  'line-translate'?: number[] | Expression | undefined;
  'line-translate-anchor'?: 'map' | 'viewport' | undefined;
  'line-width'?: number | StyleFunction | Expression | undefined;
  'line-gap-width'?: number | StyleFunction | Expression | undefined;
  'line-offset'?: number | StyleFunction | Expression | undefined;
  'line-blur'?: number | StyleFunction | Expression | undefined;
  'line-dasharray'?: number[] | Expression | undefined;
  'line-pattern'?: string | Expression | undefined;
  'line-gradient'?: Expression | undefined;
}

export type LineLayerStyle = LineLayout & LinePaint;

export type AnyLayout = FillLayout | CircleLayout | LineLayout;

export type AnyPaint = FillPaint | CirclePaint | LinePaint;
