# Markers and Popups

## Marker

The Marker component is a wrapper around the [MapLibre GL Marker API](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker).

```vue
<template>
  <MapBox
    :options="{
      style: ''
    }"
  >
    <Marker :lng-lat="[108.47067944725364, 14.37145041099869]" />
  </MapBox>
</template>
<script lang="ts" setup>
import { MapBox, Marker } from 'vue3-mapbox';
</script>
```

### Props

- `lngLat {Array}` The GeoJSON coordinates for marker placement on the map

Full list of props you cab see on [API page](/api/marker.md#props)

## Popup

The Popup component is wrapper around the [MapLibre GL Popup API](https://maplibre.org/maplibre-gl-js-docs/api/markers/#popup).

You can specify content inside popup in default slot. It can be HTML or Vue component.

```vue
<template>
  <MapBox
    :options="{
      style: ''
    }"
  >
    <PopUp :lng-lat="[108.47067944725364, 14.37145041099869]">
      <div>Hello World</div>
    </PopUp>
  </MapBox>
</template>
<script lang="ts" setup>
import { MapBox, PopUp } from 'vue3-mapbox';
</script>
```

### Props

- `lngLat {Array}` The GeoJSON coordinates for popup placement on the map. If popup used inside marker this prop will be ignored.

Full list of props you can see on [API page](/api/popup.md#props)
