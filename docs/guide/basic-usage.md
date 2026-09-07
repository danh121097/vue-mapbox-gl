# Basic Usage

Learn how to use Vue MapLibre GL components and composables in your Vue 3 applications.

## Creating Your First Map

The most basic usage involves creating a map with the `Maplibre` component:

```vue
<template>
  <Maplibre
    :options="mapOptions"
    style="height: 400px; width: 100%;"
    @load="onMapLoad"
  />
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre } from 'vue3-maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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

## Adding Data Sources

Use the `GeoJsonSource` component to add data to your map:

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px;">
    <GeoJsonSource :data="geoJsonData" id="my-data">
      <FillLayer :style="fillStyle" />
      <CircleLayer :style="circleStyle" />
    </GeoJsonSource>
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import {
  Maplibre,
  GeoJsonSource,
  FillLayer,
  CircleLayer,
} from 'vue3-maplibre-gl';

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
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
      properties: {
        name: 'Sample Point',
      },
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
</script>
```

## Adding Markers and Popups

Add interactive markers and popups to your map:

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px;">
    <Marker :lnglat="[0, 0]" :draggable="true" @dragend="onMarkerDragEnd">
      <div class="custom-marker">📍</div>
    </Marker>

    <Popup :lnglat="popupLocation" :show="showPopup" @close="showPopup = false">
      <div class="popup-content">
        <h3>Hello World!</h3>
        <p>This is a popup at {{ popupLocation }}</p>
      </div>
    </Popup>
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, Marker, Popup } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const popupLocation = ref([0, 0]);
const showPopup = ref(true);

function onMarkerDragEnd(event) {
  const { lng, lat } = event.target.getLngLat();
  popupLocation.value = [lng, lat];
  console.log('Marker moved to:', [lng, lat]);
}
</script>

<style scoped>
.custom-marker {
  font-size: 24px;
  cursor: pointer;
}

.popup-content {
  padding: 10px;
  min-width: 200px;
}
</style>
```

## Using Composables

For more advanced functionality, use the provided composables:

```vue
<template>
  <div>
    <Maplibre :options="mapOptions" style="height: 400px;" @load="onMapLoad" />

    <div class="controls">
      <button @click="flyToLocation">Fly to New York</button>
      <button @click="addRandomPoint">Add Random Point</button>
      <p>Current zoom: {{ currentZoom }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue';
import {
  Maplibre,
  useFlyTo,
  useMapEventListener,
  useCreateGeoJsonSource,
} from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const mapInstance = shallowRef(null);

// Use composables for enhanced functionality
const { flyTo } = useFlyTo({ map: mapInstance });

// The camera composables expose actions, not a live zoom value. Track it from
// the map's own `zoom` event when you want to display it.
const currentZoom = ref(2);
useMapEventListener({
  map: mapInstance,
  event: 'zoom',
  on: () => {
    currentZoom.value = mapInstance.value?.getZoom() ?? currentZoom.value;
  },
});

// `data` is the source's initial payload; later changes go through setData.
const points = ref({ type: 'FeatureCollection', features: [] });
const { setData } = useCreateGeoJsonSource({
  map: mapInstance,
  id: 'random-points',
  data: points.value,
});

function onMapLoad(map) {
  mapInstance.value = map;
}

function flyToLocation() {
  flyTo({
    center: [-74.006, 40.7128], // New York
    zoom: 10,
    duration: 2000,
  });
}

function addRandomPoint() {
  const randomLng = (Math.random() - 0.5) * 360;
  const randomLat = (Math.random() - 0.5) * 180;

  const newFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [randomLng, randomLat],
    },
    properties: {
      id: Date.now(),
    },
  };

  // Update the data source. setData takes the new collection, not an updater.
  points.value = {
    ...points.value,
    features: [...points.value.features, newFeature],
  };
  setData(points.value);
}
</script>

<style scoped>
.controls {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
}

button {
  padding: 8px 16px;
  background: #3c82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #2563eb;
}
</style>
```

## Event Handling

Handle map and layer events:

```vue
<template>
  <Maplibre
    :options="mapOptions"
    style="height: 400px;"
    @load="onMapLoad"
    @click="onMapClick"
    @zoom="onMapZoom"
  >
    <GeoJsonSource :data="geoJsonData" id="clickable-data">
      <CircleLayer
        :style="circleStyle"
        id="clickable-circles"
        @click="onCircleClick"
      />
    </GeoJsonSource>
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, GeoJsonSource, CircleLayer } from 'vue3-maplibre-gl';

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
      properties: { name: 'Clickable Point' },
    },
  ],
});

const circleStyle = ref({
  'circle-radius': 10,
  'circle-color': '#007cbf',
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
});

function onMapLoad(map) {
  console.log('Map loaded:', map);
}

function onMapClick(event) {
  console.log('Map clicked at:', event.lngLat);
}

function onMapZoom(event) {
  console.log('Map zoom changed to:', event.target.getZoom());
}

function onCircleClick(event) {
  console.log('Circle clicked:', event.features[0].properties);
}
</script>
```

## Next Steps

Now that you understand the basics:

- Explore the [complete API reference](/api/components) for all available components
- Learn about [advanced composables](/api/composables) for complex functionality
- Check out [configuration options](/guide/configuration) for customization
- Browse [practical examples](/examples/) for real-world use cases
