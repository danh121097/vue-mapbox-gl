# System Architecture

## High-Level Overview

Vue3 MapLibre GL is a Vue 3 component library that provides reactive, type-safe bindings to MapLibre GL JS. The architecture follows a layered design with clear separation of concerns:

```
User Application (Vue 3 / Nuxt)
        │
        ├─► Components Layer (Maplibre, GeoJsonSource, Layers, etc.)
        │
        ├─► Composables Layer (useMaplibre, useFlyTo, useMapEventListener, etc.)
        │
        ├─► Factories Layer (createEventListenerComposable, createCameraAnimation, etc.)
        │
        ├─► Types & Enums Layer (Type definitions, status enums, handlers)
        │
        └─► MapLibre GL JS (Maps, Layers, Sources, Events)
```

## Architectural Patterns

### 1. Factory Pattern (v5)

The library uses factory functions to eliminate code duplication across similar features:

#### Event Listener Factory (`createEventListenerComposable`)

**Problem Solved**: Three different event listener composables (map, layer, geolocate) shared 80% of the same logic.

**Solution**: Single factory with adapter pattern for different event targets.

```typescript
// Factory Definition
export function createEventListenerComposable<TTarget>(
  config: EventListenerConfig<TTarget>
): EventListenerActions { ... }

// Usage - Map Events
const { isListenerAttached } = createEventListenerComposable({
  target: mapInstance,
  event: 'click',
  on: handleMapClick,
  adapter: MapAdapter, // Provides on/off for map
})

// Usage - Layer Events
const { isListenerAttached } = createEventListenerComposable({
  target: mapInstance,
  event: 'click',
  on: handleLayerClick,
  adapter: LayerAdapter, // Provides on/off for layer
})
```

**Benefits**:

- Single source of truth for event attachment logic
- Consistent error handling across all event types
- Reduced testing surface area
- Easy to add new event sources (WebSocket, WebWorker, etc.)

#### Camera Animation Factory (`createCameraAnimation`)

**Problem Solved**: Seven camera animation composables (flyTo, easeTo, jumpTo, etc.) shared promise wrapping logic.

**Solution**: Single factory that executes map methods and wraps them in promises.

```typescript
// Factory Definition
export function createCameraAnimation(
  config: CameraAnimationConfig
): CameraAnimationResult { ... }

// Usage - Flying to Location
const { flyTo } = useFlyTo({ map: mapInstance });
await flyTo({ center: [0, 0], zoom: 10 });

// Under the hood uses:
executeAnimation('flyTo', [{center, zoom}], 'moveend')
```

**Benefits**:

- Consistent timeout handling across animations
- Promise-based API for await/async patterns
- Automatic cleanup and status tracking
- Prevents hanging promises (optional timeout)

#### Layer Property Setter Factory (`createPropertySetter`)

**Problem Solved**: Four layer components (Fill, Circle, Line, Symbol) had similar property update logic.

**Solution**: Single factory with generic type preservation.

```typescript
// Factory Definition
export function createPropertySetter<T extends LayerSpecification>(
  config: PropertySetterConfig<T>
): PropertySetterActions<T> { ... }

// Type Preservation
const { setStyle } = useCreateFillLayer({ map: mapInstance, source: sourceId });
// setPaint type = (paint: FillPaint) => void
// NOT (paint: any) => void
```

**Benefits**:

- Type preservation across all layer types
- Reusable batch update logic
- Consistent validation before updates
- Reduced bundle size (4 implementations → 1 factory)

### 2. Composition Pattern

Components are designed to work together through Vue's provide/inject system:

```typescript
// Maplibre.vue provides map context
provide(MapProvideKey, mapInstance);

// Child components (GeoJsonSource, Layers) inject it
const mapInstance = inject(MapProvideKey);
```

**Benefits**:

- Eliminates prop drilling
- Loose coupling between components
- Easy to test in isolation
- Natural Vue patterns

### 3. Context & State Management

#### Map Context

The main `Maplibre` component provides a context containing:

- `mapInstance: ComputedRef<Map | null>` - The MapLibre instance
- `mapCreationStatus: ComputedRef<MapCreationStatus>` - Current initialization state
- `isMapReady: ComputedRef<boolean>` - Map is fully loaded and interactive

```typescript
const mapInstance = inject<ComputedRef<Map | null>>(MapProvideKey);
if (mapInstance?.value) {
  // Map is available, safe to use
}
```

#### Status Enums

- `MapCreationStatus` - Map lifecycle (NotInitialized, Initializing, Loading, Loaded, Error, Destroyed)
- `EventListenerStatus` - Event attachment state (NotAttached, Attached, Error)
- `AnimationStatus` - Animation state (NotStarted, Running, Completed, Error)

### 4. Lifecycle Management

#### Component Lifecycle

```
Mount
  ├─ useCreateMaplibre initializes MapLibre instance
  ├─ Provide map context to descendants
  ├─ Attach event listeners
  └─ Set component ready
       │
Usage
  ├─ User interacts with map
  ├─ Composables manage animations/events
  ├─ Child components update based on map state
  └─ All changes are reactive
       │
Cleanup (Unmount)
  ├─ onUnmounted triggers cleanup
  ├─ All event listeners detached (idempotent)
  ├─ Map instance destroyed
  ├─ Memory cleared
  └─ No leaks or hanging references
```

#### Memory Safety

**Defense-in-Depth Pattern**:

1. **Explicit cleanup functions** in watchEffect
2. **Idempotent remove operations** (safe to call multiple times)
3. **onUnmounted guards** to prevent use-after-unmount
4. **shallowRef for Map objects** (no unwanted Vue reactivity)
5. **markRaw on MapLibre objects** (opt-out of Vue proxy)

## Component Architecture

### Maplibre Component (Root)

**Responsibilities**:

- Initialize MapLibre instance via `useCreateMaplibre`
- Provide map context to descendants
- Emit map lifecycle events
- Handle errors and edge cases

**Key Props**:

- `options: Partial<MapOptions>` - MapLibre configuration
- `register?: (actions: MaplibreActions) => void` - Access map methods
- `debug?: boolean` - Enable debug logging

**Key Events**:

- `load` - Map fully loaded
- `error` - A map error. Fired for both a failed initialisation and an ordinary
  runtime resource failure (a 404 tile, a missing glyph range, a sprite that
  will not fetch). Only a failure _before_ the map loads sets the error state
  and swaps in the `error` slot; after load the event is reported and the map
  keeps running.
- Map events (click, move, zoom, etc.)

### Data Source Components (GeoJsonSource)

**Responsibilities**:

- Create GeoJSON source in MapLibre
- Add to map on mount
- Handle reactive data updates
- Clean up source on unmount

**Pattern**:

```vue
<script setup>
const mapInstance = inject(MapProvideKey);
const sourceId = props.id || generateId();

// Create source on mount
onMounted(() => {
  mapInstance.value?.addSource(sourceId, {
    type: 'geojson',
    data: props.data,
  });
});

// Update source when data changes
watch(
  () => props.data,
  (newData) => {
    mapInstance.value?.getSource(sourceId)?.setData(newData);
  },
);
</script>
```

### Layer Components (FillLayer, CircleLayer, LineLayer, SymbolLayer)

**Responsibilities**:

- Create typed layer with styling
- Attach to GeoJSON source
- Handle reactive style updates
- Focus on performance (no unnecessary re-renders)

**Pattern**:

```vue
<script setup>
const mapInstance = inject(MapProvideKey);
const { setStyle } = useCreateFillLayer({ map: mapInstance, source: sourceId });

// Apply style reactively
watch(
  () => props.style,
  (newStyle) => {
    setPaint(newStyle);
  },
);
</script>
```

### Control Components (Marker, PopUp, GeolocateControls)

**Responsibilities**:

- Wrap MapLibre GL controls/overlays
- Handle Vue reactivity
- Provide event hooks

**Pattern**:

```vue
<script setup>
const mapInstance = inject(MapProvideKey);
const markerInstance = (ref < Marker) | (null > null);

onMounted(() => {
  markerInstance.value = new Marker(options)
    .setLngLat(props.lnglat)
    .addTo(mapInstance.value);
});
</script>
```

## Composable Architecture

### Map Management Composables

#### `useCreateMaplibre(elRef, styleRef, props)`

**Purpose**: Create and manage a MapLibre instance.

**Returns**:

```typescript
{
  mapInstance: ComputedRef<Map | null>,
  mapCreationStatus: ComputedRef<MapCreationStatus>,
  isMapReady: ComputedRef<boolean>,
  isMapLoading: ComputedRef<boolean>,
  hasMapError: ComputedRef<boolean>,
  setStyle, setCenter, setZoom, ... // Camera setters
}
```

**Usage Pattern**:

```typescript
const mapContainer = ref<HTMLElement>();
const { mapInstance, isMapReady, setCenter, setZoom } = useCreateMaplibre(
  mapContainer,
  styleRef,
  {
    center: [0, 0],
    zoom: 6,
    onLoad: (map) => console.log('Map ready'),
  },
);

watch(isMapReady, () => {
  // Now safe to use mapInstance.value
});
```

#### `useMaplibre()`

**Purpose**: Access the map context in child components.

**Returns**:

```typescript
{
  mapInstance: ComputedRef<Map | null>,
  mapStatus: ComputedRef<MapCreationStatus>,
  isMapReady: ComputedRef<boolean>,
  ...
}
```

**Usage Pattern**:

```typescript
// In any component nested under Maplibre
const { mapInstance, isMapReady } = useMaplibre();

// Safe because useMaplibre validates context exists
```

### Animation Composables

All animation composables follow the same pattern via the factory:

#### `useFlyTo(props)`

**Returns**:

```typescript
{
  flyTo: (target: CameraOptions) => Promise<void>,
  isAnimating: boolean,
  animationStatus: AnimationStatus
}
```

**Usage Pattern**:

```typescript
const { flyTo, isFlying } = useFlyTo({ map: mapInstance });

try {
  await flyTo({ center: [0, 0], zoom: 10 });
  console.log('Animation complete');
} catch (error) {
  console.error('Animation failed', error);
}
```

**Completes on**: `moveend` event, optional timeout support

#### Other Animation Composables

- `useEaseTo()` - Smooth easing animation (completes on `moveend`)
- `useJumpTo()` - Instant camera jump (completes immediately)
- `useFitBounds()` - Zoom to bounds (completes on `moveend`)
- `useCameraForBounds()` - Get optimal camera position (returns synchronously)
- `useZoomTo()` - Change zoom level (completes on `zoomend`)
- `usePanBy()` / `usePanTo()` - Pan map (completes on `moveend`)

### Event Listener Composables

All event listener composables use the factory:

#### `useMapEventListener(props)`

Every event-listener composable takes a single props object — `map`, `event`,
the `on` handler, and optional `once` / `debug`. There is no positional
`(event, handler, options)` form.

**Returns**:

```typescript
{
  removeListener: () => void,
  attachListener: () => void,
  isListenerAttached: ComputedRef<boolean>,
  listenerStatus: ComputedRef<EventListenerStatus>
}
```

**Usage Pattern**:

```typescript
const handleClick = (e: MapMouseEvent) => {
  console.log('Map clicked at', e.lngLat);
};

const { isListenerAttached } = useMapEventListener({
  map: mapInstance,
  event: 'click',
  on: handleClick,
});

// Listener automatically attached and cleaned up
```

#### `useLayerEventListener(props)`

**Purpose**: Listen to layer events with feature access.

**Handler Type**:

```typescript
type LayerClickHandler = (
  e: MapMouseEvent & { features?: GeoJSON.Feature[] },
) => void;
```

**Usage Pattern**:

```typescript
const handleLayerClick = (e: MapMouseEvent & { features?: Feature[] }) => {
  e.features?.forEach((feature) => {
    console.log('Feature clicked:', feature.properties);
  });
};

const { isListenerAttached, layerId } = useLayerEventListener({
  map: mapInstance,
  layer: 'my-layer',
  event: 'click',
  on: handleLayerClick,
});
```

#### `useGeolocateEventListener(props)`

**Purpose**: Listen to geolocation control events.

**Events**: `geolocate`, `error`, `outofmaxbounds`, `trackuserlocationstart`, `trackuserlocationend`

### Source Composables

#### `useCreateGeoJsonSource(props)`

**Returns**:

```typescript
{
  sourceInstance: ShallowRef<GeoJSONSource | null>,
  setData: (data: GeoJSON.Feature[]) => void,
  updateFeature: (id: any, newProperties: any) => void,
  getFeatures: () => Feature[] | undefined
}
```

**Usage Pattern**:

```typescript
const { sourceInstance, setData } = useCreateGeoJsonSource(
  mapInstance,
  'cities',
  citiesData,
);

// Update data reactively
watch(
  () => filters.region,
  (newRegion) => {
    const filtered = allCities.filter((c) => c.region === newRegion);
    setData(filtered);
  },
);
```

### Layer Composables

#### `useCreateFillLayer(props)`

**Returns**:

```typescript
{
  layerInstance: ShallowRef<Layer | null>,
  setPaint: (paint: FillPaint) => void,
  setLayout: (layout: FillLayout) => void,
  setFilter: (filter: FilterSpecification) => void,
  setOpacity: (opacity: number) => void,
  remove: () => void
}
```

**Type Safety**: `setPaint` only accepts `FillPaint` types (compile-time validation)

**Usage Pattern**:

```typescript
const { setPaint, setFilter } = useCreateFillLayer(
  mapInstance,
  'cities-source',
  'cities-layer',
);

// Type-safe property updates
setPaint({
  'fill-color': '#088',
  'fill-opacity': 0.8,
});

// Reactive filter updates
watch(
  () => selectedRegion.value,
  (region) => {
    setFilter(['==', 'region', region]);
  },
);
```

#### Other Layer Composables

- `useCreateCircleLayer()` - Circle layer with type-safe `CirclePaint` properties
- `useCreateLineLayer()` - Line layer with type-safe `LinePaint` properties
- `useCreateSymbolLayer()` - Symbol layer with type-safe `SymbolPaint` properties
- `useLayer()` - Generic layer composable for advanced use cases

## Type System

### Type Hierarchy

```
MapLibre GL Types (maplibre-gl package)
    │
    ├─► MapOptions, Map, Layer, Source
    ├─► LayerSpecification, LayerPaint, LayerLayout
    ├─► MapMouseEvent, MapTouchEvent
    └─► ... (50+ types)
         │
Vue3-MapLibre GL Extended Types
    │
    ├─► MaplibreActions (component register callback)
    ├─► CreateMaplibreActions (composable return type)
    ├─► FillPaint, CirclePaint, LinePaint, SymbolPaint
    ├─► MapClickHandler, LayerClickHandler, GeolocateHandler
    └─► ... (30+ types)
```

### Event Handler Types

New in v5 for better IDE support:

```typescript
export type MapClickHandler = (e: MapMouseEvent) => void;
export type LayerClickHandler = (
  e: MapMouseEvent & { features?: Feature[] },
) => void;
export type GeolocateHandler = (e: GeolocateSuccess) => void;
```

### Generic Type Preservation

```typescript
// Layer composables use generic types to preserve type info
export function useCreateFillLayer<
  T extends FillLayerSpecification = FillLayerSpecification,
>(
  map: MaybeRef<Map | null>,
  sourceId: string,
  layerId?: string,
  style?: T['paint'],
): CreateLayerActions<FillLayerSpecification>;
```

## Performance Considerations

### Memory Management

| Strategy            | Benefit                                     |
| ------------------- | ------------------------------------------- |
| `shallowRef`        | Prevents Vue from wrapping MapLibre objects |
| `markRaw`           | Opts out of Vue's reactivity system         |
| Event deduplication | Prevents duplicate listeners via factory    |
| Explicit cleanup    | No hanging closures or references           |
| Lazy loading        | Import only what you need (tree-shakeable)  |

### Rendering Optimization

- Components use `shallowRef` for MapLibre instances
- Animations complete automatically (no polling)
- Event listeners cleaned up on unmount (guard against memory leaks)
- No unnecessary Vue reactivity tracking on native objects

### Bundle Size

- Tree-shakeable exports enable dead-code elimination
- Factory consolidation reduces generated code
- CSS extracted and optimized
- Build output: UMD 20 KB gzipped, ES entry chunks 2 KB gzipped, with
  `maplibre-gl` externalized in both

## SSR/Nuxt Integration

### SSR Challenges & Solutions

| Challenge                 | Solution                                 |
| ------------------------- | ---------------------------------------- |
| WebGL context unavailable | `isBrowser` guard, ClientOnly wrapper    |
| window is undefined       | All `window.*` replaced with safe checks |
| Hydration mismatch        | Map rendered only on client              |
| Build config needed       | Nuxt module configures automatically     |

### Nuxt Module Features

The `nuxt-maplibre-gl` module (v1.0.0) handles:

1. **Auto-import** - Components and composables available without imports
2. **CSS auto-inject** - Styles loaded automatically
3. **Browser guards** - SSR-safe out of the box
4. **Transpilation** - vue3-maplibre-gl transpiled for SSR
5. **Build config** - maplibre-gl excluded from SSR bundle

### Usage in Nuxt

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-maplibre-gl'],
  maplibre: {
    css: true, // Auto-import CSS
    prefix: '', // Optional prefix for composables
  },
});
```

Then use components without imports:

```vue
<template>
  <ClientOnly>
    <Maplibre :options="mapOptions">
      <GeoJsonSource :data="data">
        <FillLayer :style="fillStyle" />
      </GeoJsonSource>
    </Maplibre>
  </ClientOnly>
</template>
```

## Error Handling

### Error Levels

| Level            | Handling                                            |
| ---------------- | --------------------------------------------------- |
| Setup Errors     | Throw immediately, prevent component mount          |
| Event Errors     | Log and set status to `Error`                       |
| Animation Errors | Reject promise and set status                       |
| Lifecycle Errors | Safe cleanup, set `hasMapError` flag                |
| Post-load Errors | Report via `error` / `onError`, keep the map usable |

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
const { mapInstance, isMapReady } = useMaplibre();

useCreateMaplibre(mapContainer, styleRef, {
  debug: true, // Enables console logging
  onError: (error) => console.error('Map error:', error),
});
```

## Extension Points

### Adding Custom Composables

```typescript
// Custom animation composable using factory
export function useCustomAnimation(map: MaybeRef<Map | null>) {
  return createCameraAnimation({
    map,
    debug: false,
  });
}
```

### Adding Custom Events

```typescript
// Custom event listener using factory
export function useCustomListener(target: MapInstance, handler: Callback) {
  return createEventListenerComposable({
    target,
    event: 'custom',
    on: handler,
    adapter: CustomAdapter,
  });
}
```

## Testing Architecture

### Test Coverage (27+ tests)

- **Event factories**: createEventListenerComposable tests
- **Animation factories**: createCameraAnimation tests
- **Layer property setters**: createPropertySetter tests
- **Component integration**: Vi jest framework

### Test Patterns

```typescript
// Test event decoration factory
describe('createEventListenerComposable', () => {
  it('should attach event listener idempotently', () => {
    // ...
  });

  it('should detach event listener safely', () => {
    // ...
  });

  it('should handle events with once flag', () => {
    // ...
  });
});
```

## Future Architecture

### Planned Enhancements

- **Layer clustering** tier: Three-level cluster optimization
- **Performance monitoring**: Composables for FPS/memory tracking
- **Custom projections**: Beyond Web Mercator
- **Advanced animations**: Keyframe animations, transition groups
- **Plugin system**: Custom composables registry
