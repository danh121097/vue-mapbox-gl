# Installation

## Package Manager Installation

Vue MapLibre GL is available on npm and can be installed using your preferred package manager.

### Using Yarn (Recommended)

```bash
yarn add vue-maplibre-gl maplibre-gl
```

### Using npm

```bash
npm install vue-maplibre-gl maplibre-gl
```

### Using pnpm

```bash
pnpm add vue-maplibre-gl maplibre-gl
```

## CDN Installation

You can also use Vue MapLibre GL directly from a CDN:

```html
<!-- MapLibre GL JS -->
<script src="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js"></script>
<link href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css" rel="stylesheet" />

<!-- Vue MapLibre GL -->
<script src="https://unpkg.com/vue-maplibre-gl@latest/dist/index.umd.cjs"></script>
```

## Setup in Vue 3

### Global Registration

Register the components globally in your main.js:

```js
import { createApp } from 'vue'
import VueMapLibreGl from 'vue-maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const app = createApp(App)
app.use(VueMapLibreGl)
app.mount('#app')
```

### Local Registration

Import components as needed in your components:

```vue
<script setup>
import { MapLibreMap, MapLibreMarker } from 'vue-maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
</script>
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
import { ref } from 'vue'
import { MapLibreMap } from 'vue-maplibre-gl'
import type { LngLatLike, StyleSpecification } from 'maplibre-gl'

const center = ref<LngLatLike>([0, 0])
const mapStyle = ref<string | StyleSpecification>('https://demotiles.maplibre.org/style.json')
</script>
```

## Vite Configuration

If you're using Vite, you might need to add some configuration for optimal performance:

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    include: ['maplibre-gl']
  }
})
```

## Webpack Configuration

For Webpack users, you might need to configure module resolution:

```js
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      'maplibre-gl': 'maplibre-gl/dist/maplibre-gl.js'
    }
  }
}
```

## Nuxt 3 Setup

For Nuxt 3 applications, create a plugin:

```js
// plugins/vue-maplibre-gl.client.js
import VueMapLibreGl from 'vue-maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueMapLibreGl)
})
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
