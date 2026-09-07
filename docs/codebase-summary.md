# Codebase Summary

## Project Overview

**vue3-maplibre-gl** is a comprehensive Vue 3 component library for MapLibre GL JS with 10 components, 38 composables, full TypeScript support, and Nuxt integration.

**Repository**: [danh121097/vue-maplibre-gl](https://github.com/danh121097/vue-maplibre-gl)
**Main Package**: `vue3-maplibre-gl@6.0.1` (npm)
**Nuxt Module**: `nuxt-maplibre-gl@2.0.0` (npm)

## Directory Structure

```
vue-maplibre-gl/ (root)
├── libs/                          # Main library source (v5)
│   ├── components/                # Vue 3 components
│   │   ├── Maplibre.vue          # Root map component
│   │   ├── GeoJsonSource.vue      # GeoJSON data source
│   │   ├── FillLayer.vue          # Fill layer component
│   │   ├── CircleLayer.vue        # Circle layer component
│   │   ├── LineLayer.vue          # Line layer component
│   │   ├── SymbolLayer.vue        # Symbol/text layer
│   │   ├── Marker.vue             # Map markers
│   │   ├── Popup.vue              # Map popups
│   │   ├── Image.vue              # Image layers
│   │   ├── GeolocateControls.vue # Geolocation control
│   │   └── index.ts               # Component exports
│   ├── composables/               # Composition API hooks
│   │   ├── map/                   # Map management composables
│   │   │   ├── useCreateMaplibre.ts       # Create map instance
│   │   │   ├── useMaplibre.ts            # Access map context
│   │   │   ├── useMaplibreConfig.ts      # Configure map
│   │   │   ├── useLayer.ts               # Generic layer composable
│   │   │   ├── useCreateMarker.ts        # Create markers
│   │   │   ├── useCreatePopup.ts         # Create popups
│   │   │   ├── useCreateImage.ts         # Create image layers
│   │   │   └── useGeoJsonSource.ts       # Access GeoJSON context
│   │   ├── event/                 # Event listener composables
│   │   │   ├── create-event-listener-composable.ts  # Factory
│   │   │   ├── useMapEventListener.ts                # Map events
│   │   │   ├── useLayerEventListener.ts              # Layer events
│   │   │   ├── useGeolocateEventListener.ts          # Geolocate events
│   │   │   ├── useMapReloadEvent.ts                  # Reload handling
│   │   │   └── __tests__/                            # Event tests
│   │   ├── layers/                # Layer composables (typed)
│   │   │   ├── useCreateFillLayer.ts         # Fill layer
│   │   │   ├── useCreateCircleLayer.ts       # Circle layer
│   │   │   ├── useCreateLineLayer.ts         # Line layer
│   │   │   ├── useCreateSymbolLayer.ts       # Symbol layer
│   │   │   ├── create-layer-property-setters.ts  # Factory
│   │   │   ├── layer-style-config.ts             # Layer config
│   │   │   └── __tests__/                        # Layer tests
│   │   ├── control/               # Control composables
│   │   │   ├── useGeolocateControl.ts
│   │   │   └── index.ts
│   │   ├── utils/                 # Animation utilities
│   │   │   ├── useFlyTo.ts        # Animated flight
│   │   │   ├── useEaseTo.ts       # Easing animation
│   │   │   ├── useJumpTo.ts       # Instant jump
│   │   │   ├── useFitBounds.ts    # Fit to bounds
│   │   │   ├── useCameraForBounds.ts  # Get camera for bounds
│   │   │   ├── useZoomTo.ts       # Change zoom
│   │   │   ├── useZoomIn.ts       # Zoom step up
│   │   │   ├── useZoomOut.ts      # Zoom step down
│   │   │   ├── usePan.ts          # Pan animations
│   │   │   ├── useRotation.ts     # Rotation controls
│   │   │   ├── create-camera-animation.ts  # Factory
│   │   │   ├── camera-animation-types.ts   # Type definitions
│   │   │   └── __tests__/         # Animation tests
│   │   ├── sources/               # Source composables
│   │   │   ├── useCreateGeoJsonSource.ts
│   │   │   └── index.ts
│   │   ├── utils-composable/      # Utility composables
│   │   │   ├── useLogger.ts       # Debug logging
│   │   │   ├── useOptimizedComputed.ts  # Optimized computed
│   │   │   └── index.ts
│   │   └── index.ts               # Composable exports
│   ├── enums/                     # Enum definitions
│   │   ├── MaplibreEnum.ts        # Map/layer enums
│   │   ├── MaplibreLayerEnum.ts   # Layer type enum
│   │   ├── MapProvideKey.ts       # Provide/inject keys
│   │   └── index.ts               # Enum exports
│   ├── types/                     # TypeScript type definitions
│   │   ├── index.ts               # Main type exports
│   │   ├── event-handler-types.ts # Event handler types
│   │   └── [MapLibre GL re-exports]
│   ├── helpers/                   # Utility functions
│   │   ├── ssr-guard.ts           # SSR safety checks
│   │   ├── index.ts               # Helper exports
│   │   └── logging.ts             # Logging utilities
│   ├── style.css                  # Component styles (bundled)
│   ├── index.ts                   # Main library export
│   └── test-utils.ts              # Test utilities
├── nuxt/                          # Nuxt module (v1.0.0)
│   ├── src/
│   │   ├── module.ts              # Nuxt module setup
│   │   └── runtime/
│   │       └── plugins/
│   │           └── maplibre-gl.client.ts  # Client plugin
│   ├── playground/                # Nuxt playground
│   │   ├── nuxt.config.ts
│   │   └── app.vue
│   ├── package.json
│   └── build/                     # Built distribution
├── examples/                      # Vue example application
│   ├── src/
│   │   ├── components/            # Example components
│   │   ├── views/
│   │   │   └── Home.vue          # Main example
│   │   ├── router/                # Vue Router setup
│   │   ├── styles/                # Example styles
│   │   ├── App.vue                # Root component
│   │   └── main.ts                # Entry point
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
├── docs/                          # VitePress documentation
│   ├── .vitepress/                # VitePress config
│   │   ├── config.ts              # Site configuration
│   │   ├── theme/                 # Custom theme
│   │   │   ├── index.js
│   │   │   └── style.css
│   ├── public/                    # Static assets copied to dist root
│   │   └── _headers               # Cloudflare Pages cache-control rules
│   ├── index.md                   # Home page
│   ├── changelog.md               # Release notes
│   ├── api/                       # API reference
│   │   ├── components.md          # Component API
│   │   ├── composables.md         # Composable API
│   │   └── types.md               # Type reference
│   ├── guide/                     # User guides
│   │   ├── getting-started.md
│   │   ├── installation.md
│   │   ├── configuration.md
│   │   ├── basic-usage.md
│   │   ├── composables-overview.md
│   │   ├── migration-v5.md
│   │   └── ssr-nuxt.md
│   └── examples/                  # Usage examples
│       ├── index.md
│       ├── basic-map.md
│       ├── markers.md
│       ├── layers.md
│       └── controls.md
├── types/                         # Global type definitions
│   ├── module.d.ts                # TypeScript module augmentation
│   └── maplibre.d.ts              # MapLibre GL types
├── .github/                       # GitHub configuration
│   └── workflows/                 # CI/CD workflows
│       ├── ci.yml                 # Run tests
│       ├── deploy-docs.yml        # Deploy VitePress docs to Cloudflare Pages
│       ├── publish-npm.yml        # Publish packages
│       └── release.yml            # Release management
├── package.json                   # Root package (monorepo)
├── nuxt/package.json              # Nuxt module package
├── vite.config.ts                 # Vite configuration
├── vitest.config.ts               # Vitest configuration
├── tsconfig.json                  # TypeScript configuration
├── README.md                      # Project README
└── LICENSE                        # MIT License
```

## Key Statistics

Measured, not estimated. Re-measure before quoting these anywhere public.

| Metric                  | Count                            |
| ----------------------- | -------------------------------- |
| **Components**          | 10                               |
| **Composables**         | 38                               |
| **Unit Tests**          | 107 across 19 files              |
| **Documentation Pages** | 23 Markdown pages under `docs`   |
| **Lines of Code**       | 11,153 in `libs`, tests excluded |

## Component Reference

### 1. Maplibre

- **File**: `libs/components/Maplibre.vue`
- **Purpose**: Root map component, provides map context
- **Props**: `options`, `register`, `debug`, `autoCleanup`, `containerId`, `containerClass`, `onError`, `onLoad`
- **Events**: `load`, `error`, `click`, `move`, `zoom` + 40+ MapLibre events
- **Slots**: `default`, `loading`, `error`

### 2. GeoJsonSource

- **File**: `libs/components/GeoJsonSource.vue`
- **Purpose**: GeoJSON data source provider
- **Props**: `id`, `data`, `options`, `debug`, `autoCleanup`, `register`, `onLoad`, `onError`, `onDataUpdate`
- **Events**: `register`, `load`, `error`, `data-update`

### 3. FillLayer

- **File**: `libs/components/FillLayer.vue`
- **Purpose**: Render polygon/fill geometries
- **Props**: `id`, `sourceId`, `style`, `filter`, `register`, `debug`
- **Type Safety**: FillPaint/FillLayout types preserved

### 4. CircleLayer

- **File**: `libs/components/CircleLayer.vue`
- **Purpose**: Render point geometries as circles
- **Props**: `id`, `sourceId`, `style`, `filter`, `register`, `debug`
- **Type Safety**: CirclePaint/CircleLayout types preserved

### 5. LineLayer

- **File**: `libs/components/LineLayer.vue`
- **Purpose**: Render line geometries
- **Props**: `id`, `sourceId`, `style`, `filter`, `register`, `debug`
- **Type Safety**: LinePaint/LineLayout types preserved

### 6. SymbolLayer

- **File**: `libs/components/SymbolLayer.vue`
- **Purpose**: Render text labels and icons
- **Props**: `id`, `sourceId`, `style`, `filter`, `register`, `debug`
- **Type Safety**: SymbolPaint/SymbolLayout types preserved

### 7. Marker

- **File**: `libs/components/Marker.vue`
- **Purpose**: Add markers to map
- **Props**: `lnglat`, `draggable`, `popup`, `register`, `debug`
- **Events**: `dragstart`, `drag`, `dragend`

### 8. PopUp

- **File**: `libs/components/Popup.vue`
- **Purpose**: Display popup overlays
- **Props**: `lnglat`, `show`, `closeButton`, `closeOnClick`, `maxWidth`
- **Slots**: `default` for popup content

### 9. Image

- **File**: `libs/components/Image.vue`
- **Purpose**: Add static or dynamic images to map
- **Props**: `id`, `url`, `coordinates`, `register`
- **Features**: Supports URL updates, canvas images

### 10. GeolocateControls

- **File**: `libs/components/GeolocateControls.vue`
- **Purpose**: User geolocation control with tracking
- **Props**: `position`, `debug`, `trackUserLocation`, `register`
- **Events**: `geolocate`, `error`, `outofmaxbounds`

## Composable Reference

### Map Management

#### `useCreateMaplibre(elRef, styleRef, props)`

- Creates MapLibre GL JS instance
- Returns: `mapInstance`, `mapCreationStatus`, `isMapReady`, camera setters —
  every state field is a `ComputedRef`, read it with `.value` in script
- SSR compatible with browser guards

#### `useMaplibre()`

- Accesses map context in child components
- Returns: the same setters and accessors, with `mapStatus` in place of
  `mapCreationStatus` and no lifecycle methods
- Throws if not within Maplibre component

#### `useMaplibreConfig(options?)`

- Reactively configure map options
- Updates: zoom, center, bearing, pitch, bounds

### Camera Animations

All share common pattern via factory:

- `useFlyTo()` - Smooth flight animation (default: 2s)
- `useEaseTo()` - Easing curve animation
- `useJumpTo()` - Instant position change
- `useFitBounds()` - Zoom to fit bounds
- `useCameraForBounds()` - Get optimal camera
- `useZoomTo()` - Change zoom level
- `usePanBy()` - Pan by offset
- `usePanTo()` - Pan to location

**Pattern**: `await animation({ center: [...], zoom: 10 })`

### Zoom & Rotation

- `useZoomIn()` - Step zoom (+1)
- `useZoomOut()` - Step zoom (-1)
- `useRotateTo()` - Rotate to bearing
- `useResetNorth()` - Reset bearing to 0
- `useResetNorthPitch()` - Reset bearing & pitch
- `useSnapToNorth()` - Snap to nearest north angle

### Layer Management

All with type safety via generics:

- `useCreateFillLayer()` - Create fill layers
- `useCreateCircleLayer()` - Create circle layers
- `useCreateLineLayer()` - Create line layers
- `useCreateSymbolLayer()` - Create symbol layers
- `useLayer()` - Generic layer composable

**Returns**: `setPaint()`, `setLayout()`, `setFilter()`, `remove()`

### Event Listeners

All via factory with adapter pattern:

- `useMapEventListener()` - Listen to map events
- `useLayerEventListener()` - Listen to layer events with features
- `useGeolocateEventListener()` - Listen to geolocation events
- `useMapReloadEvent()` - Handle map reload/error scenarios

**Pattern**: Auto-attach on setup, auto-detach on unmount

### Data Sources

- `useCreateGeoJsonSource()` - Create GeoJSON sources
- `useGeoJsonSource()` - Access current source context

### Controls

- `useGeolocateControl()` - Programmatic geolocation

### Utilities

- `useCreateMarker()` - Create markers programmatically
- `useCreatePopup()` - Create popups programmatically
- `useCreateImage()` - Add images to map

## Factory Functions

### createEventListenerComposable

- **File**: `libs/composables/event/create-event-listener-composable.ts`
- **Purpose**: Generic factory for event listener composables
- **Used by**: `useMapEventListener`, `useLayerEventListener`, `useGeolocateEventListener`
- **Pattern**: Adapter pattern for different event targets
- **Features**: Idempotent attach/detach, status tracking, cleanup

### createCameraAnimation

- **File**: `libs/composables/utils/create-camera-animation.ts`
- **Purpose**: Generic factory for camera animations
- **Used by**: `useFlyTo`, `useEaseTo`, `usePanBy`, etc.
- **Pattern**: Promise wrapping with completion events
- **Features**: Optional timeout, status tracking, error handling

### createPropertySetter

- **File**: `libs/composables/layers/create-layer-property-setters.ts`
- **Purpose**: Generic factory for layer property updates
- **Used by**: All 4 layer composables
- **Pattern**: Type-safe generic setters for paint/layout properties
- **Features**: Batch updates, validation, react to changes

## Type System

### Core Types

- `Nullable<T>` - T or null
- `Undefinedable<T>` - T or undefined
- `CreateMaplibreActions` - Map creation actions interface
- `MaplibreActions` - Extended actions with registration
- `MaplibreMethods` - Full map manipulation methods

### Layer Types

- `FillLayerStyle` - Union of FillLayout + FillPaint
- `CircleLayerStyle` - Union of CircleLayout + CirclePaint
- `LineLayerStyle` - Union of LineLayout + LinePaint
- `SymbolLayerStyle` - Union of SymbolLayout + SymbolPaint
- `AnyLayout` - Union of all layout types
- `AnyPaint` - Union of all paint types

### Event Handler Types (v5+)

```typescript
export type MapClickHandler = (e: MapMouseEvent) => void;
export type LayerClickHandler = (
  e: MapMouseEvent & { features?: Feature[] },
) => void;
export type GeolocateHandler = (e: GeolocateSuccess) => void;
```

### Status Enums

- `MapCreationStatus` - Map lifecycle state
- `EventListenerStatus` - Event attachment state
- `AnimationStatus` - Animation execution state

## Build & Packaging

### Build Configuration

- **Tool**: Vite with TypeScript
- **Output**: ESM, UMD, CJS, type definitions
- **CSS**: Extracted and optimized

### Package Configuration

**Main Package** (`libs/`):

- **Name**: `vue3-maplibre-gl`
- **Version**: `5.0.0`
- **Main**: `dist/index.js` (ESM default)
- **UMD**: `dist/index.umd.cjs`
- **Exports**: Named exports, subpaths for components/composables

**Nuxt Module** (`nuxt/`):

- **Name**: `nuxt-maplibre-gl`
- **Version**: `1.0.0`
- **Auto-imports**: Components and composables
- **Features**: CSS auto-inject, SSR support

## Testing Infrastructure

### Test Framework

- **Framework**: Vitest
- **Configuration**: `vitest.config.ts`
- **Test Files**: `__tests__/` directories

### Test Coverage (107 tests across 19 files)

- `create-event-listener-composable.test.ts` - Factory pattern tests
- `create-layer-property-setters.test.ts` - Type preservation tests
- `create-camera-animation.test.ts` - Animation tests
- Additional integration and component tests

## Documentation

### VitePress Site

- **Entry**: `docs/index.md`
- **API Docs**: Component and composable references
- **Guides**: Step-by-step tutorials
- **Examples**: Runnable code examples
- **Changelog**: Release notes for all versions

### Key Documentation Files

- `docs/project-overview-pdr.md` - Project vision and requirements
- `docs/system-architecture.md` - Architecture and patterns
- `docs/code-standards.md` - Development guidelines
- `docs/guide/migration-v5.md` - Upgrade guide

## CI/CD Workflows

### Automated Checks

- **ci.yml**: Run tests on every PR
- **deploy-docs.yml**: Deploy VitePress docs to Cloudflare Pages (`vue-maplibre-gl.pages.dev`) via `wrangler-action`; cache headers from `docs/public/_headers`
- **publish-npm.yml**: Publish to npm registry
- **release.yml**: Automated release management

## External Dependencies

### Main Package

Both runtime dependencies are peers, so the app owns the versions:

- **Vue**: `^3.0.0` (peer)
- **MapLibre GL JS**: `^5.6.1` (peer)
- **TypeScript**: `^5.4.5` (dev — build and type generation)

### Nuxt Module

- **@nuxt/kit**: `^3.15.0`
- **Nuxt**: `>=3.0.0` (peer)
- **maplibre-gl** and **vue3-maplibre-gl**: direct dependencies, so a Nuxt app
  installs one package and is unaffected by the peer change in v6.

## Performance Characteristics

### Bundle Size

Measured on the built `dist`. `maplibre-gl` is externalized in both builds, so
it is not counted here.

| Artifact              | Raw    | Gzipped |
| --------------------- | ------ | ------- |
| UMD (`index.umd.cjs`) | 84 KB  | 20 KB   |
| ES entry chunks       | 8.4 KB | 2.0 KB  |
| `style.css`           | 78 B   | —       |

The ES build is split per module, so an app pays only for what it imports.

### Memory and Rendering

Nothing here is benchmarked, so no figures are claimed. What the code does do:

- `shallowRef` and `markRaw` keep MapLibre objects out of Vue's reactive graph
- every composable removes its listeners and destroys its native object on scope
  dispose
- watchers compare by reference rather than walking feature collections deeply

## Compatibility

### Vue Versions

- Vue `^3.0.0` (peer; Composition API required)
- Vue 2: Not supported

### Node Versions

- Node 16+ (ESM support)
- Node 18+ (recommended)

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+
- Mobile: iOS Safari 15+, Chrome Android

### Framework Support

- **Nuxt 3** with full SSR/SSG support
- **Vite** projects
- **Webpack 5**+ projects
- **Next.js** via custom setup

## Migration Path

- **v4 → v5**: Zero breaking changes, internal refactor only
- **v5 → v6**: Breaking. Composables return refs, `maplibre-gl` became a peer
  dependency, and the stylesheets separated. See
  [the v6 migration guide](./guide/migration-v6.md).

## Known Limitations

1. **Expressions**: No IDE type hints for MapLibre expressions
2. **Style Functions**: Limited JS function support (use expressions)
3. **Private APIs**: Some MapLibre GL internals may change
4. **WebGL**: No canvas fallback

## Future Roadmap

Owned by [`project-roadmap.md`](./project-roadmap.md), which tracks candidates
against verified gaps. Duplicating the list here only produces two versions that
disagree.
