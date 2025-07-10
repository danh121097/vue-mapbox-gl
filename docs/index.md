---
layout: home

hero:
  name: 'Vue MapLibre GL'
  text: 'Vue 3 Components for MapLibre GL JS'
  tagline: 'Build interactive maps with ease using Vue 3 and MapLibre GL JS'
  image:
    src: /logo.svg
    alt: Vue MapLibre GL
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/danh121097/vue-mapbox-gl

features:
  - icon: 🗺️
    title: Interactive Maps
    details: Create beautiful, interactive maps with MapLibre GL JS and Vue 3 components.
  - icon: 🧩
    title: Component-Based
    details: Use Vue components for markers, layers, controls, and more with reactive data binding.
  - icon: 🎯
    title: TypeScript Support
    details: Full TypeScript support with comprehensive type definitions for better development experience.
  - icon: 🚀
    title: Performance
    details: Optimized for performance with efficient rendering and minimal bundle size.
  - icon: 🔧
    title: Composables
    details: Powerful composables for map interactions, state management, and custom functionality.
  - icon: 📱
    title: Responsive
    details: Mobile-friendly maps that work seamlessly across all devices and screen sizes.
---

## Quick Start

Install the package:

```bash
# Using yarn
yarn add vue3-maplibre-gl maplibre-gl

# Using npm
npm install vue3-maplibre-gl maplibre-gl
```

Use in your Vue 3 application:

```vue
<template>
  <MapLibreMap
    :map-style="mapStyle"
    :center="[0, 0]"
    :zoom="2"
    style="height: 400px"
  >
    <MapLibreMarker :lng-lat="[0, 0]">
      <div class="marker">📍</div>
    </MapLibreMarker>
  </MapLibreMap>
</template>

<script setup>
import { MapLibreMap, MapLibreMarker } from 'vue3-maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const mapStyle = 'https://demotiles.maplibre.org/style.json';
</script>
```

## Why Vue MapLibre GL?

- **Vue 3 Native**: Built specifically for Vue 3 with Composition API support
- **MapLibre GL JS**: Uses the open-source MapLibre GL JS for rendering
- **Developer Friendly**: Intuitive API with comprehensive documentation
- **Lightweight**: Minimal overhead with tree-shaking support
- **Extensible**: Easy to extend with custom components and composables
