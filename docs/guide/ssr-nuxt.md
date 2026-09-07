# SSR / Nuxt

vue3-maplibre-gl v5 is **SSR-safe out of the box**. Map creation is guarded with `isBrowser` checks and all `window.*` references have been removed.

## Why SSR Compatibility Matters

MapLibre GL requires:

- WebGL context (browser exclusive)
- DOM manipulation (render phase only)
- window/document APIs

Without SSR guards, rendering on the server would fail. Vue3 MapLibre GL v5 handles this automatically.

## Nuxt Module (Recommended) - v1.0.0

The official Nuxt module handles SSR configuration automatically. Install it for the best DX:

```bash
bun add nuxt-maplibre-gl
# or
npm install nuxt-maplibre-gl
```

### Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-maplibre-gl'],

  maplibre: {
    /**
     * Auto-import vue3-maplibre-gl CSS styles
     * @default true
     */
    css: true,

    /**
     * Prefix for auto-imported composables
     * Set to 'map' to use mapUseMaplibre, mapUseFlyTo, etc.
     * @default '' (no prefix)
     */
    prefix: '',
  },
});
```

### Module Features

The module automatically configures:

1. **CSS Auto-Import** - `maplibre-gl/dist/maplibre-gl.css` and `vue3-maplibre-gl/dist/style.css` injected
2. **Component Auto-Import** - All 10 components available without imports
3. **Composable Auto-Import** - All 15+ composables available without imports
4. **SSR Support** - Map components rendered only on client
5. **Build Configuration**:
   - vue3-maplibre-gl transpiled for SSR
   - maplibre-gl excluded from SSR bundle (requires WebGL)
   - vite.optimizeDeps.exclude configured

### Usage

With the module installed, use components and composables directly in templates/scripts without imports:

```vue
<template>
  <ClientOnly>
    <!-- Components available without imports -->
    <Maplibre :options="mapOptions" style="height: 500px">
      <GeoJsonSource :data="geoData">
        <FillLayer :style="fillStyle" />
      </GeoJsonSource>
    </Maplibre>
  </ClientOnly>
</template>

<script setup>
// No imports needed - all auto-imported by module
import { ref } from 'vue';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const geoData = ref({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { name: 'Center' },
    },
  ],
});

const fillStyle = ref({
  'fill-color': '#088',
  'fill-opacity': 0.8,
});

// Composables auto-imported
const { mapInstance, isMapReady } = useMaplibre();

watch(isMapReady, async () => {
  // Map is ready
  const { flyTo } = useFlyTo({ map: mapInstance });
  await flyTo({ center: [100, 50], zoom: 10 });
});
</script>
```

### Auto-Imported Composables

The Nuxt module auto-imports these composables by default:

```typescript
// Map Management
(useCreateMaplibre, useMaplibre, useMaplibreConfig);

// Camera Animations (7)
(useFlyTo,
  useEaseTo,
  useJumpTo,
  useFitBounds,
  useCameraForBounds,
  usePanBy,
  usePanTo,
  useZoomTo,
  // Zoom/Rotation (6)
  useZoomIn,
  useZoomOut,
  useRotateTo,
  useResetNorth,
  useResetNorthPitch,
  useSnapToNorth);

// Layers (4)
(useCreateFillLayer,
  useCreateCircleLayer,
  useCreateLineLayer,
  useCreateSymbolLayer);

// Events (3)
(useMapEventListener, useLayerEventListener, useGeolocateEventListener);

// Sources (2)
(useCreateGeoJsonSource, useGeoJsonSource);

// Controls
useGeolocateControl;
```

### Auto-Imported Components

```typescript
// Core
(Maplibre, GeoJsonSource);

// Layers (4)
(FillLayer, CircleLayer, LineLayer, SymbolLayer);

// Overlays
(Marker, PopUp, Image);

// Controls
GeolocateControls;
```

### Using Composable Prefix

Optionally add a prefix to avoid conflicts:

```typescript
// nuxt.config.ts
maplibre: {
  prefix: 'map',
}
```

Then use with prefix:

```typescript
// Composables now prefixed
mapUseMaplibre(); // instead of useMaplibre()
mapUseFlyTo(); // instead of useFlyTo()
mapUseMapEventListener(); // instead of useMapEventListener()
```

## Manual Setup (Without Module)

If you prefer not to use the module, follow these steps:

### 1. Install Package

```bash
bun add vue3-maplibre-gl
```

### 2. Configure Nuxt

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['maplibre-gl/dist/maplibre-gl.css', 'vue3-maplibre-gl/dist/style.css'],
  build: {
    transpile: ['vue3-maplibre-gl'],
  },
  vite: {
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
  },
});
```

### 3. Wrap Components in ClientOnly

```vue
<template>
  <!-- Critical: Wrap map components in ClientOnly -->
  <ClientOnly>
    <Maplibre :options="mapOptions" style="height: 500px">
      <GeoJsonSource :data="geoData">
        <FillLayer :style="fillStyle" />
      </GeoJsonSource>
    </Maplibre>
  </ClientOnly>
</template>

<script setup>
import { ref } from 'vue';
import {
  Maplibre,
  GeoJsonSource,
  FillLayer,
  useMaplibre,
  useFlyTo,
} from 'vue3-maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'vue3-maplibre-gl/dist/style.css';

// ... rest of component
</script>
```

## SSR Internals

Understanding what happens under the hood:

### Browser Guards

All components check `isBrowser` before creating map instances:

```typescript
import { isBrowser } from 'vue3-maplibre-gl';

if (isBrowser) {
  // Safe to create MapLibre instance
  const map = new Map({ container: el, style: 'url' });
}
// On server: skipped, no error
```

### maplibre-gl Exclusion

The maplibre-gl package is excluded from SSR bundling:

```typescript
// Usually removed from server bundle
import { Map, GeoJSONSource } from 'maplibre-gl';
// Server: import fails gracefully (never called)
// Client: import succeeds (WebGL available)
```

### ClientOnly Wrapper

Ensures components only render in the browser:

```vue
<ClientOnly>
  <!-- Rendered only on client -->
  <Maplibre ... />
</ClientOnly>
<!-- Fallback shown during hydration -->
```

## Deployment Considerations

### Nuxt SSR Deployment (Cloudflare, Vercel, Netlify, etc.)

1. **Module handles everything** - Deploy as normal
2. **Check build logs** - Verify maplibre-gl excluded from server build
3. **Test locally first** - `nuxi generate` for static generation

### Hybrid Rendering (Nuxt)

Use route rules for optimal performance:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/maps/**': { swr: 3600 }, // ISR: revalidate hourly
  },
});
```

### Static Generation (SSG)

Maps can't be pre-rendered (client-only), use hybrid rendering:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      crawlLinks: true,
      // Exclude map routes from prerendering
      ignore: ['/maps'],
    },
  },
});
```

## Troubleshooting

### "window is not defined"

**Cause**: Map component rendered on server

**Fix**: Wrap in `<ClientOnly>`

```vue
<ClientOnly>
  <Maplibre ... />
</ClientOnly>
```

### "WebGL context lost"

**Cause**: Usually transient, map recovers automatically

**Fix**: Use `onError` callback to recover

```vue
<Maplibre :options="options" @error="handleMapError" />
```

### "maplibre-gl not found"

**Cause**: Not transpiled for SSR

**Fix**: Configure Nuxt

```typescript
build: {
  transpile: ['vue3-maplibre-gl'],
}
```

## Performance Tips

1. **Lazy load maps** - Use dynamic imports for map pages
2. **Use route preloading** - Prefetch map routes
3. **Optimize GeoJSON** - Simplify geometries before sending
4. **Enable data compression** - gzip GeoJSON responses
5. **Cache styles** - Browser cache map styles (long TTL)

## Further Reading

- [Nuxt SSR Documentation](https://nuxt.com/docs/guide/concepts/rendering)
- [MapLibre GL Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [Nuxt Module Authoring](https://nuxt.com/docs/guide/going-further/modules)

```vue
<template>
  <ClientOnly>
    <Maplibre :options="mapOptions" style="height: 500px">
      <GeoJsonSource :data="geoData">
        <FillLayer :style="fillStyle" />
      </GeoJsonSource>
    </Maplibre>
  </ClientOnly>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, GeoJsonSource, FillLayer } from 'vue3-maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'vue3-maplibre-gl/dist/style.css';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const geoData = ref({ type: 'FeatureCollection', features: [] });
const fillStyle = ref({ 'fill-color': '#088', 'fill-opacity': 0.8 });
</script>
```

## Nuxt Config

If you encounter SSR build errors with maplibre-gl, add it to `noExternal`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
  },
  // Transpile the library for SSR
  build: {
    transpile: ['vue3-maplibre-gl'],
  },
});
```

## How It Works

The library uses a simple `isBrowser` guard:

```typescript
// Exported from vue3-maplibre-gl
export const isBrowser =
  typeof window !== 'undefined' && typeof document !== 'undefined';
```

This guard is checked before:

- Map creation (`useCreateMaplibre`)
- Marker creation (`useCreateMarker`)
- Popup creation (`useCreatePopup`)

During SSR, these composables return early without creating DOM elements or WebGL contexts.

## Vue SPA (Non-Nuxt)

No special configuration needed. The library works normally in Vue SPA mode since `isBrowser` is always `true` in the browser.
