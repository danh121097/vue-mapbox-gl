import type { MapboxStatus } from '@libs/enums';
import type { ComputedRef } from 'vue';
import type {
  ColorSpecification,
  DataDrivenPropertyValueSpecification,
  FilterSpecification,
  GeolocateControl,
  LayerSpecification,
  LngLatBoundsLike,
  LngLatLike,
  Map,
  MapEventType,
  MapMouseEvent,
  MapOptions,
  MapStyleImageMissingEvent,
  PropertyValueSpecification,
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
  extends CreateBaseLayerActions<Layer> {
  setStyle: (styleVal: Layer['layout'] & Layer['paint']) => void;
}

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

export type AnyLayout = FillLayout;
