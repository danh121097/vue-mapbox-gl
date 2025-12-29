# Layers

Learn how to work with different layer types and dynamic styling.

## Fill Layer

Create areas with fill styling:

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px;">
    <GeoJsonSource :data="polygonData" source-id="polygons">
      <FillLayer :style="fillStyle" />
    </GeoJsonSource>
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, GeoJsonSource, FillLayer } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-74.006, 40.7128],
  zoom: 10,
});

const polygonData = ref({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-74.0059, 40.7128],
            [-74.0059, 40.7589],
            [-73.9352, 40.7589],
            [-73.9352, 40.7128],
            [-74.0059, 40.7128],
          ],
        ],
      },
      properties: {
        name: 'Manhattan Area',
      },
    },
  ],
});

const fillStyle = ref({
  'fill-color': '#088',
  'fill-opacity': 0.6,
  'fill-outline-color': '#fff',
});
</script>
```

## Circle Layer

Display points as circles with customizable styling:

```vue
<template>
  <div>
    <div class="controls">
      <label>Circle Size: {{ circleRadius }}</label>
      <input type="range" min="5" max="50" v-model="circleRadius" />
    </div>

    <Maplibre :options="mapOptions" style="height: 400px;">
      <GeoJsonSource :data="pointData" source-id="points">
        <CircleLayer :style="circleStyle" @click="onCircleClick" />
      </GeoJsonSource>
    </Maplibre>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Maplibre, GeoJsonSource, CircleLayer } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const circleRadius = ref(15);

const pointData = ref({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { name: 'Point 1', value: 100 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
      properties: { name: 'Point 2', value: 200 },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
      properties: { name: 'Point 3', value: 150 },
    },
  ],
});

const circleStyle = computed(() => ({
  'circle-radius': circleRadius.value,
  'circle-color': [
    'interpolate',
    ['linear'],
    ['get', 'value'],
    100,
    '#ff6b6b',
    150,
    '#feca57',
    200,
    '#48dbfb',
  ],
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
}));

function onCircleClick(event) {
  const feature = event.features[0];
  alert(
    `Clicked on ${feature.properties.name} (Value: ${feature.properties.value})`,
  );
}
</script>

<style scoped>
.controls {
  margin-bottom: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.controls label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.controls input {
  width: 100%;
}
</style>
```

## Line Layer

Create lines and paths:

```vue
<template>
  <div>
    <div class="controls">
      <button @click="animateLine">Animate Line Drawing</button>
      <button @click="resetLine">Reset</button>
    </div>

    <Maplibre :options="mapOptions" style="height: 400px;">
      <GeoJsonSource :data="lineData" source-id="route">
        <LineLayer :style="lineStyle" />
      </GeoJsonSource>
    </Maplibre>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, GeoJsonSource, LineLayer } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-74.006, 40.7128],
  zoom: 12,
});

const fullRoute = [
  [-74.006, 40.7128],
  [-73.9857, 40.7589],
  [-73.9665, 40.7812],
  [-73.9441, 40.8176],
  [-73.9297, 40.8448],
];

const lineData = ref({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [],
      },
      properties: {},
    },
  ],
});

const lineStyle = ref({
  'line-color': '#007cbf',
  'line-width': 4,
  'line-opacity': 0.8,
});

function animateLine() {
  const coordinates = [];
  let index = 0;

  const addPoint = () => {
    if (index < fullRoute.length) {
      coordinates.push(fullRoute[index]);
      lineData.value.features[0].geometry.coordinates = [...coordinates];
      index++;
      setTimeout(addPoint, 500);
    }
  };

  addPoint();
}

function resetLine() {
  lineData.value.features[0].geometry.coordinates = [];
}
</script>

<style scoped>
.controls {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #007cbf;
  color: white;
}

.controls button:hover {
  background: #005a8b;
}
</style>
```

## Symbol Layer

Add text and icon symbols:

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px;">
    <GeoJsonSource :data="symbolData" source-id="symbols">
      <SymbolLayer :style="symbolStyle" />
    </GeoJsonSource>
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, GeoJsonSource, SymbolLayer } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-74.006, 40.7128],
  zoom: 10,
});

const symbolData = ref({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
      properties: {
        name: 'New York City',
        type: 'city',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-73.9857, 40.7589] },
      properties: {
        name: 'Times Square',
        type: 'landmark',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-73.9665, 40.7812] },
      properties: {
        name: 'Central Park',
        type: 'park',
      },
    },
  ],
});

const symbolStyle = ref({
  'text-field': ['get', 'name'],
  'text-font': ['Open Sans Regular'],
  'text-size': 14,
  'text-color': '#333',
  'text-halo-color': '#fff',
  'text-halo-width': 2,
  'text-offset': [0, 1.5],
  'text-anchor': 'top',
});
</script>
```

## Multiple Layers

Combine different layer types:

```vue
<template>
  <div>
    <div class="layer-controls">
      <label>
        <input type="checkbox" v-model="showFill" />
        Show Fill Layer
      </label>
      <label>
        <input type="checkbox" v-model="showCircles" />
        Show Circle Layer
      </label>
      <label>
        <input type="checkbox" v-model="showLabels" />
        Show Labels
      </label>
    </div>

    <Maplibre :options="mapOptions" style="height: 400px;">
      <GeoJsonSource :data="combinedData" source-id="combined">
        <FillLayer v-if="showFill" :style="fillStyle" />
        <CircleLayer v-if="showCircles" :style="circleStyle" />
        <SymbolLayer v-if="showLabels" :style="symbolStyle" />
      </GeoJsonSource>
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
  SymbolLayer,
} from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-74.006, 40.7128],
  zoom: 11,
});

const showFill = ref(true);
const showCircles = ref(true);
const showLabels = ref(true);

const combinedData = ref({
  type: 'FeatureCollection',
  features: [
    // Polygon feature
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-74.0059, 40.7128],
            [-74.0059, 40.7589],
            [-73.9352, 40.7589],
            [-73.9352, 40.7128],
            [-74.0059, 40.7128],
          ],
        ],
      },
      properties: {
        name: 'Manhattan',
        type: 'area',
      },
    },
    // Point features
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
      properties: { name: 'Financial District', type: 'district' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-73.9857, 40.7589] },
      properties: { name: 'Times Square', type: 'landmark' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-73.9665, 40.7812] },
      properties: { name: 'Central Park', type: 'park' },
    },
  ],
});

const fillStyle = ref({
  'fill-color': '#088',
  'fill-opacity': 0.3,
});

const circleStyle = ref({
  'circle-radius': [
    'case',
    ['==', ['get', 'type'], 'landmark'],
    8,
    ['==', ['get', 'type'], 'park'],
    6,
    4,
  ],
  'circle-color': [
    'case',
    ['==', ['get', 'type'], 'landmark'],
    '#ff6b6b',
    ['==', ['get', 'type'], 'park'],
    '#4ecdc4',
    '#45b7d1',
  ],
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
});

const symbolStyle = ref({
  'text-field': ['get', 'name'],
  'text-font': ['Open Sans Regular'],
  'text-size': 12,
  'text-color': '#333',
  'text-halo-color': '#fff',
  'text-halo-width': 1,
  'text-offset': [0, 1.5],
  'text-anchor': 'top',
});
</script>

<style scoped>
.layer-controls {
  margin-bottom: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  gap: 20px;
}

.layer-controls label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}
</style>
```

## Key Features

- **Multiple Layer Types**: Fill, Circle, Line, and Symbol layers
- **Dynamic Styling**: Reactive style updates
- **Data-Driven Styling**: Style based on feature properties
- **Layer Control**: Show/hide layers dynamically
- **Event Handling**: Click and hover events on layers

## Related APIs

- [FillLayer Component](/api/components#filllayer)
- [CircleLayer Component](/api/components#circlelayer)
- [LineLayer Component](/api/components#linelayer)
- [SymbolLayer Component](/api/components#symbollayer)
- [GeoJsonSource Component](/api/components#geojsonsource)
