# nuxt-maplibre-gl

[![npm](https://img.shields.io/npm/v/nuxt-maplibre-gl)](https://www.npmjs.com/package/nuxt-maplibre-gl)

[Nuxt](https://nuxt.com) module for [vue3-maplibre-gl](https://github.com/danh121097/vue-maplibre-gl) — interactive maps with MapLibre GL JS.

## Features

- Auto-import 10+ map components (Maplibre, GeoJsonSource, FillLayer, etc.)
- Auto-import 15+ composables (useFlyTo, useMapEventListener, etc.)
- Auto-import CSS — no manual style import needed
- SSR-safe — components register client-only, composables have browser guards
- Zero configuration required

## Installation

```bash
bun add nuxt-maplibre-gl
```

## Setup

Add to `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-maplibre-gl'],

  // Optional configuration
  maplibre: {
    css: true, // auto-import CSS (default: true)
    prefix: '', // composable prefix (default: none)
  },
});
```

## Usage

Components and composables are auto-imported. Wrap map in `<ClientOnly>`:

```vue
<template>
  <ClientOnly>
    <Maplibre :options="mapOptions" style="height: 500px">
      <GeoJsonSource :data="geoData">
        <FillLayer :style="fillStyle" />
        <CircleLayer :style="circleStyle" />
      </GeoJsonSource>
      <Marker :lnglat="[0, 0]" :draggable="true" />
    </Maplibre>
  </ClientOnly>
</template>

<script setup>
const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const geoData = ref({
  type: 'FeatureCollection',
  features: [],
});

const fillStyle = ref({ 'fill-color': '#088', 'fill-opacity': 0.8 });
const circleStyle = ref({ 'circle-radius': 6, 'circle-color': '#007cbf' });
</script>
```

## Auto-imported Components

| Component           | Description         |
| ------------------- | ------------------- |
| `Maplibre`          | Main map container  |
| `GeoJsonSource`     | GeoJSON data source |
| `FillLayer`         | Fill polygons       |
| `CircleLayer`       | Circle points       |
| `LineLayer`         | Line features       |
| `SymbolLayer`       | Icons and text      |
| `Marker`            | HTML markers        |
| `PopUp`             | Popup windows       |
| `Image`             | Map images          |
| `GeolocateControls` | Geolocation         |

## Auto-imported Composables

All 15+ composables from vue3-maplibre-gl are auto-imported:
`useCreateMaplibre`, `useFlyTo`, `useEaseTo`, `useJumpTo`, `useMapEventListener`, etc.

## Releasing

This module depends on `vue3-maplibre-gl` by version range, and both are published from the same repository. Release them in this order, from the repository root:

1. `bun run publish:vue` — publishes the root package.
2. `bun run publish:nuxt` — refuses to run until the `vue3-maplibre-gl` range in `nuxt/package.json` resolves on npm, then bumps the minor version, refreshes `nuxt/bun.lock`, builds, and publishes.

Commit the updated `nuxt/package.json` and `nuxt/bun.lock` afterwards.

## License

MIT
