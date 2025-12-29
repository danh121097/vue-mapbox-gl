# Markers

Learn how to add and customize markers on your map.

## Basic Marker

Add a simple marker to your map:

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px;">
    <Marker :lnglat="[0, 0]">
      <div class="marker">📍</div>
    </Marker>
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, Marker } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});
</script>

<style scoped>
.marker {
  font-size: 24px;
  cursor: pointer;
}
</style>
```

## Draggable Marker

Create a marker that users can drag around:

```vue
<template>
  <div>
    <div class="info">
      <p>Marker position: {{ markerPosition }}</p>
    </div>

    <Maplibre :options="mapOptions" style="height: 400px;">
      <Marker
        :lnglat="markerPosition"
        :draggable="true"
        @dragend="onMarkerDragEnd"
      >
        <div class="draggable-marker">🎯</div>
      </Marker>
    </Maplibre>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, Marker } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const markerPosition = ref([0, 0]);

function onMarkerDragEnd(event) {
  const { lng, lat } = event.target.getLngLat();
  markerPosition.value = [
    Math.round(lng * 1000) / 1000,
    Math.round(lat * 1000) / 1000,
  ];
}
</script>

<style scoped>
.info {
  padding: 10px;
  background: #f5f5f5;
  margin-bottom: 10px;
  border-radius: 4px;
  font-family: monospace;
}

.draggable-marker {
  font-size: 24px;
  cursor: grab;
}

.draggable-marker:active {
  cursor: grabbing;
}
</style>
```

## Multiple Markers

Display multiple markers with different styles:

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px;">
    <Marker
      v-for="marker in markers"
      :key="marker.id"
      :lnglat="marker.coordinates"
      @click="onMarkerClick(marker)"
    >
      <div class="custom-marker" :style="{ backgroundColor: marker.color }">
        {{ marker.icon }}
      </div>
    </Marker>
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, Marker } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 1,
});

const markers = ref([
  {
    id: 1,
    coordinates: [0, 0],
    icon: '🏠',
    color: '#ff6b6b',
    name: 'Home',
  },
  {
    id: 2,
    coordinates: [-74.006, 40.7128],
    icon: '🏢',
    color: '#4ecdc4',
    name: 'New York Office',
  },
  {
    id: 3,
    coordinates: [2.3522, 48.8566],
    icon: '🗼',
    color: '#45b7d1',
    name: 'Paris Office',
  },
  {
    id: 4,
    coordinates: [139.6917, 35.6895],
    icon: '🏯',
    color: '#f9ca24',
    name: 'Tokyo Office',
  },
]);

function onMarkerClick(marker) {
  alert(`Clicked on ${marker.name} at ${marker.coordinates}`);
}
</script>

<style scoped>
.custom-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.custom-marker:hover {
  transform: scale(1.1);
}
</style>
```

## Markers with Popups

Combine markers with popups for rich interactions:

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px;">
    <template v-for="location in locations" :key="location.id">
      <Marker :lnglat="location.coordinates" @click="showPopup(location)">
        <div class="location-marker">
          {{ location.icon }}
        </div>
      </Marker>

      <PopUp
        v-if="selectedLocation?.id === location.id"
        :lnglat="location.coordinates"
        :show="!!selectedLocation"
        @close="selectedLocation = null"
      >
        <div class="popup-content">
          <h3>{{ location.name }}</h3>
          <p>{{ location.description }}</p>
          <div class="popup-actions">
            <button @click="getDirections(location)">Get Directions</button>
            <button @click="saveLocation(location)">Save</button>
          </div>
        </div>
      </PopUp>
    </template>
  </Maplibre>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, Marker, PopUp } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-74.006, 40.7128],
  zoom: 10,
});

const selectedLocation = ref(null);

const locations = ref([
  {
    id: 1,
    name: 'Central Park',
    coordinates: [-73.9665, 40.7812],
    icon: '🌳',
    description: 'A large public park in Manhattan, New York City.',
  },
  {
    id: 2,
    name: 'Times Square',
    coordinates: [-73.9857, 40.7589],
    icon: '🎭',
    description: 'A major commercial intersection and tourist destination.',
  },
  {
    id: 3,
    name: 'Brooklyn Bridge',
    coordinates: [-73.9969, 40.7061],
    icon: '🌉',
    description:
      'A historic suspension bridge connecting Manhattan and Brooklyn.',
  },
]);

function showPopup(location) {
  selectedLocation.value = location;
}

function getDirections(location) {
  alert(`Getting directions to ${location.name}`);
}

function saveLocation(location) {
  alert(`Saved ${location.name} to favorites`);
}
</script>

<style scoped>
.location-marker {
  width: 35px;
  height: 35px;
  background: white;
  border: 2px solid #007cbf;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.location-marker:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.popup-content {
  padding: 15px;
  min-width: 200px;
}

.popup-content h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.popup-content p {
  margin: 0 0 15px 0;
  color: #666;
  line-height: 1.4;
}

.popup-actions {
  display: flex;
  gap: 10px;
}

.popup-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.popup-actions button:first-child {
  background: #007cbf;
  color: white;
}

.popup-actions button:first-child:hover {
  background: #005a8b;
}

.popup-actions button:last-child {
  background: #f0f0f0;
  color: #333;
}

.popup-actions button:last-child:hover {
  background: #e0e0e0;
}
</style>
```

## Dynamic Markers

Add and remove markers dynamically:

```vue
<template>
  <div>
    <div class="controls">
      <button @click="addRandomMarker">Add Random Marker</button>
      <button @click="clearMarkers" :disabled="markers.length === 0">
        Clear All ({{ markers.length }})
      </button>
    </div>

    <Maplibre :options="mapOptions" style="height: 400px;" @click="onMapClick">
      <Marker
        v-for="marker in markers"
        :key="marker.id"
        :lnglat="marker.coordinates"
        @click="removeMarker(marker.id)"
      >
        <div class="dynamic-marker">
          {{ marker.icon }}
          <span class="marker-id">{{ marker.id }}</span>
        </div>
      </Marker>
    </Maplibre>

    <p class="hint">
      Click on the map to add a marker, or click on a marker to remove it.
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Maplibre, Marker } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const markers = ref([]);
const nextId = ref(1);

const icons = ['📍', '🎯', '⭐', '🔥', '💎', '🎈', '🎪', '🎨'];

function addRandomMarker() {
  const randomLng = (Math.random() - 0.5) * 360;
  const randomLat = (Math.random() - 0.5) * 180;
  const randomIcon = icons[Math.floor(Math.random() * icons.length)];

  markers.value.push({
    id: nextId.value++,
    coordinates: [randomLng, randomLat],
    icon: randomIcon,
  });
}

function onMapClick(event) {
  const { lng, lat } = event.lngLat;
  const randomIcon = icons[Math.floor(Math.random() * icons.length)];

  markers.value.push({
    id: nextId.value++,
    coordinates: [lng, lat],
    icon: randomIcon,
  });
}

function removeMarker(id) {
  markers.value = markers.value.filter((marker) => marker.id !== id);
}

function clearMarkers() {
  markers.value = [];
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
  transition: background-color 0.2s;
}

.controls button:hover:not(:disabled) {
  background: #005a8b;
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.dynamic-marker {
  position: relative;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s;
}

.dynamic-marker:hover {
  transform: scale(1.2);
}

.marker-id {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}

.hint {
  margin-top: 10px;
  font-style: italic;
  color: #666;
}
</style>
```

## Key Features

- **Custom Styling**: Full control over marker appearance
- **Drag and Drop**: Interactive marker positioning
- **Event Handling**: Click, drag, and hover events
- **Dynamic Management**: Add/remove markers programmatically
- **Popup Integration**: Rich information display

## Related APIs

- [Marker Component](/api/components#marker)
- [PopUp Component](/api/components#popup)
- [Marker Events](/api/types#marker-events)
