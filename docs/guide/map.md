# Map

## Adding map

For using maps with `maplibre-gl` you need a [map style](https://maplibre.org/maplibre-style-spec/).

```vue
<template>
  <MapBox
    :options="{
      style: ''
    }"
    @initialized="mapIntialized"
  />
</template>

<script lang="ts" setup>
import { MapBox } from 'vue3-mapbox';
import 'vue3-mapbox/dist/style.css';

function mapIntialized(map: Map) {
  console.log('intialized', map);
}
</script>
```
