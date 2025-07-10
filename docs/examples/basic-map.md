# Basic Map

Learn how to create a simple map with Vue MapLibre GL.

## Simple Map

The most basic example - just a map with a style:

```vue
<template>
  <div class="map-container">
    <Mapbox 
      :options="mapOptions" 
      style="height: 400px; width: 100%;"
      @load="onMapLoad"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox } from 'vue3-maplibre-gl';
import 'vue3-maplibre-gl/dist/style.css';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

function onMapLoad(map) {
  console.log('Map loaded successfully:', map);
}
</script>

<style scoped>
.map-container {
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
}
</style>
```

## Map with Custom Style

Using a different map style:

```vue
<template>
  <div class="map-container">
    <Mapbox 
      :options="mapOptions" 
      style="height: 400px; width: 100%;"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#f0f0f0'
        }
      },
      {
        id: 'raster-layer',
        type: 'raster',
        source: 'raster-tiles'
      }
    ]
  },
  center: [-74.006, 40.7128], // New York
  zoom: 10,
});
</script>
```

## Interactive Map with Events

Handle map events and user interactions:

```vue
<template>
  <div>
    <div class="info-panel">
      <p><strong>Center:</strong> {{ mapCenter }}</p>
      <p><strong>Zoom:</strong> {{ mapZoom }}</p>
      <p><strong>Last Click:</strong> {{ lastClick }}</p>
    </div>
    
    <Mapbox 
      :options="mapOptions" 
      style="height: 400px; width: 100%;"
      @load="onMapLoad"
      @click="onMapClick"
      @move="onMapMove"
      @zoom="onMapZoom"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const mapCenter = ref([0, 0]);
const mapZoom = ref(2);
const lastClick = ref(null);

function onMapLoad(map) {
  console.log('Map loaded:', map);
  mapCenter.value = map.getCenter().toArray();
  mapZoom.value = Math.round(map.getZoom() * 100) / 100;
}

function onMapClick(event) {
  const { lng, lat } = event.lngLat;
  lastClick.value = [Math.round(lng * 1000) / 1000, Math.round(lat * 1000) / 1000];
}

function onMapMove(event) {
  const center = event.target.getCenter();
  mapCenter.value = [
    Math.round(center.lng * 1000) / 1000, 
    Math.round(center.lat * 1000) / 1000
  ];
}

function onMapZoom(event) {
  mapZoom.value = Math.round(event.target.getZoom() * 100) / 100;
}
</script>

<style scoped>
.info-panel {
  background: #f5f5f5;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  font-family: monospace;
}

.info-panel p {
  margin: 5px 0;
}
</style>
```

## Map with Multiple Styles

Allow users to switch between different map styles:

```vue
<template>
  <div>
    <div class="style-selector">
      <label>Map Style:</label>
      <select v-model="selectedStyle" @change="changeStyle">
        <option value="demotiles">Demo Tiles</option>
        <option value="osm">OpenStreetMap</option>
        <option value="satellite">Satellite</option>
      </select>
    </div>
    
    <Mapbox 
      :options="mapOptions" 
      style="height: 400px; width: 100%;"
      @load="onMapLoad"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Mapbox } from 'vue3-maplibre-gl';

const selectedStyle = ref('demotiles');
const mapInstance = ref(null);

const styles = {
  demotiles: 'https://demotiles.maplibre.org/style.json',
  osm: {
    version: 8,
    sources: {
      'osm': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm'
      }
    ]
  },
  satellite: {
    version: 8,
    sources: {
      'satellite': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: '© Esri'
      }
    },
    layers: [
      {
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite'
      }
    ]
  }
};

const mapOptions = ref({
  style: styles.demotiles,
  center: [0, 0],
  zoom: 2,
});

function onMapLoad(map) {
  mapInstance.value = map;
}

function changeStyle() {
  if (mapInstance.value) {
    mapInstance.value.setStyle(styles[selectedStyle.value]);
  }
}
</script>

<style scoped>
.style-selector {
  margin-bottom: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.style-selector label {
  margin-right: 10px;
  font-weight: bold;
}

.style-selector select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
```

## Key Features

- **Simple Setup**: Minimal configuration required
- **Event Handling**: Respond to user interactions
- **Style Switching**: Dynamic style changes
- **Reactive Data**: Vue 3 reactivity integration

## Related APIs

- [Mapbox Component](/api/components#mapbox)
- [useCreateMapbox Composable](/api/composables#usecreatemapbox)
- [Map Events](/api/types#map-events)
