# nuxt-maplibre-gl

[![npm](https://img.shields.io/npm/v/nuxt-maplibre-gl)](https://www.npmjs.com/package/nuxt-maplibre-gl)

[Nuxt](https://nuxt.com) module for [vue3-maplibre-gl](https://github.com/danh121097/vue-maplibre-gl) — interactive maps with MapLibre GL JS.

## Features

- Auto-imports all 10 map components (Maplibre, GeoJsonSource, FillLayer, etc.)
- Auto-imports all 38 composables (useFlyTo, useMapEventListener, etc.)
- Auto-imports CSS — both `maplibre-gl/dist/maplibre-gl.css` and `vue3-maplibre-gl/dist/style.css`
- SSR-safe — components register client-only, `maplibre-gl` is kept out of the server bundle
- Zero configuration required

`vue3-maplibre-gl` and `maplibre-gl` are dependencies of this module, so installing it is enough — there is nothing else to add to your app.

## Installation

### Using Bun (Recommended)

```bash
bun add nuxt-maplibre-gl
```

### Using npm

```bash
npm install nuxt-maplibre-gl
```

### Using Yarn

```bash
yarn add nuxt-maplibre-gl
```

### Using pnpm

```bash
pnpm add nuxt-maplibre-gl
```

## Setup

Add to `nuxt.config.ts`. The config key is `maplibre`, not the module name:

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
| `Popup`             | Popup windows       |
| `Image`             | Map images          |
| `GeolocateControls` | Geolocation         |

## Auto-imported Composables

All 38 composables from vue3-maplibre-gl are auto-imported — `useCreateMaplibre`,
`useMaplibre`, `useFlyTo`, `useEaseTo`, `useJumpTo`, `useMapEventListener`,
`useCreateGeoJsonSource` and the rest. Set `prefix` to namespace them: with
`prefix: 'map'` they are imported as `mapUseFlyTo`, `mapUseMapEventListener`, and
so on.

The full reference lives at
[vue-maplibre-gl.pages.dev/api/composables](https://vue-maplibre-gl.pages.dev/api/composables).

## Documentation

- [SSR / Nuxt guide](https://vue-maplibre-gl.pages.dev/guide/ssr-nuxt) — what this module configures, and how to use it without the module
- [Components API](https://vue-maplibre-gl.pages.dev/api/components)
- [Composables API](https://vue-maplibre-gl.pages.dev/api/composables)
- [Examples](https://vue-maplibre-gl.pages.dev/examples/)

## Releasing

This module depends on `vue3-maplibre-gl` by version range, and both are published from the same repository. Release them in this order, from the repository root:

1. `bun run publish:vue` — publishes the root package.
2. `bun run publish:nuxt` — refuses to run until the `vue3-maplibre-gl` range in `nuxt/package.json` resolves on npm, then refreshes `nuxt/bun.lock`, builds, and publishes.

Neither script picks a version. Set `version` in the manifest yourself before releasing, so the bump reflects what actually changed — this module tracks `vue3-maplibre-gl` by major, so a new major there is a new major here.

Commit the refreshed `nuxt/bun.lock` afterwards.

## License

MIT
