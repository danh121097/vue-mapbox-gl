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
  <Map
    :mapbox-options="{
      accessToken: '',
      style: ''
    }"
    @map-loading="onMapLoading"
    @map-loaded="onMapLoaded"
  />
</template>

<script lang="ts" setup>
import { Map } from 'sqkii-mapbox-gl';

function onMapLoading() {
  console.log('loading');
}

function onMapLoaded() {
  console.log('loaded');
}
</script>
```
