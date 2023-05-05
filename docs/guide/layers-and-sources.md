# Layers and sources

## Adding layers

Geographic features on the map draws as layers.
Layer use `source` object that contains data for layer (for example, GeoJSON object). Source must be added to map and several layers can use common `source` and draw it's data differently.
Also, layer has own configuration object that declares how layer draws on the map. You can read more about it in Mapbox GL JS docs for [sources](https://maplibre.org/maplibre-gl-js-docs/api/sources/) and [layers](https://maplibre.org/maplibre-style-spec/layers/).

`vue3-mapbox` exposes layers as Vue components.
`source` and `layer` configuration object passed to layer component as props. There is several layers types for drawing different types of sources.
For example adding a layer with GeoJSON data:

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

In this example `geoJsonSource` can be an `object`, representing GeoJSON feature or `string` with URL to GeoJSON.

Sources are stored in Mapbox GL JS `Map` object by `sourceId`. If you sure that source already added to map, you can skip `source` prop and just pass `sourceId` and use same source for different layers. If you try to add same source with same `id` twice, VueMapbox would just use `source` that already existed on the map, but you can set `replaceSource` prop to `true` to just replace old source with new one passed in `source` prop.

By default when Layer components destroying, it removes source from map. If you want to keep source on Map (for example, for future using or if other layers use this source), set `clearSource` prop to `false`.

## Layer events

Layers emits events when loading data or on user interaction like `click`. See full list of events in [API section](/api/layers.md#events)
