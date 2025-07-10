# Composables API Reference

Vue3 MapLibre GL provides a comprehensive set of composables for building interactive maps with Vue 3 Composition API. All composables are designed with TypeScript support, reactive data binding, and comprehensive error handling.

## Map Composables

### useCreateMapbox

The core composable for creating and managing MapLibre GL Maps with enhanced error handling and reactive state management.

#### Parameters

| Parameter  | Type                                     | Description                             |
| ---------- | ---------------------------------------- | --------------------------------------- |
| `elRef`    | `MaybeRef<HTMLElement \| undefined>`     | Reference to the HTML element container |
| `styleRef` | `MaybeRef<StyleSpecification \| string>` | Reference to the map style              |
| `props`    | `CreateMapboxProps`                      | Configuration options for the map       |

#### CreateMapboxProps Interface

| Property   | Type                                               | Default     | Description                          |
| ---------- | -------------------------------------------------- | ----------- | ------------------------------------ |
| `register` | `(actions: EnhancedCreateMaplibreActions) => void` | `undefined` | Callback for registering map actions |
| `debug`    | `boolean`                                          | `false`     | Enable debug logging                 |
| `onLoad`   | `(map: Map) => void`                               | `undefined` | Load success callback                |
| `onError`  | `(error: any) => void`                             | `undefined` | Error handling callback              |

#### Returns

| Property               | Type                                            | Description                  |
| ---------------------- | ----------------------------------------------- | ---------------------------- |
| `mapInstance`          | `ComputedRef<Map \| null>`                      | Reactive map instance        |
| `setCenter`            | `(center: LngLatLike) => void`                  | Set map center coordinates   |
| `setBearing`           | `(bearing: number) => void`                     | Set map bearing (rotation)   |
| `setZoom`              | `(zoom: number) => void`                        | Set map zoom level           |
| `setPitch`             | `(pitch: number) => void`                       | Set map pitch (tilt)         |
| `setStyle`             | `(style: StyleSpecification \| string) => void` | Set map style                |
| `setMaxBounds`         | `(bounds: LngLatBoundsLike) => void`            | Set maximum bounds           |
| `setMaxPitch`          | `(pitch: number) => void`                       | Set maximum pitch            |
| `setMaxZoom`           | `(zoom: number) => void`                        | Set maximum zoom             |
| `setMinPitch`          | `(pitch: number) => void`                       | Set minimum pitch            |
| `setMinZoom`           | `(zoom: number) => void`                        | Set minimum zoom             |
| `setRenderWorldCopies` | `(render: boolean) => void`                     | Set world copies rendering   |
| `isMapReady`           | `ComputedRef<boolean>`                          | Whether the map is ready     |
| `isMapLoading`         | `ComputedRef<boolean>`                          | Whether the map is loading   |
| `hasMapError`          | `ComputedRef<boolean>`                          | Whether the map has an error |
| `refreshMap`           | `() => void`                                    | Refresh the map instance     |
| `destroyMap`           | `() => void`                                    | Destroy the map instance     |

#### Example

```typescript
import { ref } from 'vue';
import { useCreateMapbox } from 'vue3-maplibre-gl';

const mapContainer = ref<HTMLElement>();
const mapStyle = ref('https://demotiles.maplibre.org/style.json');

const { mapInstance, setCenter, setZoom, isMapReady, isMapLoading } =
  useCreateMapbox(mapContainer, mapStyle, {
    debug: true,
    onLoad: (map) => {
      console.log('Map loaded:', map);
    },
    onError: (error) => {
      console.error('Map error:', error);
    },
  });

// Use the map instance
watch(isMapReady, (ready) => {
  if (ready) {
    setCenter([0, 0]);
    setZoom(10);
  }
});
```

### useMapbox

A simplified composable for basic map operations and state management.

#### Parameters

| Parameter | Type             | Description           |
| --------- | ---------------- | --------------------- |
| `props`   | `UseMapboxProps` | Configuration options |

#### Returns

| Property      | Type                       | Description              |
| ------------- | -------------------------- | ------------------------ |
| `mapInstance` | `ComputedRef<Map \| null>` | Reactive map instance    |
| `isReady`     | `ComputedRef<boolean>`     | Whether the map is ready |

#### Example

```typescript
import { useMapbox } from 'vue3-maplibre-gl';

const { mapInstance, isReady } = useMapbox({
  debug: true,
});
```

## Layer Composables

### useCreateFillLayer

Creates and manages MapLibre GL Fill Layers with reactive updates and comprehensive event handling.

#### Parameters

| Parameter | Type                   | Description              |
| --------- | ---------------------- | ------------------------ |
| `props`   | `CreateFillLayerProps` | Fill layer configuration |

#### CreateFillLayerProps Interface

| Property      | Type                                              | Description                    |
| ------------- | ------------------------------------------------- | ------------------------------ |
| `map`         | `MaybeRef<Map \| null>`                           | Map instance reference         |
| `source`      | `MaybeRef<string \| object>`                      | Data source for the layer      |
| `style`       | `FillLayerStyle`                                  | Fill layer style configuration |
| `filter`      | `FilterSpecification`                             | Filter expression              |
| `id`          | `string`                                          | Layer identifier               |
| `maxzoom`     | `number`                                          | Maximum zoom level             |
| `minzoom`     | `number`                                          | Minimum zoom level             |
| `metadata`    | `object`                                          | Layer metadata                 |
| `sourceLayer` | `string`                                          | Source layer name              |
| `register`    | `(actions: CreateLayerActions, map: Map) => void` | Registration callback          |

#### Returns

| Property            | Type                                      | Description               |
| ------------------- | ----------------------------------------- | ------------------------- |
| `getLayer`          | `ComputedRef<LayerSpecification \| null>` | Get layer specification   |
| `setBeforeId`       | `(beforeId?: string) => void`             | Set layer insertion point |
| `setFilter`         | `(filter?: FilterSpecification) => void`  | Set layer filter          |
| `setStyle`          | `(style: FillLayerStyle) => void`         | Set layer style           |
| `setZoomRange`      | `(min: number, max: number) => void`      | Set zoom range            |
| `setLayoutProperty` | `(name: string, value: any) => void`      | Set layout property       |

#### Example

```typescript
import { ref } from 'vue';
import { useCreateFillLayer } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);
const sourceRef = ref('my-source');

const { getLayer, setStyle, setFilter } = useCreateFillLayer({
  map: mapInstance,
  source: sourceRef,
  id: 'fill-layer',
  style: {
    'fill-color': '#088',
    'fill-opacity': 0.8,
  },
  filter: ['==', 'type', 'polygon'],
  register: (actions, map) => {
    console.log('Fill layer registered:', actions);
  },
});

// Update layer style
setStyle({
  'fill-color': '#ff0000',
  'fill-opacity': 0.6,
});

// Update layer filter
setFilter(['==', 'category', 'important']);
```

### useCreateCircleLayer

Creates and manages MapLibre GL Circle Layers for point data visualization.

#### Parameters

Similar to `useCreateFillLayer` but with `CircleLayerStyle` for styling.

#### Example

```typescript
import { useCreateCircleLayer } from 'vue3-maplibre-gl';

const { getLayer, setStyle } = useCreateCircleLayer({
  map: mapInstance,
  source: sourceRef,
  id: 'circle-layer',
  style: {
    'circle-radius': 6,
    'circle-color': '#007cbf',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff',
  },
});
```

### useCreateLineLayer

Creates and manages MapLibre GL Line Layers for linear features.

#### Parameters

Similar to `useCreateFillLayer` but with `LineLayerStyle` for styling.

#### Example

```typescript
import { useCreateLineLayer } from 'vue3-maplibre-gl';

const { getLayer, setStyle } = useCreateLineLayer({
  map: mapInstance,
  source: sourceRef,
  id: 'line-layer',
  style: {
    'line-color': '#007cbf',
    'line-width': 3,
    'line-opacity': 0.8,
  },
});
```

### useCreateSymbolLayer

Creates and manages MapLibre GL Symbol Layers for icons and text.

#### Parameters

Similar to `useCreateFillLayer` but with `SymbolLayerStyle` for styling.

#### Example

```typescript
import { useCreateSymbolLayer } from 'vue3-maplibre-gl';

const { getLayer, setStyle } = useCreateSymbolLayer({
  map: mapInstance,
  source: sourceRef,
  id: 'symbol-layer',
  style: {
    'text-field': ['get', 'name'],
    'text-font': ['Open Sans Regular'],
    'text-size': 12,
    'text-color': '#333',
  },
});
```

## Source Composables

### useCreateGeoJsonSource

Creates and manages MapLibre GL GeoJSON Sources with reactive data updates and comprehensive error handling.

#### Parameters

| Parameter | Type                       | Description                  |
| --------- | -------------------------- | ---------------------------- |
| `props`   | `CreateGeoJsonSourceProps` | GeoJSON source configuration |

#### CreateGeoJsonSourceProps Interface

| Property   | Type                                                      | Description               |
| ---------- | --------------------------------------------------------- | ------------------------- |
| `map`      | `MaybeRef<Map \| null>`                                   | Map instance reference    |
| `id`       | `string`                                                  | Source identifier         |
| `data`     | `GeoJSONSourceSpecification['data']`                      | GeoJSON data              |
| `options`  | `Partial<GeoJSONSourceSpecification>`                     | Additional source options |
| `debug`    | `boolean`                                                 | Enable debug logging      |
| `register` | `(actions: CreateGeoJsonSourceActions, map: Map) => void` | Registration callback     |

#### Returns

| Property        | Type                                                 | Description             |
| --------------- | ---------------------------------------------------- | ----------------------- |
| `sourceId`      | `string`                                             | Source identifier       |
| `getSource`     | `ShallowRef<GeoJSONSource \| null>`                  | Get source instance     |
| `setData`       | `(data: GeoJSONSourceSpecification['data']) => void` | Update source data      |
| `removeSource`  | `() => void`                                         | Remove source from map  |
| `refreshSource` | `() => void`                                         | Refresh source          |
| `sourceStatus`  | `Readonly<SourceStatus>`                             | Source status           |
| `isSourceReady` | `boolean`                                            | Whether source is ready |

#### Example

```typescript
import { ref } from 'vue';
import { useCreateGeoJsonSource } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);
const geoJsonData = ref({
  type: 'FeatureCollection',
  features: [],
});

const { sourceId, getSource, setData, isSourceReady } = useCreateGeoJsonSource({
  map: mapInstance,
  id: 'my-geojson-source',
  data: geoJsonData.value,
  options: {
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  },
  debug: true,
  register: (actions, map) => {
    console.log('GeoJSON source registered:', actions);
  },
});

// Update source data
const newData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
      properties: {
        name: 'Sample Point',
      },
    },
  ],
};

setData(newData);
```

### useGeoJsonSource

A simplified composable for managing GeoJSON source instances with enhanced error handling.

#### Parameters

| Parameter | Type                    | Description           |
| --------- | ----------------------- | --------------------- |
| `props`   | `UseGeoJsonSourceProps` | Configuration options |

#### Returns

| Property        | Type                                                 | Description             |
| --------------- | ---------------------------------------------------- | ----------------------- |
| `sourceId`      | `ComputedRef<string \| undefined>`                   | Source identifier       |
| `getSource`     | `ComputedRef<GeoJSONSource \| null>`                 | Get source instance     |
| `setData`       | `(data: GeoJSONSourceSpecification['data']) => void` | Update source data      |
| `refreshSource` | `() => void`                                         | Refresh source          |
| `isSourceReady` | `ComputedRef<boolean>`                               | Whether source is ready |
| `sourceStatus`  | `ComputedRef<GeoJsonSourceStatus>`                   | Source status           |

#### Example

```typescript
import { useGeoJsonSource } from 'vue3-maplibre-gl';

const { sourceId, getSource, setData, isSourceReady, register } =
  useGeoJsonSource({
    debug: true,
    autoRefresh: true,
  });

// Register with a source instance
register(sourceActions);
```

## Control Composables

### useGeolocateControl

Creates and manages MapLibre GL Geolocate Controls with comprehensive event handling.

#### Parameters

| Parameter | Type                       | Description                     |
| --------- | -------------------------- | ------------------------------- |
| `props`   | `UseGeolocateControlProps` | Geolocate control configuration |

#### UseGeolocateControlProps Interface

| Property   | Type                      | Description             |
| ---------- | ------------------------- | ----------------------- |
| `map`      | `MaybeRef<Map \| null>`   | Map instance reference  |
| `position` | `ControlPosition`         | Control position on map |
| `options`  | `GeolocateControlOptions` | Control options         |
| `debug`    | `boolean`                 | Enable debug logging    |

#### Returns

| Property      | Type                                   | Description                      |
| ------------- | -------------------------------------- | -------------------------------- |
| `control`     | `ShallowRef<GeolocateControl \| null>` | Control instance                 |
| `trigger`     | `() => boolean`                        | Trigger geolocation              |
| `isActive`    | `ComputedRef<boolean>`                 | Whether control is active        |
| `isSupported` | `ComputedRef<boolean>`                 | Whether geolocation is supported |

#### Example

```typescript
import { ref } from 'vue';
import { useGeolocateControl } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

const { control, trigger, isActive, isSupported } = useGeolocateControl({
  map: mapInstance,
  position: 'top-right',
  options: {
    positionOptions: {
      enableHighAccuracy: true,
    },
    trackUserLocation: true,
    showUserHeading: true,
  },
  debug: true,
});

// Manually trigger geolocation
if (isSupported.value) {
  trigger();
}
```

## Event Composables

### useMapEventListener

Provides reactive event handling for MapLibre GL map events with automatic cleanup.

#### Parameters

| Parameter | Type                       | Description                  |
| --------- | -------------------------- | ---------------------------- |
| `props`   | `UseMapEventListenerProps` | Event listener configuration |

#### UseMapEventListenerProps Interface

| Property  | Type                      | Description              |
| --------- | ------------------------- | ------------------------ |
| `map`     | `MaybeRef<Map \| null>`   | Map instance reference   |
| `event`   | `MapEventType`            | Event type to listen for |
| `handler` | `(event: any) => void`    | Event handler function   |
| `options` | `AddEventListenerOptions` | Event listener options   |

#### Example

```typescript
import { ref } from 'vue';
import { useMapEventListener } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

// Listen for map click events
useMapEventListener({
  map: mapInstance,
  event: 'click',
  handler: (event) => {
    console.log('Map clicked at:', event.lngLat);
  },
});

// Listen for map zoom events
useMapEventListener({
  map: mapInstance,
  event: 'zoom',
  handler: (event) => {
    console.log('Map zoom level:', event.target.getZoom());
  },
});
```

### useLayerEventListener

Provides reactive event handling for MapLibre GL layer events with automatic cleanup.

#### Parameters

| Parameter | Type                         | Description                        |
| --------- | ---------------------------- | ---------------------------------- |
| `props`   | `UseLayerEventListenerProps` | Layer event listener configuration |

#### UseLayerEventListenerProps Interface

| Property  | Type                    | Description              |
| --------- | ----------------------- | ------------------------ |
| `map`     | `MaybeRef<Map \| null>` | Map instance reference   |
| `layerId` | `string`                | Layer identifier         |
| `event`   | `MapLayerEventType`     | Event type to listen for |
| `handler` | `(event: any) => void`  | Event handler function   |

#### Example

```typescript
import { ref } from 'vue';
import { useLayerEventListener } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

// Listen for layer click events
useLayerEventListener({
  map: mapInstance,
  layerId: 'my-layer',
  event: 'click',
  handler: (event) => {
    console.log('Layer clicked:', event.features[0]);
  },
});

// Listen for layer hover events
useLayerEventListener({
  map: mapInstance,
  layerId: 'my-layer',
  event: 'mouseenter',
  handler: (event) => {
    console.log('Mouse entered layer:', event.features[0]);
  },
});
```

## Utility Composables

### useFlyTo

Provides smooth animated transitions to new map positions with customizable easing and duration.

#### Parameters

| Parameter | Type            | Description                    |
| --------- | --------------- | ------------------------------ |
| `props`   | `UseFlyToProps` | Fly-to animation configuration |

#### UseFlyToProps Interface

| Property  | Type                    | Description            |
| --------- | ----------------------- | ---------------------- |
| `map`     | `MaybeRef<Map \| null>` | Map instance reference |
| `options` | `FlyToOptions`          | Animation options      |

#### Returns

| Property   | Type                              | Description                 |
| ---------- | --------------------------------- | --------------------------- |
| `flyTo`    | `(options: FlyToOptions) => void` | Execute fly-to animation    |
| `isFlying` | `ComputedRef<boolean>`            | Whether animation is active |

#### Example

```typescript
import { ref } from 'vue';
import { useFlyTo } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

const { flyTo, isFlying } = useFlyTo({
  map: mapInstance,
});

// Fly to a new location
flyTo({
  center: [0, 0],
  zoom: 10,
  duration: 2000,
  essential: true,
});

// Check if animation is active
watch(isFlying, (flying) => {
  console.log('Animation active:', flying);
});
```

### useEaseTo

Provides smooth animated transitions with easing functions for map camera changes.

#### Parameters

| Parameter | Type             | Description                     |
| --------- | ---------------- | ------------------------------- |
| `props`   | `UseEaseToProps` | Ease-to animation configuration |

#### Returns

| Property   | Type                               | Description                 |
| ---------- | ---------------------------------- | --------------------------- |
| `easeTo`   | `(options: EaseToOptions) => void` | Execute ease-to animation   |
| `isEasing` | `ComputedRef<boolean>`             | Whether animation is active |

#### Example

```typescript
import { useEaseTo } from 'vue3-maplibre-gl';

const { easeTo, isEasing } = useEaseTo({
  map: mapInstance,
});

// Ease to a new position
easeTo({
  center: [0, 0],
  zoom: 12,
  bearing: 45,
  pitch: 30,
  duration: 1000,
});
```

### useJumpTo

Provides instant map position changes without animation.

#### Parameters

| Parameter | Type             | Description           |
| --------- | ---------------- | --------------------- |
| `props`   | `UseJumpToProps` | Jump-to configuration |

#### Returns

| Property | Type                               | Description                     |
| -------- | ---------------------------------- | ------------------------------- |
| `jumpTo` | `(options: CameraOptions) => void` | Execute instant position change |

#### Example

```typescript
import { useJumpTo } from 'vue3-maplibre-gl';

const { jumpTo } = useJumpTo({
  map: mapInstance,
});

// Jump to a new position instantly
jumpTo({
  center: [0, 0],
  zoom: 15,
  bearing: 0,
  pitch: 0,
});
```

### useBounds

Provides utilities for working with map bounds and fitting content to view.

#### Parameters

| Parameter | Type             | Description          |
| --------- | ---------------- | -------------------- |
| `props`   | `UseBoundsProps` | Bounds configuration |

#### Returns

| Property    | Type                                                             | Description            |
| ----------- | ---------------------------------------------------------------- | ---------------------- |
| `fitBounds` | `(bounds: LngLatBoundsLike, options?: FitBoundsOptions) => void` | Fit map to bounds      |
| `getBounds` | `() => LngLatBounds`                                             | Get current map bounds |
| `setBounds` | `(bounds: LngLatBoundsLike) => void`                             | Set map bounds         |

#### Example

```typescript
import { useBounds } from 'vue3-maplibre-gl';

const { fitBounds, getBounds, setBounds } = useBounds({
  map: mapInstance,
});

// Fit map to specific bounds
fitBounds(
  [
    [-74.0, 40.7], // Southwest coordinates
    [-73.9, 40.8], // Northeast coordinates
  ],
  {
    padding: 20,
    duration: 1000,
  },
);

// Get current bounds
const currentBounds = getBounds();
console.log('Current bounds:', currentBounds);
```

### useZoom

Provides utilities for managing map zoom levels with smooth animations.

#### Parameters

| Parameter | Type           | Description        |
| --------- | -------------- | ------------------ |
| `props`   | `UseZoomProps` | Zoom configuration |

#### Returns

| Property  | Type                                            | Description            |
| --------- | ----------------------------------------------- | ---------------------- |
| `zoomIn`  | `(options?: ZoomOptions) => void`               | Zoom in by one level   |
| `zoomOut` | `(options?: ZoomOptions) => void`               | Zoom out by one level  |
| `zoomTo`  | `(zoom: number, options?: ZoomOptions) => void` | Zoom to specific level |
| `getZoom` | `() => number`                                  | Get current zoom level |

#### Example

```typescript
import { useZoom } from 'vue3-maplibre-gl';

const { zoomIn, zoomOut, zoomTo, getZoom } = useZoom({
  map: mapInstance,
});

// Zoom in
zoomIn({ duration: 500 });

// Zoom out
zoomOut({ duration: 500 });

// Zoom to specific level
zoomTo(12, { duration: 1000 });

// Get current zoom
const currentZoom = getZoom();
console.log('Current zoom:', currentZoom);
```

### useLogger

Provides consistent logging functionality with debug level control.

#### Parameters

| Parameter | Type      | Description                     |
| --------- | --------- | ------------------------------- |
| `debug`   | `boolean` | Whether to enable debug logging |

#### Returns

| Property   | Type                                        | Description         |
| ---------- | ------------------------------------------- | ------------------- |
| `log`      | `(message: string, ...args: any[]) => void` | Log debug message   |
| `logError` | `(message: string, ...args: any[]) => void` | Log error message   |
| `logWarn`  | `(message: string, ...args: any[]) => void` | Log warning message |

#### Example

```typescript
import { useLogger } from 'vue3-maplibre-gl';

const { log, logError, logWarn } = useLogger(true);

// Log debug information
log('Map initialized successfully');

// Log errors
logError('Failed to load map style:', error);

// Log warnings
logWarn('Deprecated API usage detected');
```
