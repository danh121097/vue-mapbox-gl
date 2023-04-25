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

```vue
<template>
  <MapBox
    :mapbox-options="{
      accessToken: '',
      style: ''
    }"
    @map-intialized="(map: Map) => onMapIntialized(map)"
    @map-intializing="onMapIntializing"
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
