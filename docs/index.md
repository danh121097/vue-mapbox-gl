---
layout: home

hero:
  name: 'Vue MapLibre GL'
  text: 'Vue 3 Components for MapLibre GL JS'
  tagline: 'Build interactive maps with ease using Vue 3 and MapLibre GL JS'
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
    details: Create beautiful, interactive maps with MapLibre GL JS and Vue 3 components with reactive data binding.
  - icon: 🧩
    title: Component-Based Architecture
    details: 10+ Vue components including Mapbox, GeoJsonSource, FillLayer, CircleLayer, LineLayer, SymbolLayer, Marker, PopUp, Image, and GeolocateControls.
  - icon: 🎯
    title: TypeScript Support
    details: Full TypeScript support with comprehensive type definitions and interfaces for better development experience.
  - icon: 🚀
    title: High Performance
    details: Optimized for performance with efficient rendering, minimal bundle size, and automatic resource cleanup.
  - icon: 🔧
    title: Powerful Composables
    details: 15+ composables for map management, layers, sources, controls, events, and utilities with reactive state management.
  - icon: 📱
    title: Mobile-Friendly
    details: Responsive design that works seamlessly across all devices and screen sizes with touch support.
---

## Quick Start

Install the package:

```bash
# Using yarn
yarn add vue3-maplibre-gl

# Using npm
npm install vue3-maplibre-gl
```

Use in your Vue 3 application:

```vue
<template>
  <Mapbox :options="mapOptions" style="height: 500px" @load="onMapLoad">
    <GeoJsonSource :data="geoJsonData">
      <FillLayer :style="fillStyle" />
      <CircleLayer :style="circleStyle" />
    </GeoJsonSource>

    <Marker :lnglat="[0, 0]" :draggable="true">
      <div class="marker">📍</div>
    </Marker>

    <PopUp :lnglat="[0, 0]" :show="showPopup">
      <div class="popup-content">
        <h3>Welcome to Vue MapLibre GL!</h3>
        <p>Interactive maps made easy with Vue 3</p>
      </div>
    </PopUp>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import {
  Mapbox,
  GeoJsonSource,
  FillLayer,
  CircleLayer,
  Marker,
  PopUp,
} from 'vue3-maplibre-gl';
import 'vue3-maplibre-gl/dist/style.css';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const geoJsonData = ref({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { name: 'Sample Point' },
    },
  ],
});

const fillStyle = ref({
  'fill-color': '#088',
  'fill-opacity': 0.8,
});

const circleStyle = ref({
  'circle-radius': 6,
  'circle-color': '#007cbf',
});

const showPopup = ref(true);

function onMapLoad(map) {
  console.log('Map loaded:', map);
}
</script>

<style>
.marker {
  font-size: 24px;
  cursor: pointer;
}

.popup-content {
  padding: 10px;
  max-width: 200px;
}
</style>
```

## Why Vue MapLibre GL?

- **🎯 Vue 3 Native**: Built specifically for Vue 3 with Composition API and TypeScript support
- **🗺️ MapLibre GL JS**: Uses the open-source MapLibre GL JS for high-performance vector map rendering
- **🧩 Component-Based**: 10+ Vue components for maps, layers, sources, markers, popups, and controls
- **🔧 Powerful Composables**: 15+ composables for map management, animations, events, and utilities
- **📚 Developer Friendly**: Comprehensive documentation with examples and TypeScript definitions
- **⚡ High Performance**: Optimized for performance with automatic resource cleanup and minimal bundle size
- **🌐 Open Source**: MIT licensed with active community support and regular updates
- **📱 Mobile Ready**: Touch-friendly controls and responsive design for all devices
