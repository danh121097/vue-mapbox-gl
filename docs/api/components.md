# Components

Vue MapLibre GL provides a comprehensive set of Vue 3 components for building interactive maps.

## MapLibreMap

The main map component that renders the MapLibre GL JS map.

### Props

| Prop                 | Type                           | Default     | Description                    |
| -------------------- | ------------------------------ | ----------- | ------------------------------ |
| `mapStyle`           | `string \| StyleSpecification` | `undefined` | Map style URL or style object  |
| `center`             | `LngLatLike`                   | `[0, 0]`    | Initial center coordinates     |
| `zoom`               | `number`                       | `0`         | Initial zoom level             |
| `bearing`            | `number`                       | `0`         | Initial bearing (rotation)     |
| `pitch`              | `number`                       | `0`         | Initial pitch (tilt)           |
| `minZoom`            | `number`                       | `0`         | Minimum zoom level             |
| `maxZoom`            | `number`                       | `22`        | Maximum zoom level             |
| `interactive`        | `boolean`                      | `true`      | Whether the map is interactive |
| `attributionControl` | `boolean`                      | `true`      | Show attribution control       |

### Events

| Event   | Payload         | Description                             |
| ------- | --------------- | --------------------------------------- |
| `load`  | `MapLibreEvent` | Fired when the map has finished loading |
| `click` | `MapMouseEvent` | Fired when the map is clicked           |
| `move`  | `MapLibreEvent` | Fired when the map is moved             |
| `zoom`  | `MapLibreEvent` | Fired when the zoom level changes       |

### Example

```vue
<template>
  <MapLibreMap
    :map-style="mapStyle"
    :center="center"
    :zoom="zoom"
    @load="onMapLoad"
    @click="onMapClick"
    style="height: 400px"
  >
    <!-- Child components go here -->
  </MapLibreMap>
</template>

<script setup>
import { ref } from 'vue';
import { MapLibreMap } from 'vue3-maplibre-gl';

const mapStyle = ref('https://demotiles.maplibre.org/style.json');
const center = ref([0, 0]);
const zoom = ref(2);

const onMapLoad = (event) => {
  console.log('Map loaded:', event);
};

const onMapClick = (event) => {
  console.log('Map clicked:', event.lngLat);
};
</script>
```

## MapLibreMarker

A component for adding markers to the map.

### Props

| Prop        | Type         | Default      | Description                     |
| ----------- | ------------ | ------------ | ------------------------------- |
| `lngLat`    | `LngLatLike` | **required** | Marker coordinates              |
| `offset`    | `PointLike`  | `[0, 0]`     | Marker offset                   |
| `anchor`    | `string`     | `'center'`   | Marker anchor point             |
| `draggable` | `boolean`    | `false`      | Whether the marker is draggable |

### Events

| Event       | Payload       | Description                |
| ----------- | ------------- | -------------------------- |
| `dragstart` | `MarkerEvent` | Fired when dragging starts |
| `drag`      | `MarkerEvent` | Fired during dragging      |
| `dragend`   | `MarkerEvent` | Fired when dragging ends   |

### Example

```vue
<template>
  <MapLibreMap :map-style="mapStyle" :center="[0, 0]" :zoom="2">
    <MapLibreMarker
      :lng-lat="markerPosition"
      :draggable="true"
      @dragend="onMarkerDragEnd"
    >
      <div class="custom-marker">📍</div>
    </MapLibreMarker>
  </MapLibreMap>
</template>

<script setup>
import { ref } from 'vue';
import { MapLibreMap, MapLibreMarker } from 'vue3-maplibre-gl';

const markerPosition = ref([0, 0]);

const onMarkerDragEnd = (event) => {
  markerPosition.value = [
    event.target.getLngLat().lng,
    event.target.getLngLat().lat,
  ];
};
</script>

<style>
.custom-marker {
  font-size: 24px;
  cursor: pointer;
}
</style>
```

## MapLibrePopup

A component for displaying popups on the map.

### Props

| Prop           | Type         | Default      | Description        |
| -------------- | ------------ | ------------ | ------------------ |
| `lngLat`       | `LngLatLike` | **required** | Popup coordinates  |
| `offset`       | `PointLike`  | `[0, 0]`     | Popup offset       |
| `anchor`       | `string`     | `undefined`  | Popup anchor point |
| `closeButton`  | `boolean`    | `true`       | Show close button  |
| `closeOnClick` | `boolean`    | `true`       | Close on map click |

### Events

| Event   | Payload      | Description             |
| ------- | ------------ | ----------------------- |
| `open`  | `PopupEvent` | Fired when popup opens  |
| `close` | `PopupEvent` | Fired when popup closes |

### Example

```vue
<template>
  <MapLibreMap :map-style="mapStyle" :center="[0, 0]" :zoom="2">
    <MapLibrePopup :lng-lat="[0, 0]" :close-button="true" @close="onPopupClose">
      <div class="popup-content">
        <h3>Hello World!</h3>
        <p>This is a popup.</p>
      </div>
    </MapLibrePopup>
  </MapLibreMap>
</template>
```

## MapLibreControl

A component for adding custom controls to the map.

### Props

| Prop       | Type     | Default       | Description      |
| ---------- | -------- | ------------- | ---------------- |
| `position` | `string` | `'top-right'` | Control position |

### Example

```vue
<template>
  <MapLibreMap :map-style="mapStyle" :center="[0, 0]" :zoom="2">
    <MapLibreControl position="top-left">
      <button @click="resetView">Reset View</button>
    </MapLibreControl>
  </MapLibreMap>
</template>
```

## MapLibreSource

A component for adding data sources to the map.

### Props

| Prop     | Type                  | Default      | Description          |
| -------- | --------------------- | ------------ | -------------------- |
| `id`     | `string`              | **required** | Source ID            |
| `source` | `SourceSpecification` | **required** | Source specification |

## MapLibreLayer

A component for adding layers to the map.

### Props

| Prop       | Type                 | Default      | Description                 |
| ---------- | -------------------- | ------------ | --------------------------- |
| `id`       | `string`             | **required** | Layer ID                    |
| `layer`    | `LayerSpecification` | **required** | Layer specification         |
| `beforeId` | `string`             | `undefined`  | Insert layer before this ID |
