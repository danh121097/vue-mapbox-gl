# sqkii-mapbox-gl

[![npm](https://img.shields.io/npm/v/sqkii-mapbox-gl)](https://www.npmjs.com/package/sqkii-mapbox-gl) [![Downloads](https://img.shields.io/npm/dt/sqkii-mapbox-gl)](https://www.npmjs.com/package/sqkii-mapbox-gl) [![Stars](https://img.shields.io/github/stars/danh121097/vue-mapbox-gl?style=flat-square)](https://github.com/danh121097/vue-mapbox-gl/stargazers) [![License](https://img.shields.io/npm/l/sqkii-mapbox-gl)](https://github.com/danh121097/vue-mapbox-gl/blob/main/LICENSE.md)

# Installation and Usage

## Vue 3

If you are using npm:

```shell
npm install sqkii-mapbox-gl@latest --save
```

If you are using yarn:

```shell
yarn add sqkii-mapbox-gl@latest
```

You can then use the component in your template

### **`Map`**

###

```vue
<template>
  <MapBox
    :mapbox-options="{
      accessToken: '',
      style: ''
    }"
    @intialized="(map: Map) => onMapIntialized(map)"
    @intializing="onMapIntializing"
  />
</template>

<script lang="ts" setup>
import { MapBox } from 'sqkii-mapbox-gl';
import 'sqkii-mapbox-gl/dist/style.css';

function onMapIntialized(map: Map) {
  console.log('intialized', map);
}

function onMapIntializing() {
  console.log('intializing');
}
</script>
```

**Props**

| prop            | required  | type            |
| --------------- | :-------: | :-------------- |
| `mapboxOptions` | **true**  | `MapboxOptions` |
| `preloadAssets` | **false** | `MapAsset`      |

### **`Geocontrol`**

###

```vue
<template>
  <MapBox
    :mapbox-options="{
      accessToken: '',
      style: ''
    }"
  >
    <GeoControl
      :geolocate-control-options="{
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: false,
        showAccuracyCircle: false
      }"
    />
  </MapBox>
</template>
<script lang="ts" setup>
import { MapBox, GeoControl } from 'sqkii-mapbox-gl';
</script>
```

**Props**

| prop                      | required  | type                |
| ------------------------- | :-------: | :------------------ |
| `geolocateControlOptions` | **false** | `GeocontrolOptions` |

### **`Layer`**

###

```vue
<template>
  <MapBox
    :mapbox-options="{
      accessToken: '',
      style: ''
    }"
  >
    <Layer :source-data="" source-id="" :layer-config="[]" @click="onClick" />
  </MapBox>
</template>
<script lang="ts" setup>
import { MapBox, Layer } from 'sqkii-mapbox-gl';

function onClick(e) {
  console.log('e', e);
}
</script>
```

**Props**

| props         | required  | type            |
| ------------- | --------- | --------------- |
| `layerIdx`    | **false** | `string`        |
| `sourceId`    | **true**  | `string`        |
| `sourceData`  | **true**  | `AnySourceData` |
| `layerConfig` | **true**  | `layerConfig[]` |

### **`Marker`**

###

```vue
<template>
  <MapBox
    :mapbox-options="{
      accessToken: '',
      style: ''
    }"
  >
    <Marker :lng-lat="[108.47067944725364, 14.37145041099869]" />
  </MapBox>
</template>
<script lang="ts" setup>
import { MapBox, Marker } from 'sqkii-mapbox-gl';
</script>
```

**Props**

| prop            | required  | type            |
| --------------- | --------- | --------------- |
| `lngLat`        | **true**  | `LngLatLike`    |
| `markerOptions` | **false** | `MarkerOptions` |
| `className`     | **false** | `string`        |

### **`PopUp`**

###

```vue
<template>
  <MapBox
    :mapbox-options="{
      accessToken: '',
      style: ''
    }"
  >
    <PopUp
      :lng-lat="[108.47067944725364, 14.37145041099869]"
      content="Hello World"
    />
  </MapBox>
</template>
<script lang="ts" setup>
import { MapBox, PopUp } from 'sqkii-mapbox-gl';
</script>
```

**Props**

| prop        | required  | type           |
| ----------- | --------- | -------------- |
| `lngLat`    | **true**  | `LngLatLike`   |
| `radius`    | **false** | `number`       |
| `options`   | **false** | `PopupOptions` |
| `content`   | **true**  | `string`       |
| `className` | **false** | `string`       |
