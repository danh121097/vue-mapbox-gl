import type { MapboxStatus } from '@libs/enums';
import type { ComputedRef } from 'vue';
import type {
  ColorSpecification,
  DataDrivenPropertyValueSpecification,
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
  MapMouseEvent,
  MapOptions,
  MapStyleImageMissingEvent,
  PaddingOptions,
  Point,
  PointLike,
  PropertyValueSpecification,
  QueryRenderedFeaturesOptions,
  QuerySourceFeatureOptions,
  ResolvedImageSpecification,
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

export interface MapEventTypes extends MapEventType {
  styleimagemissing: MapStyleImageMissingEvent;
  preclick: MapMouseEvent;
  mouseleave: MapMouseEvent;
  mouseenter: MapMouseEvent;
}

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
  extends CreateBaseLayerActions<Layer> {}

export type Visibility = 'visible' | 'none';

export interface Layout {
  visibility?: Visibility | undefined;
}

export interface FillLayout extends Layout {
  'fill-sort-key'?: DataDrivenPropertyValueSpecification<number>;
}

export interface FillPaint {
  'fill-antialias'?: PropertyValueSpecification<boolean>;
  'fill-opacity'?: DataDrivenPropertyValueSpecification<number>;
  'fill-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>;
  'fill-outline-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>;
  'fill-translate'?: PropertyValueSpecification<[number, number]>;
  'fill-translate-anchor'?: PropertyValueSpecification<'map' | 'viewport'>;
  'fill-pattern'?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
}

export type FillLayerStyle = FillLayout & FillPaint;

export interface CircleLayout extends Layout {
  'circle-sort-key'?: DataDrivenPropertyValueSpecification<number>;
}

export interface CirclePaint {
  'circle-radius'?: DataDrivenPropertyValueSpecification<number>;
  'circle-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>;
  'circle-blur'?: DataDrivenPropertyValueSpecification<number>;
  'circle-opacity'?: DataDrivenPropertyValueSpecification<number>;
  'circle-translate'?: PropertyValueSpecification<[number, number]>;
  'circle-translate-anchor'?: PropertyValueSpecification<'map' | 'viewport'>;
  'circle-pitch-scale'?: PropertyValueSpecification<'map' | 'viewport'>;
  'circle-pitch-alignment'?: PropertyValueSpecification<'map' | 'viewport'>;
  'circle-stroke-width'?: DataDrivenPropertyValueSpecification<number>;
  'circle-stroke-color'?: DataDrivenPropertyValueSpecification<ColorSpecification>;
  'circle-stroke-opacity'?: DataDrivenPropertyValueSpecification<number>;
}

export type CircleLayerStyle = CircleLayout & CirclePaint;

export type AnyLayout = FillLayout | CircleLayout;

export type AnyPaint = FillPaint | CirclePaint;
