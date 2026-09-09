# Types API Reference

Vue3 MapLibre GL provides comprehensive TypeScript support with well-defined types and interfaces for all components and composables.

## Core Types

### MaplibreActions

Enhanced actions interface for map management with additional utility methods.

```typescript
type MaplibreActions = CreateMaplibreActions & {
  setMapOptions: (options: Partial<MapOptions>) => void;
};
```

### CreateMaplibreActions

Core actions interface for basic map operations.

```typescript
interface CreateMaplibreActions {
  mapInstance: ComputedRef<Map | null>;
  mapCreationStatus: ComputedRef<MapCreationStatus>;
  isMapReady: ComputedRef<boolean>;
  isMapLoading: ComputedRef<boolean>;
  hasMapError: ComputedRef<boolean>;
  setCenter: (center: LngLatLike) => void;
  setBearing: (bearing: number) => void;
  setZoom: (zoom: number) => void;
  setPitch: (pitch: number) => void;
  setStyle: (style: StyleSpecification | string) => void;
  setMaxBounds: (bounds: LngLatBoundsLike) => void;
  setMaxPitch: (pitch: number) => void;
  setMaxZoom: (zoom: number) => void;
  setMinPitch: (pitch: number) => void;
  setMinZoom: (zoom: number) => void;
  setRenderWorldCopies: (render: boolean) => void;
}
```

### MaplibreMethods

Everything [`CreateMaplibreActions`](#createmaplibreactions) has, plus the map's
accessors and the remaining setters. [`useMaplibre`](/api/composables#usemaplibre)
spreads this in, so the composable's return carries each of these; every one of
them no-ops while no map is registered, which is why the accessors return
`undefined` rather than throwing.

```typescript
type MaplibreMethods = CreateMaplibreActions & {
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
```

### CreateGeoJsonSourceActions

Actions interface for GeoJSON source management.

```typescript
interface CreateGeoJsonSourceActions {
  sourceId: string;
  getSource: ShallowRef<GeoJSONSource | null>;
  setData: (data: GeoJSONSourceSpecification['data']) => void;
  removeSource: () => void;
  refreshSource: () => void;
  sourceStatus: ComputedRef<SourceStatus>;
  isSourceReady: ComputedRef<boolean>;
}
```

### CreateLayerActions

Generic actions interface for layer management.

```typescript
interface CreateBaseLayerActions<Layer extends LayerSpecification> {
  layerId: string;
  getLayer: ComputedRef<Layer | null>;
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

interface CreateLayerActions<Layer extends LayerSpecification>
  extends CreateBaseLayerActions<Layer> {
  setStyle: (styleVal: AnyLayout & AnyPaint) => void;
}
```

## Layer Style Types

### FillLayerStyle

Style configuration for fill layers.

```typescript
interface FillLayerStyle {
  'fill-antialias'?: boolean;
  'fill-color'?: string | Expressions;
  'fill-opacity'?: number | Expressions;
  'fill-outline-color'?: string | Expressions;
  'fill-pattern'?: string | Expressions;
  'fill-translate'?: [number, number] | Expressions;
  'fill-translate-anchor'?: 'map' | 'viewport';
}
```

### CircleLayerStyle

Style configuration for circle layers.

```typescript
interface CircleLayerStyle {
  'circle-blur'?: number | Expressions;
  'circle-color'?: string | Expressions;
  'circle-opacity'?: number | Expressions;
  'circle-pitch-alignment'?: 'map' | 'viewport';
  'circle-pitch-scale'?: 'map' | 'viewport';
  'circle-radius'?: number | Expressions;
  'circle-stroke-color'?: string | Expressions;
  'circle-stroke-opacity'?: number | Expressions;
  'circle-stroke-width'?: number | Expressions;
  'circle-translate'?: [number, number] | Expressions;
  'circle-translate-anchor'?: 'map' | 'viewport';
}
```

### LineLayerStyle

Style configuration for line layers.

```typescript
interface LineLayerStyle {
  'line-blur'?: number | Expressions;
  'line-cap'?: 'butt' | 'round' | 'square';
  'line-color'?: string | Expressions;
  'line-dasharray'?: number[] | Expressions;
  'line-gap-width'?: number | Expressions;
  'line-gradient'?: Expressions;
  'line-join'?: 'bevel' | 'round' | 'miter';
  'line-miter-limit'?: number | Expressions;
  'line-offset'?: number | Expressions;
  'line-opacity'?: number | Expressions;
  'line-pattern'?: string | Expressions;
  'line-round-limit'?: number | Expressions;
  'line-translate'?: [number, number] | Expressions;
  'line-translate-anchor'?: 'map' | 'viewport';
  'line-width'?: number | Expressions;
}
```

### SymbolLayerStyle

Style configuration for symbol layers.

```typescript
interface SymbolLayerStyle {
  // Icon properties
  'icon-allow-overlap'?: boolean | Expressions;
  'icon-anchor'?:
    | 'center'
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | Expressions;
  'icon-color'?: string | Expressions;
  'icon-halo-blur'?: number | Expressions;
  'icon-halo-color'?: string | Expressions;
  'icon-halo-width'?: number | Expressions;
  'icon-ignore-placement'?: boolean | Expressions;
  'icon-image'?: string | Expressions;
  'icon-keep-upright'?: boolean | Expressions;
  'icon-offset'?: [number, number] | Expressions;
  'icon-opacity'?: number | Expressions;
  'icon-optional'?: boolean | Expressions;
  'icon-overlap'?: 'never' | 'always' | 'cooperative' | Expressions;
  'icon-padding'?: number | Expressions;
  'icon-pitch-alignment'?: 'map' | 'viewport' | 'auto' | Expressions;
  'icon-rotate'?: number | Expressions;
  'icon-rotation-alignment'?: 'map' | 'viewport' | 'auto' | Expressions;
  'icon-size'?: number | Expressions;
  'icon-text-fit'?: 'none' | 'width' | 'height' | 'both' | Expressions;
  'icon-text-fit-padding'?: [number, number, number, number] | Expressions;
  'icon-translate'?: [number, number] | Expressions;
  'icon-translate-anchor'?: 'map' | 'viewport' | Expressions;

  // Text properties
  'text-allow-overlap'?: boolean | Expressions;
  'text-anchor'?:
    | 'center'
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | Expressions;
  'text-color'?: string | Expressions;
  'text-field'?: string | Expressions;
  'text-font'?: string[] | Expressions;
  'text-halo-blur'?: number | Expressions;
  'text-halo-color'?: string | Expressions;
  'text-halo-width'?: number | Expressions;
  'text-ignore-placement'?: boolean | Expressions;
  'text-justify'?: 'auto' | 'left' | 'center' | 'right' | Expressions;
  'text-keep-upright'?: boolean | Expressions;
  'text-letter-spacing'?: number | Expressions;
  'text-line-height'?: number | Expressions;
  'text-max-angle'?: number | Expressions;
  'text-max-width'?: number | Expressions;
  'text-offset'?: [number, number] | Expressions;
  'text-opacity'?: number | Expressions;
  'text-optional'?: boolean | Expressions;
  'text-overlap'?: 'never' | 'always' | 'cooperative' | Expressions;
  'text-padding'?: number | Expressions;
  'text-pitch-alignment'?: 'map' | 'viewport' | 'auto' | Expressions;
  'text-radial-offset'?: number | Expressions;
  'text-rotate'?: number | Expressions;
  'text-rotation-alignment'?: 'map' | 'viewport' | 'auto' | Expressions;
  'text-size'?: number | Expressions;
  'text-transform'?: 'none' | 'uppercase' | 'lowercase' | Expressions;
  'text-translate'?: [number, number] | Expressions;
  'text-translate-anchor'?: 'map' | 'viewport' | Expressions;
  'text-variable-anchor'?:
    | (
        | 'center'
        | 'left'
        | 'right'
        | 'top'
        | 'bottom'
        | 'top-left'
        | 'top-right'
        | 'bottom-left'
        | 'bottom-right'
      )[]
    | Expressions;
  'text-writing-mode'?: ('horizontal' | 'vertical')[] | Expressions;
}
```

## Enum Types

### MapCreationStatus

Status enumeration for map creation lifecycle.

```typescript
enum MapCreationStatus {
  NotInitialized = 'not-initialized',
  Initializing = 'initializing',
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
  Destroyed = 'destroyed',
}
```

### SourceStatus

Status enumeration for source lifecycle.

```typescript
enum SourceStatus {
  NotCreated = 'not-created',
  Creating = 'creating',
  Created = 'created',
  Error = 'error',
}
```

### LayerManagementStatus

Status enumeration for layer management lifecycle.

```typescript
enum LayerManagementStatus {
  NotRegistered = 'not-registered',
  Registering = 'registering',
  Registered = 'registered',
  Error = 'error',
  Disposed = 'disposed',
}
```

## Utility Types

### Nullable

Generic utility type for nullable values.

```typescript
type Nullable<T> = T | null;
```

### MaybeRef

Vue utility type for values that may be reactive references.

```typescript
type MaybeRef<T> = T | Ref<T>;
```

### ImageDatas

Union type for image data formats.

```typescript
type ImageDatas =
  | HTMLImageElement
  | ImageBitmap
  | ImageData
  | {
      width: number;
      height: number;
      data: Uint8Array | Uint8ClampedArray;
    };
```

### Anchor

Anchor position type for markers and popups.

```typescript
type Anchor =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';
```

## Event Types

### GeolocateSuccess

Success event data for geolocation.

```typescript
interface GeolocateSuccess {
  coords: GeolocationCoordinates;
  target: GeolocateControl;
  timestamp: number;
}
```

### GeolocateEventTypes

Event types for geolocation control.

```typescript
interface GeolocateEventTypes {
  geolocate: GeolocateSuccess;
  error: GeolocationPositionError;
  outofmaxbounds: GeolocateSuccess;
  trackuserlocationstart: GeolocateSuccess;
  trackuserlocationend: GeolocateSuccess;
}
```

## Event Handler Types

These are the function signatures (callback shapes) you use when listening to map, layer, and geolocate events. Use them to type the callback you pass to an event listener or composable, so your editor autocompletes the event payload correctly.

### MapClickHandler

The function signature for handling a click anywhere on the map.

```typescript
type MapClickHandler = (e: MapMouseEvent) => void;
```

```ts
const onMapClick: MapClickHandler = (e) => {
  console.log('Clicked at', e.lngLat);
};
```

### MapMoveHandler

The function signature for handling the map's `move` event (fired while the map is panned or zoomed).

```typescript
type MapMoveHandler = (e: Event) => void;
```

```ts
const onMapMove: MapMoveHandler = (e) => {
  console.log('Map is moving');
};
```

### MapZoomHandler

The function signature for handling the map's `zoom` event.

```typescript
type MapZoomHandler = (e: Event) => void;
```

```ts
const onMapZoom: MapZoomHandler = (e) => {
  console.log('Map zoom changed');
};
```

### MapTouchHandler

The function signature for handling touch interactions on the map (tap, swipe, pinch) on touch devices.

```typescript
type MapTouchHandler = (e: MapTouchEvent) => void;
```

```ts
const onMapTouch: MapTouchHandler = (e) => {
  console.log('Touched at', e.lngLat);
};
```

### MapWheelHandler

The function signature for handling mouse wheel scroll events on the map (used for scroll-to-zoom).

```typescript
type MapWheelHandler = (e: MapWheelEvent) => void;
```

```ts
const onMapWheel: MapWheelHandler = (e) => {
  console.log('Wheel delta', e.originalEvent.deltaY);
};
```

### LayerClickHandler

The function signature for handling a click on a specific layer. The event includes the `features` under the pointer, so you can read which feature(s) were clicked.

```typescript
type LayerClickHandler = (
  e: MapMouseEvent & { features?: GeoJSON.Feature[] },
) => void;
```

```vue
<script setup lang="ts">
import { GeoJsonSource, CircleLayer } from 'vue3-maplibre-gl';
import type { LayerClickHandler } from 'vue3-maplibre-gl';

const points = ref({
  type: 'FeatureCollection',
  features: [],
});

const circleStyle = ref({
  'circle-radius': 6,
  'circle-color': '#007cbf',
});

const onLayerClick: LayerClickHandler = (e) => {
  console.log('Clicked feature:', e.features?.[0]);
};
</script>

<template>
  <GeoJsonSource :data="points">
    <CircleLayer id="points" :style="circleStyle" @click="onLayerClick" />
  </GeoJsonSource>
</template>
```

### LayerMouseHandler

The function signature for handling mouse events on a layer, such as hover (`mouseenter`/`mousemove`/`mouseleave`). Like `LayerClickHandler`, it also exposes the `features` under the pointer.

```typescript
type LayerMouseHandler = (
  e: MapMouseEvent & { features?: GeoJSON.Feature[] },
) => void;
```

```vue
<script setup lang="ts">
import { GeoJsonSource, FillLayer } from 'vue3-maplibre-gl';
import type { LayerMouseHandler } from 'vue3-maplibre-gl';

const regions = ref({
  type: 'FeatureCollection',
  features: [],
});

const fillStyle = ref({
  'fill-color': '#41B883',
  'fill-opacity': 0.6,
});

const onLayerHover: LayerMouseHandler = (e) => {
  console.log('Hovering feature:', e.features?.[0]);
};
</script>

<template>
  <GeoJsonSource :data="regions">
    <FillLayer id="regions" :style="fillStyle" @mousemove="onLayerHover" />
  </GeoJsonSource>
</template>
```

### GeolocateHandler

The function signature for handling a successful geolocation result (e.g. when the user's location is found by the geolocate control).

```typescript
type GeolocateHandler = (e: GeolocateSuccess) => void;
```

```ts
const onGeolocate: GeolocateHandler = (e) => {
  console.log('User is at', e.coords.latitude, e.coords.longitude);
};
```

### GeolocateErrorHandler

The function signature for handling a geolocation failure (e.g. the user denied location permission).

```typescript
type GeolocateErrorHandler = (e: GeolocationPositionError) => void;
```

```ts
const onGeolocateError: GeolocateErrorHandler = (e) => {
  console.error('Geolocation failed:', e.message);
};
```

## Re-exported MapLibre GL Types

Vue3 MapLibre GL re-exports all relevant MapLibre GL JS types for convenience:

- `Map`, `LngLat`, `LngLatBounds`, `Point`, `MercatorCoordinate`
- `MapOptions`, `LngLatLike`, `LngLatBoundsLike`, `PointLike`
- `StyleSpecification`, `LayerSpecification`, `SourceSpecification`
- `FilterSpecification`, `ExpressionSpecification`
- `MapEventType`, `MapLayerEventType`, `MapMouseEvent`, `MapTouchEvent`
- `GeolocateControl`, `NavigationControl`, `ScaleControl`
- And many more...

For complete type definitions, refer to the [MapLibre GL JS documentation](https://maplibre.org/maplibre-gl-js/docs/API/).
