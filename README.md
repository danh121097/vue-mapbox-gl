# vue3-mapbox

[![npm](https://img.shields.io/npm/v/vue3-mapbox)](https://www.npmjs.com/package/vue3-mapbox) [![Downloads](https://img.shields.io/npm/dt/vue3-mapbox)](https://www.npmjs.com/package/vue3-mapbox) [![Stars](https://img.shields.io/github/stars/danh121097/vue-mapbox-gl?style=flat-square)](https://github.com/danh121097/vue-mapbox-gl/stargazers) [![License](https://img.shields.io/npm/l/vue3-mapbox)](https://github.com/danh121097/vue-mapbox-gl/blob/main/LICENSE.md)

# Library write base on `maplibre-gl`

# Installation and Usage

## Vue 3

If you are using npm:

```shell
npm install vue3-mapbox@latest --save
```

If you are using yarn:

```shell
yarn add vue3-mapbox@latest
```

You can then use the component in your template

### **`Map`**

###

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

**Props**

| prop            | required  | type         |
| :-------------- | :-------: | :----------- |
| `options`       | **true**  | `MapOptions` |
| `preloadAssets` | **false** | `MapAsset[]` |

**Events**
extends from `MapEventType`

### **`Geocontrol`**

###

```vue
<template>
  <MapBox
    :options="{
      style: ''
    }"
  >
    <GeoControl />
  </MapBox>
</template>
<script lang="ts" setup>
import { MapBox, GeoControl } from 'vue3-mapbox';
</script>
```

**Props**

| prop       | required  | type                                                        |
| :--------- | :-------: | :---------------------------------------------------------- |
| `options`  | **false** | `GeolocateOptions`                                          |
| `position` | **false** | `'top-right'` `'top-left'` `'bottom-right'` `'bottom-left'` |

### **`Layer`**

###

```vue
<template>
  <MapBox
    :options="{
      style: ''
    }"
  >
    <Layer source-id="" source="" layer-id="" layer="" @click="onClick" />
  </MapBox>
</template>
<script lang="ts" setup>
import { MapBox, Layer } from 'vue3-mapbox';

function onClick(e) {
  console.log('e', e);
}
</script>
```

**Props**

| props      | required  | type                  |
| :--------- | :-------: | :-------------------- |
| `sourceId` | **true**  | `string`              |
| `layerId`  | **true**  | `string`              |
| `source`   | **true**  | `SourceSpecification` |
| `layer`    | **true**  | `LayerSpecification`  |
| `before`   | **false** | `string`              |

**Events**
extends from `MapLayerEventType`

### **`Marker`**

###

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

**Props**

| prop        | required  | type                           |
| :---------- | :-------: | :----------------------------- |
| `lngLat`    | **true**  | `LngLatLike` `[number, number` |
| `options`   | **false** | `MarkerOptions`                |
| `className` | **false** | `string`                       |
| `cursor`    | **false** | `string`                       |

### **`PopUp`**

###

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

**Props**

| prop        | required  | type                            |
| :---------- | :-------: | :------------------------------ |
| `lngLat`    | **true**  | `LngLatLike` `[number, number]` |
| `offset`    | **false** | `number`                        |
| `options`   | **false** | `PopupOptions`                  |
| `className` | **false** | `string`                        |
| `marker`    | **false** | `Marker`                        |
| `units`     | **false** | `Units`                         |
