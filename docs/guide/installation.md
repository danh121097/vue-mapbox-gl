# Installation

## Package Manager Installation

Vue3 MapLibre GL is available on npm and can be installed using your preferred package manager.

Every command below installs two packages, because `maplibre-gl` is a peer dependency since v6. npm and Bun would pull it in on their own, but Yarn and pnpm would not, and naming it explicitly is the one command that is correct everywhere — it also pins the MapLibre version your app runs against.

::: tip Why a peer dependency
This package re-exports MapLibre's own classes and types, and your app imports MapLibre's stylesheet directly. If both your app and this package resolved their own copy of `maplibre-gl`, a `Map` produced by one would fail an `instanceof` check in the other and two copies of the runtime would ship. Declaring it as a peer means there is exactly one, on a version you choose.
:::

Since v6 the two stylesheets are separate: this package ships only its own rules, and you import MapLibre's own stylesheet the way MapLibre documents it. See [Setup in Vue 3](#setup-in-vue-3).

::: warning pnpm
pnpm's isolated `node_modules` does not expose a dependency your app did not install itself, so `import 'maplibre-gl/dist/maplibre-gl.css'` fails unless `maplibre-gl` is in your own `package.json`. This has been true since v6 split the stylesheets, independently of the peer dependency.
:::

::: code-group

```bash [bun]
bun add vue3-maplibre-gl maplibre-gl
```

```bash [npm]
npm install vue3-maplibre-gl maplibre-gl
```

```bash [yarn]
yarn add vue3-maplibre-gl maplibre-gl
```

```bash [pnpm]
pnpm add vue3-maplibre-gl maplibre-gl
```

:::

## CDN Installation

You can also use Vue MapLibre GL directly from a CDN.

For the UMD build, load the global `maplibregl` script first: `maplibre-gl` is externalized there, exactly as it is for a package-manager install.

```html
<script src="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js"></script>
<script src="https://unpkg.com/vue3-maplibre-gl@latest/dist/index.umd.cjs"></script>
<link
  href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css"
  rel="stylesheet"
/>
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
import 'maplibre-gl/dist/maplibre-gl.css';
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
  Maplibre,
  GeoJsonSource,
  FillLayer,
  CircleLayer,
  Marker,
  PopUp,
} from 'vue3-maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'vue3-maplibre-gl/dist/style.css';
</script>
```

### Available Components

All components are exported from the main package:

```js
import {
  // Main Components
  Maplibre,
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
  useCreateMaplibre,
  useMaplibre,
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
  useFitBounds,
  useCameraForBounds,
  useZoomTo,
  useZoomIn,
  useZoomOut,
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
import { Maplibre, GeoJsonSource, FillLayer } from 'vue3-maplibre-gl';
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

Component prop types are **not** exported. Each component declares its props
interface locally, so `MaplibreProps`, `FillLayerProps` and the rest cannot be
imported — use `defineProps` inference in your own wrapper, or read the shapes
in the [components API reference](/api/components).

What is exported:

```typescript
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

Raw MapLibre GL **classes** come from the `/maplibre` subpath rather than the root. Keeping them off the root is what lets a bundler drop the MapLibre runtime when you only use components:

```ts
import {
  Map,
  NavigationControl,
  GeolocateControl,
  MaplibreMarker,
} from 'vue3-maplibre-gl/maplibre';
```

`Marker` and `Popup` are already used by Vue components, so the raw MapLibre GL classes are available as `MaplibreMarker`, `MaplibrePopup`, or under the `maplibregl` namespace:

```ts
import { MaplibrePopup, maplibregl } from 'vue3-maplibre-gl/maplibre';

const popup = new MaplibrePopup();
const marker = new maplibregl.Marker();
```

Importing them directly from `maplibre-gl` works just as well.

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
import 'maplibre-gl/dist/maplibre-gl.css';
import 'vue3-maplibre-gl/dist/style.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueMapLibreGl);
});
```

## Troubleshooting

### Common Issues

1. **CSS not loading**: Make sure to import both `maplibre-gl/dist/maplibre-gl.css` and `vue3-maplibre-gl/dist/style.css`
2. **Module not found**: Reinstall `vue3-maplibre-gl` so its `maplibre-gl` dependency is present in `node_modules`
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
