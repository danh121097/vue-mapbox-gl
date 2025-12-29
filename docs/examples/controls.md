# Controls

Learn how to add navigation controls, geolocation, and custom controls to your map.

## Navigation Controls

Add standard navigation controls to your map:

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px;">
    <NavigationControl position="top-right" />
    <ScaleControl position="bottom-left" />
    <FullscreenControl position="top-left" />
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import {
  Maplibre,
  NavigationControl,
  ScaleControl,
  FullscreenControl,
} from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});
</script>
```

## Geolocation Control

Add geolocation functionality:

```vue
<template>
  <div>
    <div class="status" v-if="locationStatus">
      <p>{{ locationStatus }}</p>
    </div>

    <Maplibre :options="mapOptions" style="height: 400px;">
      <GeolocateControl
        position="top-right"
        :track-user-location="true"
        :show-accuracy-circle="true"
        @geolocate="onGeolocate"
        @error="onGeolocationError"
      />
    </Maplibre>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, GeolocateControl } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const locationStatus = ref('');

function onGeolocate(event) {
  const { latitude, longitude, accuracy } = event.coords;
  locationStatus.value = `Located at: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (±${Math.round(accuracy)}m)`;
}

function onGeolocationError(error) {
  locationStatus.value = `Geolocation error: ${error.message}`;
}
</script>

<style scoped>
.status {
  padding: 10px;
  background: #f0f8ff;
  border: 1px solid #007cbf;
  border-radius: 4px;
  margin-bottom: 10px;
  font-family: monospace;
}
</style>
```

## Custom Control

Create a custom control component:

```vue
<template>
  <div>
    <Maplibre :options="mapOptions" style="height: 400px;" @load="onMapLoad">
      <!-- Built-in controls -->
      <NavigationControl position="top-right" />

      <!-- Custom control using slot -->
      <div class="custom-control-container">
        <div class="custom-control">
          <button @click="goToRandomLocation" title="Random Location">
            🎲
          </button>
          <button @click="resetView" title="Reset View">🏠</button>
          <button @click="toggleStyle" title="Toggle Style">🎨</button>
        </div>
      </div>
    </Maplibre>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, NavigationControl } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const mapInstance = ref(null);
const isDarkStyle = ref(false);

const styles = {
  light: 'https://demotiles.maplibre.org/style.json',
  dark: {
    version: 8,
    sources: {
      'dark-tiles': {
        type: 'raster',
        tiles: [
          'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© CartoDB',
      },
    },
    layers: [
      {
        id: 'dark-layer',
        type: 'raster',
        source: 'dark-tiles',
      },
    ],
  },
};

function onMapLoad(map) {
  mapInstance.value = map;
}

function goToRandomLocation() {
  if (!mapInstance.value) return;

  const randomLng = (Math.random() - 0.5) * 360;
  const randomLat = (Math.random() - 0.5) * 180;

  mapInstance.value.flyTo({
    center: [randomLng, randomLat],
    zoom: Math.random() * 10 + 2,
    duration: 2000,
  });
}

function resetView() {
  if (!mapInstance.value) return;

  mapInstance.value.flyTo({
    center: [0, 0],
    zoom: 2,
    duration: 1000,
  });
}

function toggleStyle() {
  if (!mapInstance.value) return;

  isDarkStyle.value = !isDarkStyle.value;
  const newStyle = isDarkStyle.value ? styles.dark : styles.light;
  mapInstance.value.setStyle(newStyle);
}
</script>

<style scoped>
.custom-control-container {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
}

.custom-control {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.custom-control button {
  width: 40px;
  height: 40px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.custom-control button:hover {
  background: #f0f0f0;
}

.custom-control button:first-child {
  border-radius: 4px 4px 0 0;
}

.custom-control button:last-child {
  border-radius: 0 0 4px 4px;
}

.custom-control button:not(:last-child) {
  border-bottom: 1px solid #eee;
}
</style>
```

## Layer Control

Create a control to toggle map layers:

```vue
<template>
  <div>
    <Maplibre :options="mapOptions" style="height: 400px;">
      <GeoJsonSource :data="layerData" source-id="toggleable-layers">
        <FillLayer v-if="layers.fill.visible" :style="fillStyle" />
        <CircleLayer v-if="layers.circles.visible" :style="circleStyle" />
        <LineLayer v-if="layers.lines.visible" :style="lineStyle" />
      </GeoJsonSource>

      <!-- Layer control panel -->
      <div class="layer-control-panel">
        <h4>Layers</h4>
        <div class="layer-item" v-for="(layer, key) in layers" :key="key">
          <label>
            <input type="checkbox" v-model="layer.visible" />
            {{ layer.name }}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            v-model="layer.opacity"
            :disabled="!layer.visible"
          />
          <span class="opacity-value"
            >{{ Math.round(layer.opacity * 100) }}%</span
          >
        </div>
      </div>
    </Maplibre>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  Maplibre,
  GeoJsonSource,
  FillLayer,
  CircleLayer,
  LineLayer,
} from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-74.006, 40.7128],
  zoom: 11,
});

const layers = ref({
  fill: {
    name: 'Areas',
    visible: true,
    opacity: 0.6,
  },
  circles: {
    name: 'Points',
    visible: true,
    opacity: 0.8,
  },
  lines: {
    name: 'Routes',
    visible: true,
    opacity: 0.7,
  },
});

const layerData = ref({
  type: 'FeatureCollection',
  features: [
    // Polygon
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
      properties: { type: 'area' },
    },
    // Points
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
      properties: { type: 'point' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-73.9857, 40.7589] },
      properties: { type: 'point' },
    },
    // Line
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-74.006, 40.7128],
          [-73.9857, 40.7589],
          [-73.9665, 40.7812],
        ],
      },
      properties: { type: 'route' },
    },
  ],
});

const fillStyle = computed(() => ({
  'fill-color': '#088',
  'fill-opacity': layers.value.fill.opacity,
}));

const circleStyle = computed(() => ({
  'circle-radius': 8,
  'circle-color': '#ff6b6b',
  'circle-opacity': layers.value.circles.opacity,
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
}));

const lineStyle = computed(() => ({
  'line-color': '#007cbf',
  'line-width': 4,
  'line-opacity': layers.value.lines.opacity,
}));
</script>

<style scoped>
.layer-control-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  min-width: 200px;
  z-index: 1000;
}

.layer-control-panel h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
}

.layer-item {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.layer-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
}

.layer-item input[type='range'] {
  width: 100%;
}

.opacity-value {
  font-size: 11px;
  color: #666;
  text-align: right;
}
</style>
```

## Attribution Control

Add custom attribution:

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px;">
    <AttributionControl position="bottom-right" :compact="false" />
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, AttributionControl } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm',
      },
    ],
  },
  center: [0, 0],
  zoom: 2,
});
</script>
```

## Key Features

- **Built-in Controls**: Navigation, scale, fullscreen, and geolocation
- **Custom Controls**: Create your own control components
- **Layer Management**: Toggle and control layer visibility
- **Positioning**: Flexible control positioning
- **Event Handling**: Respond to control interactions

## Related APIs

- [NavigationControl Component](/api/components#navigationcontrol)
- [GeolocateControl Component](/api/components#geolocatecontrol)
- [ScaleControl Component](/api/components#scalecontrol)
- [FullscreenControl Component](/api/components#fullscreencontrol)
- [AttributionControl Component](/api/components#attributioncontrol)
