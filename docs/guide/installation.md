# Installation

## Package Manager Installation

Vue3 MapLibre GL is available on npm and can be installed using your preferred package manager. The package includes all dependencies and is self-contained with bundled CSS.

### Using Yarn (Recommended)

```bash
yarn add vue3-maplibre-gl
```

### Using npm

```bash
npm install vue3-maplibre-gl
```

### Using pnpm

```bash
pnpm add vue3-maplibre-gl
```

## CDN Installation

You can also use Vue MapLibre GL directly from a CDN:

```html
<!-- Vue MapLibre GL (includes MapLibre GL JS) -->
<script src="https://unpkg.com/vue3-maplibre-gl@latest/dist/index.umd.cjs"></script>
<link
  href="https://unpkg.com/vue3-maplibre-gl@latest/dist/style.css"
  rel="stylesheet"
/>
```

## Setup in Vue 3

### Global Registration

Register the components globally in your main.js:

```js
import { createApp } from 'vue';
import VueMapLibreGl from 'vue3-maplibre-gl';
import 'vue3-maplibre-gl/dist/style.css';

const app = createApp(App);
app.use(VueMapLibreGl);
app.mount('#app');
```

### Local Registration (Recommended)

Import components as needed in your components for better tree-shaking:

```vue
<script setup>
import {
  Mapbox,
  GeoJsonSource,
  FillLayer,
  CircleLayer,
  Marker,
  PopUp,
} from 'vue3-maplibre-gl';
import 'vue3-maplibre-gl/dist/style.css';
</script>
```

### Available Components

All components are exported from the main package:

```js
import {
  // Main Components
  Mapbox,
  GeoJsonSource,

  // Layer Components
  FillLayer,
  CircleLayer,
  LineLayer,
  SymbolLayer,

  // Interactive Components
  Marker,
  PopUp,

  // Utility Components
  Image,
  GeolocateControls,

  // Composables
  useCreateMapbox,
  useMapbox,
  useCreateGeoJsonSource,
  useGeoJsonSource,
  useCreateFillLayer,
  useCreateCircleLayer,
  useCreateLineLayer,
  useCreateSymbolLayer,
  useGeolocateControl,
  useMapEventListener,
  useLayerEventListener,
  useFlyTo,
  useEaseTo,
  useJumpTo,
  useBounds,
  useZoom,
  useLogger,
} from 'vue3-maplibre-gl';
```

## TypeScript Support

Vue MapLibre GL includes full TypeScript support. If you're using TypeScript, you'll get automatic type checking and IntelliSense support.

### Type Definitions

The package includes comprehensive type definitions for:

- All component props and events
- MapLibre GL JS types
- Composable return types
- Configuration options

### Example with TypeScript

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Mapbox, GeoJsonSource, FillLayer } from 'vue3-maplibre-gl';
import type {
  LngLatLike,
  StyleSpecification,
  FillLayerStyle,
  GeoJSONSourceSpecification,
} from 'vue3-maplibre-gl';

const center = ref<LngLatLike>([0, 0]);
const mapStyle = ref<string | StyleSpecification>(
  'https://demotiles.maplibre.org/style.json',
);

const geoJsonData = ref<GeoJSONSourceSpecification['data']>({
  type: 'FeatureCollection',
  features: [],
});

const fillStyle = ref<FillLayerStyle>({
  'fill-color': '#088',
  'fill-opacity': 0.8,
});
</script>
```

### Type Definitions

Vue3 MapLibre GL exports comprehensive TypeScript definitions:

```typescript
// Component Props Types
import type {
  MapboxProps,
  GeoJsonSourceProps,
  FillLayerProps,
  CircleLayerProps,
  LineLayerProps,
  SymbolLayerProps,
  MarkerProps,
  PopUpProps,
} from 'vue3-maplibre-gl';

// Style Types
import type {
  FillLayerStyle,
  CircleLayerStyle,
  LineLayerStyle,
  SymbolLayerStyle,
} from 'vue3-maplibre-gl';

// Composable Types
import type {
  CreateMaplibreActions,
  CreateGeoJsonSourceActions,
  CreateLayerActions,
} from 'vue3-maplibre-gl';

// Re-exported MapLibre GL Types
import type {
  Map,
  LngLat,
  LngLatLike,
  MapOptions,
  StyleSpecification,
  GeoJSONSourceSpecification,
} from 'vue3-maplibre-gl';
```

## Vite Configuration

If you're using Vite, you might need to add some configuration for optimal performance:

```js
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    include: ['maplibre-gl'],
  },
});
```

## Webpack Configuration

For Webpack users, you might need to configure module resolution:

```js
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      'maplibre-gl': 'maplibre-gl/dist/maplibre-gl.js',
    },
  },
};
```

## Nuxt 3 Setup

For Nuxt 3 applications, create a plugin:

```js
// plugins/vue-maplibre-gl.client.js
import VueMapLibreGl from 'vue3-maplibre-gl';
import 'vue3-maplibre-gl/dist/style.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueMapLibreGl);
});
```

## Troubleshooting

### Common Issues

1. **CSS not loading**: Make sure to import the MapLibre GL CSS file
2. **Module not found**: Ensure both `vue-maplibre-gl` and `maplibre-gl` are installed
3. **TypeScript errors**: Update your TypeScript configuration to include the package types

### Browser Compatibility

Vue MapLibre GL supports all modern browsers that support:

- ES6+ features
- WebGL
- Vue 3

Minimum browser versions:

- Chrome 51+
- Firefox 53+
- Safari 10+
- Edge 79+
