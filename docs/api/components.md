# Components API Reference

Vue3 MapLibre GL provides a comprehensive set of Vue 3 components for building interactive maps with MapLibre GL JS. All components are designed with TypeScript support, reactive data binding, and comprehensive error handling.

## Mapbox

The main map component that renders the MapLibre GL JS map. This is the core component that provides the map container and manages the MapLibre GL instance.

### Props

| Prop             | Type                                 | Default      | Description                                |
| ---------------- | ------------------------------------ | ------------ | ------------------------------------------ |
| `options`        | `Partial<MapOptions>`                | `{}`         | Map configuration options from MapLibre GL |
| `register`       | `(actions: MaplibreActions) => void` | `undefined`  | Callback for registering map actions       |
| `debug`          | `boolean`                            | `false`      | Enable debug logging                       |
| `autoCleanup`    | `boolean`                            | `true`       | Automatically cleanup resources on unmount |
| `containerId`    | `string`                             | `'maplibre'` | Container ID for the map element           |
| `containerClass` | `string`                             | `''`         | Custom container class names               |
| `onError`        | `(error: any) => void`               | `undefined`  | Error handling callback                    |
| `onLoad`         | `(map: Map) => void`                 | `undefined`  | Load success callback                      |

### Events

| Event         | Payload           | Description                             |
| ------------- | ----------------- | --------------------------------------- |
| `register`    | `MaplibreActions` | Fired when map actions are registered   |
| `load`        | `MapLibreEvent`   | Fired when the map has finished loading |
| `error`       | `ErrorEvent`      | Fired when an error occurs              |
| `click`       | `MapMouseEvent`   | Fired when the map is clicked           |
| `dblclick`    | `MapMouseEvent`   | Fired when the map is double-clicked    |
| `contextmenu` | `MapMouseEvent`   | Fired when right-clicking the map       |
| `mousemove`   | `MapMouseEvent`   | Fired when mouse moves over the map     |
| `mouseup`     | `MapMouseEvent`   | Fired when mouse button is released     |
| `mousedown`   | `MapMouseEvent`   | Fired when mouse button is pressed      |
| `mouseout`    | `MapMouseEvent`   | Fired when mouse leaves the map         |
| `mouseover`   | `MapMouseEvent`   | Fired when mouse enters the map         |
| `movestart`   | `MapLibreEvent`   | Fired when map movement starts          |
| `move`        | `MapLibreEvent`   | Fired during map movement               |
| `moveend`     | `MapLibreEvent`   | Fired when map movement ends            |
| `zoomstart`   | `MapLibreEvent`   | Fired when zoom starts                  |
| `zoom`        | `MapLibreEvent`   | Fired during zoom                       |
| `zoomend`     | `MapLibreEvent`   | Fired when zoom ends                    |
| `rotatestart` | `MapLibreEvent`   | Fired when rotation starts              |
| `rotate`      | `MapLibreEvent`   | Fired during rotation                   |
| `rotateend`   | `MapLibreEvent`   | Fired when rotation ends                |
| `dragstart`   | `MapLibreEvent`   | Fired when dragging starts              |
| `drag`        | `MapLibreEvent`   | Fired during dragging                   |
| `dragend`     | `MapLibreEvent`   | Fired when dragging ends                |
| `pitchstart`  | `MapLibreEvent`   | Fired when pitch starts                 |
| `pitch`       | `MapLibreEvent`   | Fired during pitch                      |
| `pitchend`    | `MapLibreEvent`   | Fired when pitch ends                   |
| `wheel`       | `MapWheelEvent`   | Fired on mouse wheel events             |
| `terrain`     | `MapTerrainEvent` | Fired on terrain events                 |

### Slots

| Slot      | Description                                |
| --------- | ------------------------------------------ |
| `default` | Main content slot for child components     |
| `loading` | Content shown while map is loading         |
| `error`   | Content shown when map encounters an error |

### Example

```vue
<template>
  <Mapbox
    :options="mapOptions"
    :debug="true"
    @load="onMapLoad"
    @error="onMapError"
    style="height: 500px"
  >
    <template #loading>
      <div class="loading">Loading map...</div>
    </template>

    <template #error>
      <div class="error">Failed to load map</div>
    </template>

    <!-- Child components -->
    <GeoJsonSource :data="geoJsonData">
      <FillLayer :style="fillStyle" />
    </GeoJsonSource>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox, GeoJsonSource, FillLayer } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const geoJsonData = ref({
  type: 'FeatureCollection',
  features: [],
});

const fillStyle = ref({
  'fill-color': '#088',
  'fill-opacity': 0.8,
});

function onMapLoad(map) {
  console.log('Map loaded:', map);
}

function onMapError(error) {
  console.error('Map error:', error);
}
</script>
```

## GeoJsonSource

A component for adding GeoJSON data sources to the map. This component provides the data that can be styled by layer components. It supports reactive data updates, clustering, and comprehensive error handling.

### Props

| Prop           | Type                                                 | Default                                       | Description                                |
| -------------- | ---------------------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| `id`           | `string`                                             | `undefined`                                   | Unique identifier for the source           |
| `data`         | `GeoJSONSourceSpecification['data']`                 | `{ type: 'FeatureCollection', features: [] }` | GeoJSON data or URL to GeoJSON             |
| `options`      | `Partial<GeoJSONSourceSpecification>`                | `{}`                                          | Additional GeoJSON source options          |
| `debug`        | `boolean`                                            | `false`                                       | Enable debug logging                       |
| `autoCleanup`  | `boolean`                                            | `true`                                        | Automatically cleanup resources on unmount |
| `register`     | `(actions: CreateGeoJsonSourceActions) => void`      | `undefined`                                   | Callback for registering source actions    |
| `onLoad`       | `(source: any) => void`                              | `undefined`                                   | Load success callback                      |
| `onError`      | `(error: any) => void`                               | `undefined`                                   | Error handling callback                    |
| `onDataUpdate` | `(data: GeoJSONSourceSpecification['data']) => void` | `undefined`                                   | Data update callback                       |

### Events

| Event         | Payload                              | Description                     |
| ------------- | ------------------------------------ | ------------------------------- |
| `register`    | `CreateGeoJsonSourceActions`         | Fired when source is registered |
| `load`        | `GeoJSONSource`                      | Fired when source is loaded     |
| `error`       | `Error`                              | Fired when an error occurs      |
| `data-update` | `GeoJSONSourceSpecification['data']` | Fired when data is updated      |

### Example

```vue
<template>
  <Mapbox :options="mapOptions">
    <GeoJsonSource
      id="my-source"
      :data="geoJsonData"
      :cluster="true"
      :cluster-max-zoom="14"
      :cluster-radius="50"
    >
      <CircleLayer :style="circleStyle" />
    </GeoJsonSource>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox, GeoJsonSource, CircleLayer } from 'vue3-maplibre-gl';

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

const circleStyle = ref({
  'circle-radius': 6,
  'circle-color': '#007cbf',
});
</script>
```

## FillLayer

A component for rendering filled polygons from a data source. Supports all MapLibre GL fill layer properties with reactive updates and comprehensive event handling.

### Props

| Prop          | Type                  | Default     | Description                                   |
| ------------- | --------------------- | ----------- | --------------------------------------------- |
| `id`          | `string`              | `undefined` | Unique identifier for the layer               |
| `source`      | `string \| object`    | `undefined` | Data source for the layer                     |
| `sourceLayer` | `string`              | `undefined` | Source layer name for vector sources          |
| `filter`      | `FilterSpecification` | `['all']`   | Filter expression to apply to the layer       |
| `style`       | `FillLayerStyle`      | `{}`        | Style configuration for the fill layer        |
| `maxzoom`     | `number`              | `24`        | Maximum zoom level for layer visibility       |
| `minzoom`     | `number`              | `0`         | Minimum zoom level for layer visibility       |
| `metadata`    | `object`              | `undefined` | Arbitrary metadata for the layer              |
| `beforeId`    | `string`              | `undefined` | ID of layer before which to insert this layer |
| `visible`     | `boolean`             | `true`      | Whether the layer is visible                  |

### Events

| Event         | Payload              | Description                                  |
| ------------- | -------------------- | -------------------------------------------- |
| `register`    | `CreateLayerActions` | Fired when layer is registered               |
| `click`       | `MapLayerMouseEvent` | Fired when layer is clicked                  |
| `dblclick`    | `MapLayerMouseEvent` | Fired when layer is double-clicked           |
| `mousedown`   | `MapLayerMouseEvent` | Fired when mouse button is pressed on layer  |
| `mouseup`     | `MapLayerMouseEvent` | Fired when mouse button is released on layer |
| `mousemove`   | `MapLayerMouseEvent` | Fired when mouse moves over layer            |
| `mouseenter`  | `MapLayerMouseEvent` | Fired when mouse enters layer                |
| `mouseleave`  | `MapLayerMouseEvent` | Fired when mouse leaves layer                |
| `mouseover`   | `MapLayerMouseEvent` | Fired when mouse is over layer               |
| `mouseout`    | `MapLayerMouseEvent` | Fired when mouse leaves layer                |
| `contextmenu` | `MapLayerMouseEvent` | Fired when right-clicking layer              |
| `touchstart`  | `MapLayerTouchEvent` | Fired when touch starts on layer             |
| `touchend`    | `MapLayerTouchEvent` | Fired when touch ends on layer               |
| `touchcancel` | `MapLayerTouchEvent` | Fired when touch is cancelled on layer       |

### Example

```vue
<template>
  <Mapbox :options="mapOptions">
    <GeoJsonSource :data="polygonData">
      <FillLayer
        id="polygon-fill"
        :style="fillStyle"
        :filter="['==', 'type', 'polygon']"
        @click="onPolygonClick"
      />
    </GeoJsonSource>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox, GeoJsonSource, FillLayer } from 'vue3-maplibre-gl';

const fillStyle = ref({
  'fill-color': [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    '#627BC1',
    '#41B883',
  ],
  'fill-opacity': 0.8,
});

function onPolygonClick(event) {
  console.log('Polygon clicked:', event.features[0]);
}
</script>
```

## CircleLayer

A component for rendering circles from point data sources. Perfect for displaying point data with customizable radius, color, and stroke properties.

### Props

| Prop          | Type                  | Default     | Description                                   |
| ------------- | --------------------- | ----------- | --------------------------------------------- |
| `id`          | `string`              | `undefined` | Unique identifier for the layer               |
| `source`      | `string \| object`    | `undefined` | Data source for the layer                     |
| `sourceLayer` | `string`              | `undefined` | Source layer name for vector sources          |
| `filter`      | `FilterSpecification` | `['all']`   | Filter expression to apply to the layer       |
| `style`       | `CircleLayerStyle`    | `{}`        | Style configuration for the circle layer      |
| `maxzoom`     | `number`              | `24`        | Maximum zoom level for layer visibility       |
| `minzoom`     | `number`              | `0`         | Minimum zoom level for layer visibility       |
| `metadata`    | `object`              | `undefined` | Arbitrary metadata for the layer              |
| `beforeId`    | `string`              | `undefined` | ID of layer before which to insert this layer |
| `visible`     | `boolean`             | `true`      | Whether the layer is visible                  |

### Events

Same events as FillLayer (click, mousemove, etc.)

### Example

```vue
<template>
  <Mapbox :options="mapOptions">
    <GeoJsonSource :data="pointData">
      <CircleLayer id="points" :style="circleStyle" @click="onPointClick" />
    </GeoJsonSource>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox, GeoJsonSource, CircleLayer } from 'vue3-maplibre-gl';

const circleStyle = ref({
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2, 15, 10],
  'circle-color': [
    'interpolate',
    ['linear'],
    ['get', 'magnitude'],
    1,
    '#ffffcc',
    5,
    '#fd8d3c',
    10,
    '#800026',
  ],
  'circle-stroke-width': 1,
  'circle-stroke-color': '#fff',
});

function onPointClick(event) {
  console.log('Point clicked:', event.features[0]);
}
</script>
```

## LineLayer

A component for rendering lines from line data sources. Ideal for displaying routes, boundaries, and other linear features with customizable styling.

### Props

| Prop          | Type                  | Default     | Description                                   |
| ------------- | --------------------- | ----------- | --------------------------------------------- |
| `id`          | `string`              | `undefined` | Unique identifier for the layer               |
| `source`      | `string \| object`    | `undefined` | Data source for the layer                     |
| `sourceLayer` | `string`              | `undefined` | Source layer name for vector sources          |
| `filter`      | `FilterSpecification` | `['all']`   | Filter expression to apply to the layer       |
| `style`       | `LineLayerStyle`      | `{}`        | Style configuration for the line layer        |
| `maxzoom`     | `number`              | `24`        | Maximum zoom level for layer visibility       |
| `minzoom`     | `number`              | `0`         | Minimum zoom level for layer visibility       |
| `metadata`    | `object`              | `undefined` | Arbitrary metadata for the layer              |
| `beforeId`    | `string`              | `undefined` | ID of layer before which to insert this layer |
| `visible`     | `boolean`             | `true`      | Whether the layer is visible                  |

### Events

Same events as FillLayer (click, mousemove, etc.)

### Example

```vue
<template>
  <Mapbox :options="mapOptions">
    <GeoJsonSource :data="lineData">
      <LineLayer id="routes" :style="lineStyle" @click="onLineClick" />
    </GeoJsonSource>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox, GeoJsonSource, LineLayer } from 'vue3-maplibre-gl';

const lineStyle = ref({
  'line-color': '#007cbf',
  'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 15, 8],
  'line-opacity': 0.8,
});

function onLineClick(event) {
  console.log('Line clicked:', event.features[0]);
}
</script>
```

## SymbolLayer

A component for rendering symbols (icons and text) from point data sources. Perfect for displaying labels, icons, and other symbolic representations on the map.

### Props

| Prop          | Type                  | Default     | Description                                   |
| ------------- | --------------------- | ----------- | --------------------------------------------- |
| `id`          | `string`              | `undefined` | Unique identifier for the layer               |
| `source`      | `string \| object`    | `undefined` | Data source for the layer                     |
| `sourceLayer` | `string`              | `undefined` | Source layer name for vector sources          |
| `filter`      | `FilterSpecification` | `['all']`   | Filter expression to apply to the layer       |
| `style`       | `SymbolLayerStyle`    | `{}`        | Style configuration for the symbol layer      |
| `maxzoom`     | `number`              | `24`        | Maximum zoom level for layer visibility       |
| `minzoom`     | `number`              | `0`         | Minimum zoom level for layer visibility       |
| `metadata`    | `object`              | `undefined` | Arbitrary metadata for the layer              |
| `beforeId`    | `string`              | `undefined` | ID of layer before which to insert this layer |
| `visible`     | `boolean`             | `true`      | Whether the layer is visible                  |

### Events

Same events as FillLayer (click, mousemove, etc.)

### Example

```vue
<template>
  <Mapbox :options="mapOptions">
    <GeoJsonSource :data="pointData">
      <SymbolLayer id="labels" :style="symbolStyle" @click="onSymbolClick" />
    </GeoJsonSource>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox, GeoJsonSource, SymbolLayer } from 'vue3-maplibre-gl';

const symbolStyle = ref({
  'text-field': ['get', 'name'],
  'text-font': ['Open Sans Regular'],
  'text-size': 12,
  'text-color': '#333',
  'text-halo-color': '#fff',
  'text-halo-width': 1,
  'text-anchor': 'top',
  'text-offset': [0, 1],
});

function onSymbolClick(event) {
  console.log('Symbol clicked:', event.features[0]);
}
</script>
```

## Marker

A component for adding HTML markers to the map. Supports custom HTML content, dragging, and comprehensive styling options.

### Props

| Prop                | Type            | Default     | Description                            |
| ------------------- | --------------- | ----------- | -------------------------------------- |
| `lnglat`            | `LngLatLike`    | `undefined` | Geographic coordinates for the marker  |
| `popup`             | `Popup`         | `undefined` | Popup to associate with the marker     |
| `options`           | `MarkerOptions` | `{}`        | Marker configuration options           |
| `draggable`         | `boolean`       | `false`     | Whether the marker is draggable        |
| `element`           | `HTMLElement`   | `undefined` | Custom HTML element for the marker     |
| `offset`            | `PointLike`     | `undefined` | Offset from the marker's position      |
| `anchor`            | `Anchor`        | `undefined` | Anchor point for the marker            |
| `color`             | `string`        | `undefined` | Color of the default marker            |
| `clickTolerance`    | `number`        | `undefined` | Tolerance for click events             |
| `rotation`          | `number`        | `undefined` | Rotation angle in degrees              |
| `rotationAlignment` | `Alignment`     | `undefined` | Rotation alignment relative to the map |
| `pitchAlignment`    | `Alignment`     | `undefined` | Pitch alignment relative to the map    |
| `scale`             | `number`        | `undefined` | Scale factor for the marker            |
| `occludedOpacity`   | `number`        | `undefined` | Opacity when marker is occluded        |

### Events

| Event       | Payload | Description                |
| ----------- | ------- | -------------------------- |
| `dragstart` | `Event` | Fired when dragging starts |
| `drag`      | `Event` | Fired during dragging      |
| `dragend`   | `Event` | Fired when dragging ends   |

### Example

```vue
<template>
  <Mapbox :options="mapOptions">
    <Marker
      :lng-lat="markerPosition"
      :draggable="true"
      @dragend="onMarkerDragEnd"
    >
      <div class="custom-marker">📍</div>
    </Marker>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox, Marker } from 'vue3-maplibre-gl';

const markerPosition = ref([0, 0]);

function onMarkerDragEnd(event) {
  markerPosition.value = event.target.getLngLat().toArray();
  console.log('Marker moved to:', markerPosition.value);
}
</script>

<style>
.custom-marker {
  font-size: 24px;
  cursor: pointer;
}
</style>
```

## PopUp

A component for displaying popup windows on the map. Supports custom HTML content, positioning, and comprehensive event handling.

### Props

| Prop            | Type           | Default     | Description                          |
| --------------- | -------------- | ----------- | ------------------------------------ |
| `className`     | `string`       | `undefined` | CSS class name for the popup         |
| `lnglat`        | `LngLatLike`   | `undefined` | Geographic coordinates for the popup |
| `show`          | `boolean`      | `true`      | Whether the popup is visible         |
| `withMap`       | `boolean`      | `true`      | Whether to attach popup to the map   |
| `options`       | `PopupOptions` | `{}`        | Popup configuration options          |
| `html`          | `string`       | `undefined` | HTML content for the popup           |
| `maxWidth`      | `string`       | `undefined` | Maximum width of the popup           |
| `closeButton`   | `boolean`      | `true`      | Whether to show close button         |
| `closeOnClick`  | `boolean`      | `true`      | Whether to close on map click        |
| `closeOnEscape` | `boolean`      | `true`      | Whether to close on escape key       |

### Events

| Event         | Payload   | Description                                         |
| ------------- | --------- | --------------------------------------------------- |
| `close`       | `void`    | Fired when popup is closed                          |
| `open`        | `void`    | Fired when popup is opened                          |
| `update:show` | `boolean` | Fired when show state changes (for v-model support) |

### Example

```vue
<template>
  <Mapbox :options="mapOptions">
    <PopUp :lng-lat="popupPosition" :close-button="true" @close="onPopupClose">
      <div class="popup-content">
        <h3>Hello World!</h3>
        <p>This is a popup at {{ popupPosition }}.</p>
      </div>
    </PopUp>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox, PopUp } from 'vue3-maplibre-gl';

const popupPosition = ref([0, 0]);

function onPopupClose() {
  console.log('Popup closed');
}
</script>

<style>
.popup-content {
  padding: 10px;
  max-width: 200px;
}
</style>
```

## Image

A component for managing and loading images for use in MapLibre GL styles. Supports multiple image formats and provides loading state management.

### Props

| Prop          | Type                          | Default | Description                           |
| ------------- | ----------------------------- | ------- | ------------------------------------- |
| `images`      | `ImageItem[]`                 | `[]`    | Array of images to load               |
| `options`     | `Partial<StyleImageMetadata>` | `{}`    | Default options applied to all images |
| `showLoading` | `boolean`                     | `true`  | Whether to show loading state         |
| `debug`       | `boolean`                     | `false` | Whether to enable debug logging       |

### ImageItem Interface

| Property  | Type                          | Description                                           |
| --------- | ----------------------------- | ----------------------------------------------------- |
| `id`      | `string`                      | Unique identifier for the image                       |
| `image`   | `ImageDatas \| string`        | Image data (URL string or ImageData/HTMLImageElement) |
| `options` | `Partial<StyleImageMetadata>` | Optional image metadata and options                   |

### Example

```vue
<template>
  <Mapbox :options="mapOptions">
    <Image :images="mapImages" :show-loading="true" />
    <GeoJsonSource :data="pointData">
      <SymbolLayer :style="symbolStyle" />
    </GeoJsonSource>
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox, Image, GeoJsonSource, SymbolLayer } from 'vue3-maplibre-gl';

const mapImages = ref([
  {
    id: 'custom-marker',
    image: '/path/to/marker.png',
    options: { sdf: false },
  },
]);

const symbolStyle = ref({
  'icon-image': 'custom-marker',
  'icon-size': 1.5,
});
</script>
```

## GeolocateControls

A component for adding geolocation controls to the map. Provides user location tracking with comprehensive event handling and error management.

### Props

| Prop               | Type                               | Default     | Description                                      |
| ------------------ | ---------------------------------- | ----------- | ------------------------------------------------ |
| `position`         | `ControlPosition`                  | `undefined` | Position of the control on the map               |
| `options`          | `GeolocateControlOptions`          | `{}`        | Geolocate control configuration options          |
| `debug`            | `boolean`                          | `false`     | Enable debug logging                             |
| `autoCleanup`      | `boolean`                          | `true`      | Automatically cleanup resources on unmount       |
| `onError`          | `(error: any) => void`             | `undefined` | Error handling callback                          |
| `onGeolocate`      | `(data: GeolocateSuccess) => void` | `undefined` | Success callback for geolocation                 |
| `onTrackingStart`  | `(data: GeolocateSuccess) => void` | `undefined` | Callback when user location tracking starts      |
| `onTrackingEnd`    | `(data: GeolocateSuccess) => void` | `undefined` | Callback when user location tracking ends        |
| `onOutOfMaxBounds` | `(data: GeolocateSuccess) => void` | `undefined` | Callback when user location is out of max bounds |

### Events

| Event            | Payload                    | Description                              |
| ---------------- | -------------------------- | ---------------------------------------- |
| `register`       | `GeolocateControl`         | Fired when control is registered         |
| `geolocate`      | `GeolocateSuccess`         | Fired when geolocation is successful     |
| `error`          | `GeolocationPositionError` | Fired when geolocation error occurs      |
| `trackingstart`  | `GeolocateSuccess`         | Fired when location tracking starts      |
| `trackingend`    | `GeolocateSuccess`         | Fired when location tracking ends        |
| `outofmaxbounds` | `GeolocateSuccess`         | Fired when location is out of max bounds |

### Example

```vue
<template>
  <Mapbox :options="mapOptions">
    <GeolocateControls
      position="top-right"
      :options="geolocateOptions"
      @geolocate="onGeolocate"
      @error="onGeolocateError"
    />
  </Mapbox>
</template>

<script setup>
import { ref } from 'vue';
import { Mapbox, GeolocateControls } from 'vue3-maplibre-gl';

const geolocateOptions = ref({
  positionOptions: {
    enableHighAccuracy: true,
  },
  trackUserLocation: true,
  showUserHeading: true,
});

function onGeolocate(data) {
  console.log('User location:', data.coords);
}

function onGeolocateError(error) {
  console.error('Geolocation error:', error);
}
</script>
```
