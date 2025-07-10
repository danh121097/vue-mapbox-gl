# Types API Reference

Vue3 MapLibre GL provides comprehensive TypeScript support with well-defined types and interfaces for all components and composables.

## Core Types

### MaplibreActions

Enhanced actions interface for map management with additional utility methods.

```typescript
interface MaplibreActions extends CreateMaplibreActions {
  setMapOptions: (options: Partial<MapOptions>) => void;
  isMapReady: boolean;
  isMapLoading: boolean;
  hasMapError: boolean;
}
```

### CreateMaplibreActions

Core actions interface for basic map operations.

```typescript
interface CreateMaplibreActions {
  mapInstance: ComputedRef<Map | null>;
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

### CreateGeoJsonSourceActions

Actions interface for GeoJSON source management.

```typescript
interface CreateGeoJsonSourceActions {
  sourceId: string;
  getSource: ShallowRef<GeoJSONSource | null>;
  setData: (data: GeoJSONSourceSpecification['data']) => void;
  removeSource: () => void;
  refreshSource: () => void;
  sourceStatus: Readonly<SourceStatus>;
  isSourceReady: boolean;
}
```

### CreateLayerActions

Generic actions interface for layer management.

```typescript
interface CreateLayerActions<T extends LayerSpecification> {
  getLayer: ComputedRef<T | null>;
  setBeforeId: (beforeId?: string) => void;
  setFilter: (filter?: FilterSpecification) => void;
  setStyle: (style: any) => void;
  setZoomRange: (min: number, max: number) => void;
  setLayoutProperty: (name: string, value: any, options?: StyleSetterOptions) => void;
  setPaintProperty: (name: string, value: any, options?: StyleSetterOptions) => void;
}
```

## Layer Style Types

### FillLayerStyle

Style configuration for fill layers.

```typescript
interface FillLayerStyle {
  'fill-antialias'?: boolean;
  'fill-color'?: string | Expression;
  'fill-opacity'?: number | Expression;
  'fill-outline-color'?: string | Expression;
  'fill-pattern'?: string | Expression;
  'fill-translate'?: [number, number] | Expression;
  'fill-translate-anchor'?: 'map' | 'viewport';
}
```

### CircleLayerStyle

Style configuration for circle layers.

```typescript
interface CircleLayerStyle {
  'circle-blur'?: number | Expression;
  'circle-color'?: string | Expression;
  'circle-opacity'?: number | Expression;
  'circle-pitch-alignment'?: 'map' | 'viewport';
  'circle-pitch-scale'?: 'map' | 'viewport';
  'circle-radius'?: number | Expression;
  'circle-stroke-color'?: string | Expression;
  'circle-stroke-opacity'?: number | Expression;
  'circle-stroke-width'?: number | Expression;
  'circle-translate'?: [number, number] | Expression;
  'circle-translate-anchor'?: 'map' | 'viewport';
}
```

### LineLayerStyle

Style configuration for line layers.

```typescript
interface LineLayerStyle {
  'line-blur'?: number | Expression;
  'line-cap'?: 'butt' | 'round' | 'square';
  'line-color'?: string | Expression;
  'line-dasharray'?: number[] | Expression;
  'line-gap-width'?: number | Expression;
  'line-gradient'?: Expression;
  'line-join'?: 'bevel' | 'round' | 'miter';
  'line-miter-limit'?: number | Expression;
  'line-offset'?: number | Expression;
  'line-opacity'?: number | Expression;
  'line-pattern'?: string | Expression;
  'line-round-limit'?: number | Expression;
  'line-translate'?: [number, number] | Expression;
  'line-translate-anchor'?: 'map' | 'viewport';
  'line-width'?: number | Expression;
}
```

### SymbolLayerStyle

Style configuration for symbol layers.

```typescript
interface SymbolLayerStyle {
  // Icon properties
  'icon-allow-overlap'?: boolean | Expression;
  'icon-anchor'?: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | Expression;
  'icon-color'?: string | Expression;
  'icon-halo-blur'?: number | Expression;
  'icon-halo-color'?: string | Expression;
  'icon-halo-width'?: number | Expression;
  'icon-ignore-placement'?: boolean | Expression;
  'icon-image'?: string | Expression;
  'icon-keep-upright'?: boolean | Expression;
  'icon-offset'?: [number, number] | Expression;
  'icon-opacity'?: number | Expression;
  'icon-optional'?: boolean | Expression;
  'icon-overlap'?: 'never' | 'always' | 'cooperative' | Expression;
  'icon-padding'?: number | Expression;
  'icon-pitch-alignment'?: 'map' | 'viewport' | 'auto' | Expression;
  'icon-rotate'?: number | Expression;
  'icon-rotation-alignment'?: 'map' | 'viewport' | 'auto' | Expression;
  'icon-size'?: number | Expression;
  'icon-text-fit'?: 'none' | 'width' | 'height' | 'both' | Expression;
  'icon-text-fit-padding'?: [number, number, number, number] | Expression;
  'icon-translate'?: [number, number] | Expression;
  'icon-translate-anchor'?: 'map' | 'viewport' | Expression;
  
  // Text properties
  'text-allow-overlap'?: boolean | Expression;
  'text-anchor'?: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | Expression;
  'text-color'?: string | Expression;
  'text-field'?: string | Expression;
  'text-font'?: string[] | Expression;
  'text-halo-blur'?: number | Expression;
  'text-halo-color'?: string | Expression;
  'text-halo-width'?: number | Expression;
  'text-ignore-placement'?: boolean | Expression;
  'text-justify'?: 'auto' | 'left' | 'center' | 'right' | Expression;
  'text-keep-upright'?: boolean | Expression;
  'text-letter-spacing'?: number | Expression;
  'text-line-height'?: number | Expression;
  'text-max-angle'?: number | Expression;
  'text-max-width'?: number | Expression;
  'text-offset'?: [number, number] | Expression;
  'text-opacity'?: number | Expression;
  'text-optional'?: boolean | Expression;
  'text-overlap'?: 'never' | 'always' | 'cooperative' | Expression;
  'text-padding'?: number | Expression;
  'text-pitch-alignment'?: 'map' | 'viewport' | 'auto' | Expression;
  'text-radial-offset'?: number | Expression;
  'text-rotate'?: number | Expression;
  'text-rotation-alignment'?: 'map' | 'viewport' | 'auto' | Expression;
  'text-size'?: number | Expression;
  'text-transform'?: 'none' | 'uppercase' | 'lowercase' | Expression;
  'text-translate'?: [number, number] | Expression;
  'text-translate-anchor'?: 'map' | 'viewport' | Expression;
  'text-variable-anchor'?: ('center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right')[] | Expression;
  'text-writing-mode'?: ('horizontal' | 'vertical')[] | Expression;
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
  Disposed = 'disposed'
}
```

### SourceStatus

Status enumeration for source lifecycle.

```typescript
enum SourceStatus {
  NotCreated = 'not-created',
  Creating = 'creating',
  Created = 'created',
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
  Disposed = 'disposed'
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
  Disposed = 'disposed'
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
type ImageDatas = ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap;
```

### Anchor

Anchor position type for markers and popups.

```typescript
type Anchor = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
```

## Event Types

### GeolocateSuccess

Success event data for geolocation.

```typescript
interface GeolocateSuccess {
  coords: GeolocationCoordinates;
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
  trackingstart: GeolocateSuccess;
  trackingend: GeolocateSuccess;
}
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

For complete type definitions, refer to the [MapLibre GL JS documentation](https://maplibre.org/maplibre-gl-js-docs/api/).
