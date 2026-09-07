# Composables Overview

Comprehensive reference for all 38 composables available in vue3-maplibre-gl.

Every composable takes a single props object unless noted. The zoom, pan,
rotate and `useJumpTo` composables also keep a legacy positional
`(map, options?)` overload, which returns only that composable's action method
— not the full result documented here.

Every state field is a `ComputedRef`; read it with `.value` in script, unwrapped
in templates. See [Migration from v5 to v6](/guide/migration-v6) for the list.

## Architecture

All composables follow the **factory pattern** for code reuse and maintainability:

- **Event Listeners** (3 composables) → 1 factory (`createEventListenerComposable`)
- **Camera Animations** (13 composables) → 1 factory (`createCameraAnimation`)
- **Layer composables** (4 create + `useLayer`) → `createPropertySetter`,
  `createSetStyle` and `createSetVisibility`

Each factory holds the lifecycle and cleanup logic once, so a fix lands in
every composable built on it — which is how the v6 camera and listener bugs
were fixed in one place each.

## Map Management (3)

### `useCreateMaplibre(elRef, styleRef, props)`

Create and manage a MapLibre GL instance with full lifecycle support.

**Parameters**:

- `elRef: MaybeRef<HTMLElement | undefined | null>` - Container element
- `styleRef: MaybeRef<StyleSpecification | string>` - Map style URL or object
- `props?: CreateMaplibreProps` - Configuration (center, zoom, bearing, etc.)

**Returns**:

```typescript
import { ref } from 'vue';
import type { ComputedRef } from 'vue';
import {
  useCreateMaplibre,
  MapCreationStatus,
  type CameraOptions,
  type LngLatBoundsLike,
  type LngLatLike,
  type Map,
  type StyleSpecification,
} from 'vue3-maplibre-gl';

const container = ref<HTMLElement | null>(null);

const map: {
  mapInstance: ComputedRef<Map | null>;
  mapCreationStatus: ComputedRef<MapCreationStatus>;
  isMapReady: ComputedRef<boolean>;
  isMapLoading: ComputedRef<boolean>;
  hasMapError: ComputedRef<boolean>;
  getCurrentCamera: () => CameraOptions | null;
  getCurrentStyle: () => StyleSpecification | string | null;
  setStyle: (style: StyleSpecification | string) => void;
  setCenter: (center: LngLatLike) => void;
  setZoom: (zoom: number) => void;
  setBearing: (bearing: number) => void;
  setPitch: (pitch: number) => void;
  setMinZoom: (zoom: number) => void;
  setMaxZoom: (zoom: number) => void;
  setMinPitch: (pitch: number) => void;
  setMaxPitch: (pitch: number) => void;
  setMaxBounds: (bounds: LngLatBoundsLike) => void;
  setRenderWorldCopies: (renderWorldCopies: boolean) => void;
  initMap: () => void;
  removeMap: () => void;
  destroyMap: () => void;
} = useCreateMaplibre(container, 'https://demotiles.maplibre.org/style.json');
```

`register`, `onLoad` and `onError` are props, not return fields. Everything
except the three lifecycle methods is also passed to `register`.

`register`, `onLoad` and `onError` are props, not return fields. Everything
except the three lifecycle methods is also passed to `register`.

**Features**:

- SSR-safe with `isBrowser` guard
- Automatic cleanup on unmount
- Map creation status tracking
- Error handling and logging
- Optional debug logging

**Example**:

```typescript
const mapContainer = ref<HTMLElement>();
const { mapInstance, isMapReady, setCenter, setZoom } = useCreateMaplibre(
  mapContainer,
  'https://demotiles.maplibre.org/style.json',
  { center: [0, 0], zoom: 6 },
);

watch(isMapReady, () => {
  // Map is interactive, safe to use
  setCenter([100, 50]);
});
```

### `useMaplibre(options?)`

Hold a map created by `<Maplibre>` so the surrounding component can drive it.
It creates no map: pass its `register` to `<Maplibre>`'s `@register`.

**Returns**: the same camera setters and map accessors as `useCreateMaplibre`,
plus `register`, `isRegistered` and `setMapOptions`. The status field is named
`mapStatus`, not `mapCreationStatus`, and there is no
`initMap` / `removeMap` / `destroyMap` — `<Maplibre>` controls the lifecycle.

**Before registration**: `mapInstance` is `null` and every method no-ops. It
does not throw.

**Example**:

```vue
<script setup>
import { ref } from 'vue';
import { Maplibre, useMaplibre } from 'vue3-maplibre-gl';

const options = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const { register: registerMap, isMapReady, setZoom } = useMaplibre();

const zoomToFit = () => {
  if (isMapReady.value) setZoom(10);
};
</script>

<template>
  <Maplibre :options="options" @register="registerMap" />
</template>
```

To reach the map from a component nested **inside** `<Maplibre>`, inject
`MapProvideKey` — that is what the built-in child components do.

### `useMaplibreConfig(options?)`

Set MapLibre's **global** performance settings. It configures the library, not a
map instance, so it takes no map and should be called once at application level.

**Parameters** (`MaplibreConfigOptions`):

- `workerCount?: number` — web workers for tile loading (default `4`)
- `maxParallelImageRequests?: number` — default `16`
- `prewarmResources?: boolean` — prewarm on init (default `true`)
- `debug?: boolean`

**Returns**: `{ clearPrewarmedResources: () => void }`

**Example**:

```typescript
// main.ts or App.vue setup
const { clearPrewarmedResources } = useMaplibreConfig({
  workerCount: 8,
  prewarmResources: true,
});

onUnmounted(clearPrewarmedResources);
```

## Layer Management (5)

All layer composables use the **factory pattern** for type-safe property setters.

### `useCreateFillLayer(props)`

Create and manage fill (polygon) layers with typed paint/layout properties.

**Props**: `map`, `source` (id or specification), and optional `id`, `beforeId`,
`filter`, `style`, `minzoom`, `maxzoom`, `metadata`, `sourceLayer`, `debug`,
`register`.

**Type Safety**: `style` and `setStyle` only accept `FillLayerStyle` properties
(compile-time validation).

**Returns**:

```typescript
import { ref } from 'vue';
import type { ComputedRef } from 'vue';
import {
  useCreateFillLayer,
  type LayerSpecification,
  type FillLayerStyle,
  type FilterSpecification,
  type Map,
  type StyleSetterOptions,
} from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

const layer: {
  layerId: string;
  getLayer: ComputedRef<LayerSpecification | null>;
  setStyle: (style?: FillLayerStyle) => void;
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
  setFilter: (filter?: FilterSpecification) => void;
  setBeforeId: (beforeId?: string) => void;
  setZoomRange: (minzoom?: number, maxzoom?: number) => void;
  setOpacity: (opacity: number, options?: StyleSetterOptions) => void;
  setColor: (color: string, options?: StyleSetterOptions) => void;
  setOutlineColor: (color: string, options?: StyleSetterOptions) => void;
  setPattern: (pattern: string, options?: StyleSetterOptions) => void;
  setAntialias: (antialias: boolean, options?: StyleSetterOptions) => void;
  setSortKey: (sortKey: number, options?: StyleSetterOptions) => void;
  setVisibility: (
    visibility: 'visible' | 'none',
    options?: StyleSetterOptions,
  ) => void;
  removeLayer: () => void;
} = useCreateFillLayer({ map: mapInstance, source: 'my-source' });
```

**Example**:

```typescript
const { setStyle, setFilter } = useCreateFillLayer({
  map: mapInstance,
  source: 'cities-source',
  id: 'cities-layer',
});

// Reactive property updates (type-safe)
watch(selectedColor, (color) => {
  setStyle({ 'fill-color': color, 'fill-opacity': 0.8 });
});

watch(selectedRegion, (region) => {
  setFilter(['==', 'region', region]);
});
```

### `useCreateCircleLayer(props)`

Create circle (point) layers with type-safe `CirclePaint` properties.

**Returns**: Same pattern as `useCreateFillLayer` (CirclePaint types)

### `useCreateLineLayer(props)`

Create line layers with type-safe `LinePaint` properties.

**Returns**: Same pattern as `useCreateFillLayer` (LinePaint types)

### `useCreateSymbolLayer(props)`

Create symbol (text/icon) layers with type-safe `SymbolPaint` properties.

**Returns**: Same pattern as `useCreateFillLayer` (SymbolPaint types)

### `useLayer<T extends LayerSpecification>(props?)`

Reads the layer registered by an ancestor layer component rather than creating
one — the layer counterpart to `useMaplibre`. It takes no map and no source.

**Props**: `debug?: boolean`, `autoCleanup?: boolean` (default `true`)

**Returns**: `register`, `layerId`, `layer`, `layerStatus`, `isLayerRegistered`,
`isLayerReady`, plus the getters and setters of the registered layer
(`getFilter`, `getPaintProperty`, `setFilter`, `setPaintProperty`, …).

**Example**:

```typescript
// inside a child of <FillLayer>
const { layerId, isLayerReady, setFilter } = useLayer();

watch(isLayerReady, (ready) => {
  if (ready) setFilter(['==', 'region', 'north']);
});
```

## Source Management (2)

### `useCreateGeoJsonSource(props)`

Create and manage GeoJSON data sources with reactive updates.

**Props**: `map`, and optional `id`, `data`, `options`, `debug`, `register`.

**Returns**:

```typescript
import { ref } from 'vue';
import type { ComputedRef, ShallowRef } from 'vue';
import {
  useCreateGeoJsonSource,
  SourceStatus,
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
  type Map,
} from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

const source: {
  sourceId: string;
  getSource: ShallowRef<GeoJSONSource | null>;
  setData: (data: GeoJSONSourceSpecification['data']) => void;
  removeSource: () => void;
  refreshSource: () => void;
  sourceStatus: ComputedRef<SourceStatus>;
  isSourceReady: ComputedRef<boolean>;
} = useCreateGeoJsonSource({
  map: mapInstance,
  data: { type: 'FeatureCollection', features: [] },
});
```

`getSource` is a `ShallowRef`, not a getter function: read it with `.value`.

**Example**:

```typescript
const { setData } = useCreateGeoJsonSource({
  map: mapInstance,
  id: 'cities-source',
  data: citiesGeoJSON,
});

// Update data reactively
watch(
  () => filters.region,
  (region) => {
    const filtered = allCities.filter((c) => c.properties.region === region);
    setData({ type: 'FeatureCollection', features: filtered });
  },
);
```

### `useGeoJsonSource(props?)`

Access the GeoJSON source registered by an ancestor `<GeoJsonSource>`.

**Props**: `debug?: boolean`, `autoRefresh?: boolean` (default `true`)

**Returns**: the registered source's methods, plus `register`.

## Event Listeners (3)

All event listeners use the **factory pattern** with adapter pattern for different targets.

### `useMapEventListener(props)`

Listen to map-level events with automatic attach/detach. Every event-listener
composable takes a single props object — `map`, `event`, the `on` handler, and
optional `once` / `debug`. There is no positional
`(event, handler, options)` form.

**Event Types**: All MapLibre map events

- Mouse: `click`, `dblclick`, `mousemove`, `mouseup`, `mousedown`, `mouseout`, `mouseover`, `contextmenu`
- Movement: `movestart`, `move`, `moveend`, `zoomstart`, `zoom`, `zoomend`, `dragstart`, `drag`, `dragend`
- Rotation: `rotatestart`, `rotate`, `rotateend`, `pitchstart`, `pitch`, `pitchend`
- Data: `data`, `tiledataloading`, `sourcedata`, `styledata`
- Other: `wheel`, `load`, `error`, `idle`, `render`, `remove`, `terrain`

**Handler Type**: `(e: MapMouseEvent) => void` (or appropriate event type)

**Returns**:

```typescript
import { ref } from 'vue';
import type { ComputedRef } from 'vue';
import {
  useMapEventListener,
  EventListenerStatus,
  type Map,
} from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

const listener: {
  removeListener: () => void;
  attachListener: () => void;
  isListenerAttached: ComputedRef<boolean>;
  listenerStatus: ComputedRef<EventListenerStatus>;
} = useMapEventListener({
  map: mapInstance,
  event: 'click',
  on: (e) => console.log(e.lngLat),
});
```

**Example**:

```typescript
const handleMapClick = (e: MapMouseEvent) => {
  console.log('Clicked at', e.lngLat);
};

const { isListenerAttached } = useMapEventListener({
  map: mapInstance,
  event: 'click',
  on: handleMapClick,
});

// Listener automatically attached and cleaned up
```

### `useLayerEventListener<T extends keyof MapLayerEventType>(props)`

Listen to layer-specific events with feature information. The `layer` prop takes
a layer specification or an id.

**Handler Type**: `(e: MapMouseEvent & { features?: GeoJSON.Feature[] }) => void`

**Returns**: Everything `useMapEventListener` returns, plus
`layerId: ComputedRef<string | null>`

**Example**:

```typescript
const handleLayerClick = (e: MapMouseEvent & { features?: Feature[] }) => {
  e.features?.forEach((feature) => {
    console.log('Clicked feature:', feature.properties);
  });
};

const { isListenerAttached, layerId } = useLayerEventListener({
  map: mapInstance,
  layer: 'my-layer',
  event: 'click',
  on: handleLayerClick,
});
```

### `useGeolocateEventListener(props)`

Listen to geolocation control events.

**Event Types**: `geolocate`, `error`, `outofmaxbounds`, `trackuserlocationstart`, `trackuserlocationend`

**Handler Type**: `(e: GeolocateSuccess | GeolocationPositionError) => void`

**Returns**: Same as `useMapEventListener`

## Camera Animations (13)

All camera animations use the **factory pattern** with promise-wrapping for `async/await` support.

### `useFlyTo(props)`

Smooth flight animation to a new location.

**Returns**:

```typescript
import { ref } from 'vue';
import type { ComputedRef } from 'vue';
import {
  useFlyTo,
  FlyStatus,
  type CameraOptions,
  type FlyToOptions,
  type LngLatLike,
  type Map,
} from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

const fly: {
  flyTo: (options?: FlyToOptions) => Promise<void>;
  flyToCenter: (
    center: LngLatLike,
    options?: Omit<FlyToOptions, 'center'>,
  ) => Promise<void>;
  flyToZoom: (
    zoom: number,
    options?: Omit<FlyToOptions, 'zoom'>,
  ) => Promise<void>;
  flyToBearing: (
    bearing: number,
    options?: Omit<FlyToOptions, 'bearing'>,
  ) => Promise<void>;
  flyToPitch: (
    pitch: number,
    options?: Omit<FlyToOptions, 'pitch'>,
  ) => Promise<void>;
  stopFlying: () => void;
  getCurrentCamera: () => CameraOptions | null;
  flyStatus: ComputedRef<FlyStatus>;
  isFlying: ComputedRef<boolean>;
  cleanup: () => void;
} = useFlyTo({ map: mapInstance });
```

**Completes on**: `moveend` event or timeout (optional)

**Example**:

```typescript
const { flyTo, isFlying } = useFlyTo({ map: mapInstance });

const handleFlyTo = async () => {
  try {
    await flyTo({ center: [100, 50], zoom: 10 });
    console.log('Animation complete');
  } catch (error) {
    console.error('Animation failed:', error);
  }
};
```

### `useEaseTo(props)`

Smooth easing animation (similar to flyTo but different curve).

**Returns**: Same as `useFlyTo` with `ease` in place of `fly`, minus `cleanup`

**Completes on**: `moveend` event or timeout

### `useJumpTo(props)`

Instant camera jump (no animation).

**Returns**: `jumpTo`, the four per-axis `jumpTo*` helpers, `getCurrentCamera`,
`validateJumpOptions`, `jumpStatus` and `isJumping` — all synchronous

**Completes on**: Immediately (synchronous)

### `useFitBounds(props)`

Zoom/pan to fit bounds with animation.

**Returns**: `setFitBounds`, `clearBounds`, `getCurrentBounds`, `bounds`,
`boundsStatus`, `isBoundsSet`

**Example**:

```typescript
const { setFitBounds, isBoundsSet } = useFitBounds({ map: mapInstance });

setFitBounds(
  [
    [-74, 40],
    [-73, 41],
  ],
  { padding: 50 },
);
```

### `useCameraForBounds(props)`

Calculate optimal camera position for bounds (without animating).

**Returns**: `cameraForBounds`, `clearCamera`, `getCurrentBounds`, `bbox`,
`cameraStatus`, `isCameraSet`

### `useZoomTo(map, options?)`

Animate to specific zoom level.

**Returns**: `{ zoomTo: (zoom: number) => Promise<void>, ... }`

### `useZoomIn / useZoomOut(map, options?)`

Step zoom up/down (+/- 1 level).

**Returns**: `{ zoomIn / zoomOut: () => Promise<void>, ... }`

### `usePanBy / usePanTo(map, options?)`

Pan map by offset or to location.

**Returns**: `{ panBy / panTo: (offset/lnglat) => Promise<void>, ... }`

### `useRotateTo(map, options?)`

Rotate map to bearing.

**Returns**: `{ rotateTo: (bearing: number) => Promise<void>, ... }`

### `useResetNorth(map, options?)`

Reset bearing to north (0°).

**Returns**: `{ resetNorth: () => Promise<void>, ... }`

### `useResetNorthPitch(map, options?)`

Reset bearing to north and pitch to 0°.

**Returns**: `{ resetNorthPitch: () => Promise<void>, ... }`

### `useSnapToNorth(map, options?)`

Snap to nearest north angle (0°, 90°, 180°, 270°).

**Returns**: `{ snapToNorth: () => Promise<void>, ... }`

## Controls (1)

### `useGeolocateControl(props)`

Programmatic access to geolocation control.

**Returns**:

```typescript
import { ref } from 'vue';
import type { ShallowRef } from 'vue';
import {
  useGeolocateControl,
  type GeolocateControl,
  type Map,
} from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

const control: {
  geolocateControl: ShallowRef<GeolocateControl | null>;
  isControlAdded: ShallowRef<boolean>;
  addControl: () => void;
  removeControl: () => void;
  trigger: () => void;
} = useGeolocateControl({ map: mapInstance });
```

Tracking is configured through `options.trackUserLocation`, which MapLibre's own
control handles; there is no separate start/stop pair.

## Utility Composables

### `useCreateMarker(props)`

Create markers programmatically.

**Returns**: `marker`, `markerStatus`, `isMarkerCreated`, plus `addMarker`,
`removeMarker`, `setLngLat`, `setPopup`, `setOffset`, `setDraggable`,
`setRotation`, `setOpacity`, `togglePopup`, `getElement`, `getLngLat` and the
other getters

### `useCreatePopup(props)`

Create popups programmatically.

**Returns**: `popup`, `popupStatus`, `isPopupCreated`, `isPopupOpen`, plus
`createPopup`, `addToMap`, `removePopup`, `show`, `hide`, `toggle`, `setLngLat`,
`setHTMLContent`, `setDOMContent`, `setText`, `setOffset`, `setMaxWidth`,
`addClassName`, `removeClassName` and the getters

### `useCreateImage(props)`

Add images to map for image layers.

**Returns**: `imageStatus`, `isImageReady`, `loadPromise`, plus `loadImage`,
`updateImage`, `refreshImage`, `hasImage` and `remove`

## Best Practices

1. **Always check map ready state** before operations
2. **Use watch/watchEffect** for reactive updates
3. **Handle promises** from animations with try/catch
4. **Clean up listeners** (automatic via composables)
5. **Use type-safe layer composables** for compile-time validation

## Utilities

| Composable                | Description                                                                     |
| ------------------------- | ------------------------------------------------------------------------------- |
| `useLogger`               | Consistent debug logging (controlled via `debug` prop)                          |
| `useDebounce`             | Debounced function execution                                                    |
| `useDebouncedRef`         | A ref whose writes settle after a delay                                         |
| `useDebouncedWatch`       | `watch` with a debounced callback                                               |
| `useFitScreenCoordinates` | Fit the camera to a pair of screen points                                       |
| `useMapReloadEvent`       | Re-run setup after a style reload, which discards sources and layers            |
| `useCreateLayer`          | The generic layer composable the four typed `useCreate*Layer` wrappers build on |

## Factory Functions

`createEventListenerComposable`, `createCameraAnimation`,
`createPropertySetter`, `createSetStyle`, `createSetVisibility` and
`LAYER_STYLE_CONFIG` back the composables above, and the package root does
export them — `import { createCameraAnimation } from 'vue3-maplibre-gl'` works.

They are not documented API, though: they exist to be shared between the
composables on this page, and their signatures can change in a minor release
without a migration note. Prefer composing the public composables. If you build
on a factory anyway, pin the version.
