---
layout: home

hero:
  name: 'Vue3 MapLibre GL'
  text: 'Interactive Maps for Vue 3'
  tagline: '10+ components, 15+ composables, full TypeScript support — build production-ready maps in minutes'
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/danh121097/vue-maplibre-gl

features:
  - icon: 🗺️
    title: Interactive Maps
    details: High-performance vector maps with WebGL rendering via MapLibre GL JS. Reactive data binding out of the box.
  - icon: 🧩
    title: 10+ Components
    details: Maplibre, GeoJsonSource, FillLayer, CircleLayer, LineLayer, SymbolLayer, Marker, PopUp, Image, GeolocateControls.
  - icon: 🔧
    title: 15+ Composables
    details: Map management, camera animations (flyTo, easeTo, jumpTo), event listeners, layer management, and utilities.
  - icon: 🎯
    title: Full TypeScript
    details: Comprehensive type definitions, event handler types, and generic overloads for a first-class DX.
  - icon: ⚡
    title: High Performance
    details: Factory-based architecture with shallowRef optimization, automatic cleanup, and zero memory leaks.
  - icon: 🌐
    title: SSR Compatible
    details: Works with Nuxt and SSR/SSG out of the box. Browser guards built in, no configuration required.
---

## Quick Start

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

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 500px">
    <GeoJsonSource :data="geoJsonData">
      <FillLayer :style="fillStyle" />
      <CircleLayer :style="circleStyle" />
    </GeoJsonSource>
    <Marker :lnglat="[0, 0]" :draggable="true" />
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import {
  Maplibre,
  GeoJsonSource,
  FillLayer,
  CircleLayer,
  Marker,
} from 'vue3-maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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
      properties: {},
    },
  ],
});

const fillStyle = ref({ 'fill-color': '#088', 'fill-opacity': 0.8 });
const circleStyle = ref({ 'circle-radius': 6, 'circle-color': '#007cbf' });
</script>
```

## Why Vue3 MapLibre GL?

|                    | Feature                                                      |
| ------------------ | ------------------------------------------------------------ |
| **Vue 3 Native**   | Built for Composition API with full reactivity               |
| **Single Runtime** | `maplibre-gl` is a peer — one copy, on a version you pick    |
| **SSR Safe**       | Works with Nuxt SSR/SSG without configuration                |
| **Type Safe**      | Comprehensive TypeScript definitions and event handler types |
| **Zero Leaks**     | Factory-based cleanup with defense-in-depth patterns         |
| **Tiny Footprint** | Tree-shakeable — import only what you use                    |
