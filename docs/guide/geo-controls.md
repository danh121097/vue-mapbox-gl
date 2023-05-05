# Map controls

## Overview

Controls is UI elemetns for controlling view of the map, such as scale or bearing.

In `vue3-mapbox` they exposed as Vue components, so you can control properties and behavior dynamically by changing props.

They was setup default options in `vue3-mapbox`:

```js
 positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true,
  showUserHeading: false,
  showAccuracyCircle: false
}
```

```vue
<template>
  <MapBox
    :options="{
      style: ''
    }"
  >
    <GeoControl position="" :options="" />
  </MapBox>
</template>
<script lang="ts" setup>
import { MapBox, GeoControl } from 'vue3-mapbox';
</script>
```
