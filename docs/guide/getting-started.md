# Getting Started

Vue3 MapLibre GL is a comprehensive Vue 3 component library that provides an intuitive way to integrate interactive maps into your Vue applications using MapLibre GL JS.

## What is Vue3 MapLibre GL?

Vue3 MapLibre GL offers:

- **10+ Vue Components** - Maplibre, GeoJsonSource, FillLayer, CircleLayer, LineLayer, SymbolLayer, Marker, PopUp, Image, and GeolocateControls
- **15+ Composables** - For map management, layers, sources, controls, events, and utilities
- **Full TypeScript Support** - Comprehensive type definitions and interfaces
- **Reactive Data Binding** - Seamless integration with Vue 3's reactivity system
- **Performance Optimized** - Automatic resource cleanup and minimal bundle size

## What is MapLibre GL JS?

MapLibre GL JS is an open-source library for publishing maps on your websites. It's a fork of Maplibre GL JS and provides vector tile rendering with WebGL for high-performance, interactive maps.

## Prerequisites

Before you begin, make sure you have:

- Node.js 16+ installed
- A Vue 3 project set up
- Basic knowledge of Vue 3 Composition API
- TypeScript knowledge (optional but recommended for better development experience)

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
    <Maplibre
      :options="mapOptions"
      style="height: 500px; width: 100%;"
      @load="onMapLoad"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre } from 'vue3-maplibre-gl';
import 'vue3-maplibre-gl/dist/style.css';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

function onMapLoad(map) {
  console.log('Map loaded:', map);
}
</script>
```

## Advanced Example with Components

Here's a more comprehensive example showcasing multiple components:

```vue
<template>
  <div id="app">
    <Maplibre
      :options="mapOptions"
      style="height: 500px; width: 100%;"
      @load="onMapLoad"
    >
      <!-- GeoJSON Data Source -->
      <GeoJsonSource :data="geoJsonData">
        <!-- Fill Layer for Polygons -->
        <FillLayer :style="fillStyle" />
        <!-- Circle Layer for Points -->
        <CircleLayer :style="circleStyle" />
      </GeoJsonSource>

      <!-- Interactive Marker -->
      <Marker
        :lnglat="markerPosition"
        :draggable="true"
        @dragend="onMarkerDragEnd"
      >
        <div class="custom-marker">📍</div>
      </Marker>

      <!-- Popup -->
      <PopUp :lnglat="popupPosition" :show="showPopup">
        <div class="popup-content">
          <h3>Welcome!</h3>
          <p>This is an interactive map built with Vue 3</p>
        </div>
      </PopUp>

      <!-- Geolocation Control -->
      <GeolocateControls position="top-right" @geolocate="onGeolocate" />
    </Maplibre>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {
  Maplibre,
  GeoJsonSource,
  FillLayer,
  CircleLayer,
  Marker,
  PopUp,
  GeolocateControls,
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

const markerPosition = ref([0, 0]);
const popupPosition = ref([0, 0]);
const showPopup = ref(true);

function onMapLoad(map) {
  console.log('Map loaded:', map);
}

function onMarkerDragEnd(event) {
  const lngLat = event.target.getLngLat();
  markerPosition.value = [lngLat.lng, lngLat.lat];
}

function onGeolocate(data) {
  console.log('User location:', data.coords);
}
</script>

<style>
.custom-marker {
  font-size: 24px;
  cursor: pointer;
}

.popup-content {
  padding: 10px;
  max-width: 200px;
}
</style>
```

## Using Composables

Vue3 MapLibre GL also provides powerful composables for advanced map interactions:

```vue
<script setup>
import { ref } from 'vue';
import {
  useCreateMaplibre,
  useFlyTo,
  useMapEventListener,
} from 'vue3-maplibre-gl';

const mapContainer = ref();
const mapStyle = ref('https://demotiles.maplibre.org/style.json');

// Create map with composable
const { mapInstance, setCenter, setZoom } = useCreateMaplibre(
  mapContainer,
  mapStyle,
  {
    onLoad: (map) => console.log('Map loaded:', map),
    debug: true,
  },
);

// Add smooth animations
const { flyTo } = useFlyTo({ map: mapInstance });

// Listen to map events
useMapEventListener({
  map: mapInstance,
  event: 'click',
  handler: (event) => {
    console.log('Map clicked at:', event.lngLat);
    flyTo({
      center: event.lngLat,
      zoom: 10,
      duration: 2000,
    });
  },
});
</script>
```

## Key Features

### 🧩 **Components**

- **Maplibre** - Main map container with comprehensive event handling
- **GeoJsonSource** - Reactive data source for GeoJSON data
- **Layer Components** - FillLayer, CircleLayer, LineLayer, SymbolLayer
- **Interactive Elements** - Marker, PopUp with custom content
- **Controls** - GeolocateControls for user location
- **Utilities** - Image management for map styles

### 🔧 **Composables**

- **Map Management** - `useCreateMaplibre`, `useMaplibre`
- **Layer Management** - `useCreateFillLayer`, `useCreateCircleLayer`, etc.
- **Source Management** - `useCreateGeoJsonSource`, `useGeoJsonSource`
- **Event Handling** - `useMapEventListener`, `useLayerEventListener`
- **Animations** - `useFlyTo`, `useEaseTo`, `useJumpTo`
- **Utilities** - `useBounds`, `useZoom`, `useLogger`

### 🎯 **TypeScript Support**

- Full type definitions for all components and composables
- IntelliSense support in VS Code
- Type-safe event handling and prop validation

## Next Steps

Now that you have a basic understanding, you can:

- [Learn about installation options](/guide/installation)
- [Explore the complete API reference](/api/components)
- [Check out composables documentation](/api/composables)
- [Browse practical examples](/examples/)
- [Review TypeScript types](/api/types)

## Need Help?

- Check out our [examples](/examples/) for common use cases
- Browse the [API documentation](/api/components) for detailed component references
- Explore [composables documentation](/api/composables) for advanced functionality
- Review [TypeScript types](/api/types) for type definitions
- Visit our [GitHub repository](https://github.com/danh121097/vue-maplibre-gl) for issues and discussions
