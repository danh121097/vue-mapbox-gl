# Configuration

Vue3 MapLibre GL provides extensive configuration options for maps, components, and composables. This guide covers the most common configuration scenarios.

## Map Configuration

### Basic Map Options

The `Mapbox` component accepts a comprehensive `options` prop that mirrors MapLibre GL's `MapOptions`:

```vue
<template>
  <Mapbox :options="mapOptions" />
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox } from 'vue3-maplibre-gl';

const mapOptions = ref({
  // Style
  style: 'https://demotiles.maplibre.org/style.json',
  
  // Initial view
  center: [0, 0],
  zoom: 2,
  bearing: 0,
  pitch: 0,
  
  // Zoom limits
  minZoom: 0,
  maxZoom: 22,
  
  // Pitch limits
  minPitch: 0,
  maxPitch: 60,
  
  // Bounds
  maxBounds: [[-180, -85], [180, 85]],
  
  // Interaction
  interactive: true,
  scrollZoom: true,
  boxZoom: true,
  dragRotate: true,
  dragPan: true,
  keyboard: true,
  doubleClickZoom: true,
  touchZoomRotate: true,
  
  // Controls
  attributionControl: true,
  
  // Performance
  antialias: true,
  optimizeForTerrain: true,
  
  // Localization
  locale: {
    'AttributionControl.ToggleAttribution': 'Toggle attribution',
    'AttributionControl.MapFeedback': 'Map feedback'
  }
});
</script>
```

### Advanced Configuration

```vue
<script setup>
import { ref } from 'vue';

const advancedMapOptions = ref({
  style: {
    version: 8,
    sources: {},
    layers: [],
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    sprite: 'https://sprites.example.com/sprite'
  },
  
  // Custom projection (MapLibre GL v3+)
  projection: 'mercator',
  
  // Terrain
  terrain: {
    source: 'terrain-source',
    exaggeration: 1.5
  },
  
  // Fog
  fog: {
    color: 'rgb(186, 210, 235)',
    'high-color': 'rgb(36, 92, 223)',
    'horizon-blend': 0.02,
    'space-color': 'rgb(11, 11, 25)',
    'star-intensity': 0.6
  },
  
  // Light
  light: {
    anchor: 'viewport',
    color: 'white',
    intensity: 0.4
  },
  
  // Performance optimizations
  fadeDuration: 300,
  crossSourceCollisions: true,
  collectResourceTiming: false,
  
  // Custom transform request
  transformRequest: (url, resourceType) => {
    if (resourceType === 'Source' && url.startsWith('http://myHost')) {
      return {
        url: url.replace('http', 'https'),
        headers: { 'my-custom-header': true },
        credentials: 'include'
      };
    }
  }
});
</script>
```

## Component Configuration

### GeoJsonSource Configuration

```vue
<template>
  <Mapbox :options="mapOptions">
    <GeoJsonSource 
      id="my-source"
      :data="geoJsonData"
      :options="sourceOptions"
      :debug="true"
      @load="onSourceLoad"
      @error="onSourceError"
    >
      <FillLayer :style="fillStyle" />
    </GeoJsonSource>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';

const sourceOptions = ref({
  // Clustering
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50,
  clusterMinPoints: 2,
  clusterProperties: {
    sum: ['+', ['get', 'value']],
    max: ['max', ['get', 'value']]
  },
  
  // Performance
  buffer: 128,
  tolerance: 0.375,
  maxzoom: 18,
  
  // Line metrics for LineString features
  lineMetrics: true,
  
  // Generate feature IDs
  generateId: true,
  
  // Attribution
  attribution: 'Data source attribution'
});

function onSourceLoad(source) {
  console.log('Source loaded:', source);
}

function onSourceError(error) {
  console.error('Source error:', error);
}
</script>
```

### Layer Configuration

```vue
<template>
  <GeoJsonSource :data="data">
    <!-- Fill Layer -->
    <FillLayer 
      id="polygons"
      :style="fillStyle"
      :filter="fillFilter"
      :minzoom="5"
      :maxzoom="15"
      :metadata="{ description: 'Polygon layer' }"
    />
    
    <!-- Circle Layer -->
    <CircleLayer 
      id="points"
      :style="circleStyle"
      :filter="pointFilter"
      source-layer="points"
    />
    
    <!-- Line Layer -->
    <LineLayer 
      id="lines"
      :style="lineStyle"
      before-id="polygons"
    />
    
    <!-- Symbol Layer -->
    <SymbolLayer 
      id="labels"
      :style="symbolStyle"
      :visible="showLabels"
    />
  </GeoJsonSource>
</template>

<script setup>
import { ref } from 'vue';

// Layer styles with expressions
const fillStyle = ref({
  'fill-color': [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    '#627BC1',
    ['interpolate', ['linear'], ['get', 'value'], 0, '#F2F12D', 100, '#E55E5E']
  ],
  'fill-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 15, 0.8]
});

const circleStyle = ref({
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    5, ['*', ['get', 'magnitude'], 2],
    15, ['*', ['get', 'magnitude'], 10]
  ],
  'circle-color': [
    'interpolate', ['linear'], ['get', 'magnitude'],
    1, '#ffffcc',
    5, '#fd8d3c',
    10, '#800026'
  ],
  'circle-stroke-width': 1,
  'circle-stroke-color': '#fff'
});

const lineStyle = ref({
  'line-color': '#007cbf',
  'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 15, 8],
  'line-opacity': 0.8,
  'line-dasharray': [2, 2]
});

const symbolStyle = ref({
  'text-field': ['get', 'name'],
  'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
  'text-size': ['interpolate', ['linear'], ['zoom'], 10, 12, 16, 18],
  'text-color': '#333',
  'text-halo-color': '#fff',
  'text-halo-width': 1,
  'text-anchor': 'top',
  'text-offset': [0, 1],
  'icon-image': 'marker-icon',
  'icon-size': 0.8
});

// Filters
const fillFilter = ref(['==', ['geometry-type'], 'Polygon']);
const pointFilter = ref(['==', ['geometry-type'], 'Point']);

const showLabels = ref(true);
</script>
```

### Marker Configuration

```vue
<template>
  <Mapbox :options="mapOptions">
    <Marker
      :lnglat="markerPosition"
      :options="markerOptions"
      :draggable="true"
      :popup="markerPopup"
      @dragend="onMarkerDragEnd"
    >
      <div class="custom-marker">
        <img src="/marker-icon.png" alt="Marker" />
      </div>
    </Marker>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Popup } from 'maplibre-gl';

const markerPosition = ref([0, 0]);

const markerOptions = ref({
  color: '#FF0000',
  anchor: 'bottom',
  offset: [0, -10],
  clickTolerance: 5,
  rotation: 0,
  rotationAlignment: 'map',
  pitchAlignment: 'auto',
  scale: 1.2,
  occludedOpacity: 0.2
});

const markerPopup = ref(new Popup({
  closeButton: true,
  closeOnClick: false,
  anchor: 'bottom',
  offset: [0, -40]
}).setHTML('<h3>Custom Marker</h3><p>This is a custom marker with popup</p>'));

function onMarkerDragEnd(event) {
  const lngLat = event.target.getLngLat();
  markerPosition.value = [lngLat.lng, lngLat.lat];
  console.log('Marker moved to:', markerPosition.value);
}
</script>

<style>
.custom-marker {
  cursor: pointer;
  transition: transform 0.2s;
}

.custom-marker:hover {
  transform: scale(1.1);
}

.custom-marker img {
  width: 32px;
  height: 32px;
}
</style>
```

## Composable Configuration

### Map Composables

```vue
<script setup>
import { ref } from 'vue';
import { useCreateMapbox, useFlyTo, useMapEventListener } from 'vue3-maplibre-gl';

const mapContainer = ref();
const mapStyle = ref('https://demotiles.maplibre.org/style.json');

// Enhanced map creation with configuration
const {
  mapInstance,
  setCenter,
  setZoom,
  isMapReady,
  isMapLoading,
  hasMapError
} = useCreateMapbox(mapContainer, mapStyle, {
  register: (actions) => {
    console.log('Map actions registered:', actions);
  },
  debug: true,
  onLoad: (map) => {
    console.log('Map loaded successfully');
    // Configure map after load
    map.addControl(new NavigationControl(), 'top-right');
  },
  onError: (error) => {
    console.error('Map loading error:', error);
  }
});

// Animation configuration
const { flyTo, isFlying } = useFlyTo({
  map: mapInstance
});

// Event listener configuration
useMapEventListener({
  map: mapInstance,
  event: 'click',
  handler: (event) => {
    flyTo({
      center: event.lngLat,
      zoom: 12,
      duration: 2000,
      essential: true,
      easing: (t) => t * (2 - t) // easeOutQuad
    });
  }
});
</script>
```

### Source and Layer Composables

```vue
<script setup>
import { ref } from 'vue';
import { 
  useCreateGeoJsonSource, 
  useCreateFillLayer,
  useLayerEventListener 
} from 'vue3-maplibre-gl';

const mapInstance = ref();

// Source configuration
const {
  sourceId,
  setData,
  isSourceReady
} = useCreateGeoJsonSource({
  map: mapInstance,
  id: 'my-source',
  data: {
    type: 'FeatureCollection',
    features: []
  },
  options: {
    cluster: true,
    clusterMaxZoom: 14
  },
  debug: true,
  register: (actions, map) => {
    console.log('Source registered:', actions);
  }
});

// Layer configuration
const {
  getLayer,
  setStyle,
  setFilter
} = useCreateFillLayer({
  map: mapInstance,
  source: sourceId,
  id: 'fill-layer',
  style: {
    'fill-color': '#088',
    'fill-opacity': 0.8
  },
  register: (actions, map) => {
    console.log('Layer registered:', actions);
  }
});

// Layer event configuration
useLayerEventListener({
  map: mapInstance,
  layerId: 'fill-layer',
  event: 'click',
  handler: (event) => {
    console.log('Layer clicked:', event.features[0]);
    
    // Update layer style on click
    setStyle({
      'fill-color': '#ff0000',
      'fill-opacity': 0.6
    });
  }
});
</script>
```

## Environment Configuration

### Development vs Production

```js
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  define: {
    __VUE_MAPLIBRE_DEBUG__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  optimizeDeps: {
    include: ['maplibre-gl', 'vue3-maplibre-gl']
  },
  build: {
    rollupOptions: {
      external: process.env.NODE_ENV === 'production' ? [] : ['maplibre-gl']
    }
  }
});
```

### Global Configuration

```js
// main.js
import { createApp } from 'vue';
import VueMapLibreGl from 'vue3-maplibre-gl';
import 'vue3-maplibre-gl/dist/style.css';

const app = createApp(App);

// Global configuration
app.use(VueMapLibreGl, {
  // Global debug mode
  debug: process.env.NODE_ENV === 'development',
  
  // Default map options
  defaultMapOptions: {
    style: 'https://demotiles.maplibre.org/style.json',
    center: [0, 0],
    zoom: 2
  },
  
  // Global error handler
  onError: (error, context) => {
    console.error('Vue MapLibre GL Error:', error, context);
    // Send to error reporting service
  }
});

app.mount('#app');
```

This configuration guide covers the most common scenarios for customizing Vue3 MapLibre GL components and composables. For more advanced configurations, refer to the [API documentation](/api/components) and [MapLibre GL JS documentation](https://maplibre.org/maplibre-gl-js-docs/api/).
