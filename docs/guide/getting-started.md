# Getting Started

Vue MapLibre GL is a Vue 3 component library that provides an easy way to integrate MapLibre GL JS maps into your Vue applications.

## What is MapLibre GL JS?

MapLibre GL JS is an open-source library for publishing maps on your websites. It's a fork of Mapbox GL JS and provides vector tile rendering with WebGL.

## Prerequisites

Before you begin, make sure you have:

- Node.js 16+ installed
- A Vue 3 project set up
- Basic knowledge of Vue 3 and TypeScript (optional but recommended)

## Installation

Choose your preferred package manager:

::: code-group

```bash [yarn]
yarn add vue3-maplibre-gl
```

```bash [npm]
npm install vue3-maplibre-gl
```

```bash [pnpm]
pnpm add vue3-maplibre-gl
```

:::

## Import Styles

Don't forget to import the CSS:

```js
import 'vue3-maplibre-gl/dist/style.css';
```

You can import this in your main.js file or in individual components.

## Basic Usage

Here's a simple example to get you started:

```vue
<template>
  <div id="app">
    <MapLibreMap
      :map-style="mapStyle"
      :center="center"
      :zoom="zoom"
      style="height: 500px; width: 100%;"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { MapLibreMap } from 'vue3-maplibre-gl';
import 'vue3-maplibre-gl/dist/style.css';

const mapStyle = ref('https://demotiles.maplibre.org/style.json');
const center = ref([0, 0]);
const zoom = ref(2);
</script>
```

## Next Steps

Now that you have a basic map running, you can:

- [Learn about installation options](/guide/installation)
- [Explore basic usage patterns](/guide/basic-usage)
- [Check out the API reference](/api/components)
- [Browse examples](/examples/)

## Need Help?

- Check out our [examples](/examples/) for common use cases
- Browse the [API documentation](/api/components) for detailed component references
- Visit our [GitHub repository](https://github.com/danh121097/vue-mapbox-gl) for issues and discussions
