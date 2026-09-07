# Composables API Reference

Vue3 MapLibre GL provides a comprehensive set of composables for building interactive maps with Vue 3 Composition API. All composables are designed with TypeScript support, reactive data binding, and comprehensive error handling.

## Map Composables

### useCreateMaplibre

The core composable for creating and managing MapLibre GL Maps with enhanced error handling and reactive state management.

#### Parameters

| Parameter  | Type                                     | Description                             |
| ---------- | ---------------------------------------- | --------------------------------------- |
| `elRef`    | `MaybeRef<HTMLElement \| undefined>`     | Reference to the HTML element container |
| `styleRef` | `MaybeRef<StyleSpecification \| string>` | Reference to the map style              |
| `props`    | `CreateMaplibreProps`                    | Configuration options for the map       |

`props` also accepts every `MapOptions` field except `container` and `style`,
which come from `elRef` and `styleRef`.

#### `props` fields

| Property   | Type                   | Default     | Description                          |
| ---------- | ---------------------- | ----------- | ------------------------------------ |
| `register` | `(actions) => void`    | `undefined` | Callback for registering map actions |
| `debug`    | `boolean`              | `false`     | Enable debug logging                 |
| `onLoad`   | `(map: Map) => void`   | `undefined` | Load success callback                |
| `onError`  | `(error: any) => void` | `undefined` | Error handling callback              |

#### Returns

| Property               | Type                                            | Description                  |
| ---------------------- | ----------------------------------------------- | ---------------------------- |
| `mapInstance`          | `ComputedRef<Map \| null>`                      | Reactive map instance        |
| `setCenter`            | `(center: LngLatLike) => void`                  | Set map center coordinates   |
| `setBearing`           | `(bearing: number) => void`                     | Set map bearing (rotation)   |
| `setZoom`              | `(zoom: number) => void`                        | Set map zoom level           |
| `setPitch`             | `(pitch: number) => void`                       | Set map pitch (tilt)         |
| `setStyle`             | `(style: StyleSpecification \| string) => void` | Set map style                |
| `setMaxBounds`         | `(bounds: LngLatBoundsLike) => void`            | Set maximum bounds           |
| `setMaxPitch`          | `(pitch: number) => void`                       | Set maximum pitch            |
| `setMaxZoom`           | `(zoom: number) => void`                        | Set maximum zoom             |
| `setMinPitch`          | `(pitch: number) => void`                       | Set minimum pitch            |
| `setMinZoom`           | `(zoom: number) => void`                        | Set minimum zoom             |
| `setRenderWorldCopies` | `(render: boolean) => void`                     | Set world copies rendering   |
| `mapCreationStatus`    | `ComputedRef<MapCreationStatus>`                | Current creation status      |
| `isMapReady`           | `ComputedRef<boolean>`                          | Whether the map is ready     |
| `isMapLoading`         | `ComputedRef<boolean>`                          | Whether the map is loading   |
| `hasMapError`          | `ComputedRef<boolean>`                          | Whether the map has an error |
| `getCurrentCamera`     | `() => CameraOptions \| null`                   | Read the camera as it is now |
| `getCurrentStyle`      | `() => StyleSpecification \| string \| null`    | Read the active style        |
| `initMap`              | `() => void`                                    | Create the map               |
| `removeMap`            | `() => void`                                    | Remove the map from the DOM  |
| `destroyMap`           | `() => void`                                    | Destroy the map instance     |

`initMap` runs on its own once the container and style are available; call it
only if you removed the map yourself. Everything except the three lifecycle
methods is also handed to `register`.

#### Example

```typescript
import { ref } from 'vue';
import { useCreateMaplibre } from 'vue3-maplibre-gl';

const mapContainer = ref<HTMLElement>();
const mapStyle = ref('https://demotiles.maplibre.org/style.json');

const { mapInstance, setCenter, setZoom, isMapReady, isMapLoading } =
  useCreateMaplibre(mapContainer, mapStyle, {
    debug: true,
    onLoad: (map) => {
      console.log('Map loaded:', map);
    },
    onError: (error) => {
      console.error('Map error:', error);
    },
  });

// Use the map instance
watch(isMapReady, (ready) => {
  if (ready) {
    setCenter([0, 0]);
    setZoom(10);
  }
});
```

### useMaplibre

Holds a map created elsewhere, so a component that renders `<Maplibre>` can
drive it without reaching into a template ref. It creates no map of its own:
hand it the actions `<Maplibre>` emits, via `@register`.

#### Parameters

| Parameter             | Type      | Default | Description                                |
| --------------------- | --------- | ------- | ------------------------------------------ |
| `options`             | `object`  | `{}`    | Configuration options                      |
| `options.debug`       | `boolean` | `false` | Log registration and map operations        |
| `options.autoCleanup` | `boolean` | `true`  | Release the registered instance on unmount |

#### Returns

| Property        | Type                                           | Description                                                                                                                                           |
| --------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mapInstance`   | `ComputedRef<Map \| null>`                     | Reactive map instance                                                                                                                                 |
| `mapStatus`     | `ComputedRef<MapCreationStatus>`               | Current creation status                                                                                                                               |
| `isMapReady`    | `ComputedRef<boolean>`                         | Whether the map is ready for operations                                                                                                               |
| `isMapLoading`  | `ComputedRef<boolean>`                         | Whether the map is currently loading                                                                                                                  |
| `hasMapError`   | `ComputedRef<boolean>`                         | Whether map creation failed                                                                                                                           |
| `isRegistered`  | `ComputedRef<boolean>`                         | Whether an instance has been registered                                                                                                               |
| `register`      | `(instance: MaplibreActions) => Promise<void>` | Register an actions instance                                                                                                                          |
| `setMapOptions` | `(options: Partial<MapOptions>) => void`       | Override individual options on the registered instance. Only the keys passed here are overridden; every other key keeps tracking the `:options` prop. |

It also spreads in every accessor and setter of [`MaplibreMethods`](/api/types#maplibremethods)
— `getCenter`, `getZoom`, `queryRenderedFeatures`, `setStyle`, `flyTo` and the
rest — each of which no-ops while no map is registered.

<!-- returns-spread: MaplibreMethods -->

The status field is `mapStatus`, not `mapCreationStatus`, and there are no
lifecycle methods: `initMap`, `removeMap` and `destroyMap` belong to
`useCreateMaplibre`, which owns the map.

#### Example

```vue
<script setup>
import { ref, watch } from 'vue';
import { Maplibre, useMaplibre } from 'vue3-maplibre-gl';

const options = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const {
  register: registerMap,
  mapInstance,
  isMapReady,
} = useMaplibre({ debug: true });

// Every field is a ComputedRef — read it with .value in script, unwrapped in template
watch(isMapReady, (ready) => {
  if (ready) console.log(mapInstance.value?.getZoom());
});
</script>

<template>
  <Maplibre :options="options" @register="registerMap" />
</template>
```

Before `register` runs, `mapInstance` is `null` and every method is a no-op —
`isMapReady` is the signal that the map is usable.

To reach the map from a component _nested inside_ `<Maplibre>`, inject
`MapProvideKey` instead; that is what the built-in child components do.

### useMaplibreConfig

Configures MapLibre GL's global performance settings (web worker count, parallel image requests, resource prewarming). Call it **once** at app startup (e.g. in `App.vue` or `main.ts`) — it applies to every map instance in your app, not just one map.

#### Signature

```typescript
function useMaplibreConfig(
  options?: MaplibreConfigOptions,
): MaplibreConfigActions;
```

#### Parameters (`MaplibreConfigOptions`)

| Property                   | Type      | Default | Description                                  |
| -------------------------- | --------- | ------- | -------------------------------------------- |
| `workerCount`              | `number`  | `4`     | Number of web workers for tile loading       |
| `maxParallelImageRequests` | `number`  | `16`    | Maximum parallel image requests              |
| `prewarmResources`         | `boolean` | `true`  | Prewarm MapLibre resources on initialization |
| `debug`                    | `boolean` | `false` | Enable debug logging                         |

#### Returns

| Property                  | Type         | Description                                                    |
| ------------------------- | ------------ | -------------------------------------------------------------- |
| `clearPrewarmedResources` | `() => void` | Releases prewarmed resources (called automatically on unmount) |

#### Example

```vue
<script setup>
import { useMaplibreConfig } from 'vue3-maplibre-gl';

// Call once, at the top of your root component
useMaplibreConfig({
  workerCount: 4,
  maxParallelImageRequests: 16,
  prewarmResources: true,
});
</script>
```

### useCreateImage

Adds a custom image (icon) to the map's style so it can be used by symbol layers, e.g. `'icon-image': 'my-icon'`. Handles loading images from a URL, updating them, and safely re-adding them when their size changes (MapLibre requires images to keep the same dimensions when updated).

#### Signature

```typescript
function useCreateImage(props: CreateImageProps): CreateImageActions;
```

#### Parameters (`CreateImageProps`)

| Property                         | Type                          | Description                                                                                              |
| -------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `map`                            | `MaybeRef<Map \| null>`       | Map instance reference                                                                                   |
| `id`                             | `string`                      | Image identifier used in layer styles                                                                    |
| `image`                          | `ImageDatas \| string`        | Image data (`HTMLImageElement`, `ImageBitmap`, `ImageData`, or raw pixel object) or a URL string to load |
| `options`                        | `Partial<StyleImageMetadata>` | Image metadata (e.g. `pixelRatio`, `sdf`)                                                                |
| `forceRecreateOnDimensionChange` | `boolean`                     | Remove+re-add on dimension change instead of trying an in-place update (default: `true`)                 |
| `debug`                          | `boolean`                     | Enable debug logging                                                                                     |

#### Returns

| Property       | Type                                                             | Description                                                            |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `remove`       | `() => void`                                                     | Remove the image from the map                                          |
| `loadImage`    | `(imageUrl: string) => Promise<HTMLImageElement \| ImageBitmap>` | Load an image from a URL                                               |
| `updateImage`  | `(newImage: ImageDatas \| string) => Promise<void>`              | Replace the current image                                              |
| `refreshImage` | `() => Promise<void>`                                            | Re-apply the current image                                             |
| `hasImage`     | `() => boolean`                                                  | Whether the image currently exists on the map                          |
| `imageStatus`  | `ComputedRef<ImageStatus>`                                       | `'not-created' \| 'loading' \| 'created' \| 'updated' \| 'error'`      |
| `isImageReady` | `ComputedRef<boolean>`                                           | Whether the image is created or updated                                |
| `loadPromise`  | `Promise<void>`                                                  | Resolves once the image is first added, rejects if removed or on error |

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { useCreateImage } from 'vue3-maplibre-gl';

const mapInstance = ref(null);

useCreateImage({
  map: mapInstance,
  id: 'my-icon',
  image: '/icons/pin.png',
});
// Now usable in a symbol layer: 'icon-image': 'my-icon'
</script>
```

### useCreateMarker

Wraps MapLibre GL's `Marker` class so a DOM pin/icon can be placed on the map and moved reactively, with drag events and automatic cleanup on unmount.

#### Signature

```typescript
function useCreateMarker(props: CreateMarkerProps): CreateMarkerActions;
```

#### Parameters (`CreateMarkerProps`)

| Property  | Type                                | Description                                                   |
| --------- | ----------------------------------- | ------------------------------------------------------------- |
| `map`     | `MaybeRef<Map \| null>`             | Map instance reference                                        |
| `lnglat`  | `MaybeRef<LngLatLike \| undefined>` | Marker position, reactive                                     |
| `popup`   | `MaybeRef<Popup \| null>`           | Popup to attach to the marker                                 |
| `el`      | `Ref<HTMLElement \| undefined>`     | Custom DOM element to use as the marker (from a template ref) |
| `options` | `MarkerOptions`                     | Native MapLibre `Marker` options                              |
| `on`      | `{ dragstart?, drag?, dragend? }`   | Drag event handlers                                           |
| `autoAdd` | `boolean`                           | Automatically add the marker to the map (default: `true`)     |
| `debug`   | `boolean`                           | Enable debug logging                                          |

#### Returns

| Property               | Type                                                     | Description                                           |
| ---------------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| `marker`               | `ComputedRef<Marker \| null>`                            | The underlying MapLibre `Marker` instance             |
| `markerStatus`         | `ComputedRef<MarkerStatus>`                              | `'not-created' \| 'creating' \| 'created' \| 'error'` |
| `isMarkerCreated`      | `ComputedRef<boolean>`                                   | Whether the marker has been created                   |
| `setLngLat`            | `(lnglat: LngLatLike) => void`                           | Move the marker                                       |
| `setPopup`             | `(popup?: Popup \| null) => void`                        | Attach/detach a popup                                 |
| `setOffset`            | `(offset: PointLike) => void`                            | Set pixel offset                                      |
| `setDraggable`         | `(draggable: boolean) => void`                           | Toggle draggable state                                |
| `togglePopup`          | `() => void`                                             | Open/close the attached popup                         |
| `getElement`           | `() => HTMLElement \| null`                              | Get the marker's DOM element                          |
| `setRotation`          | `(rotation: number) => void`                             | Set rotation in degrees                               |
| `setRotationAlignment` | `(alignment: Alignment) => void`                         | Set rotation alignment                                |
| `setPitchAlignment`    | `(alignment: Alignment) => void`                         | Set pitch alignment                                   |
| `setOpacity`           | `(opacity: string, opacityWhenCovered?: string) => void` | Set opacity                                           |
| `removeMarker`         | `() => void`                                             | Remove the marker from the map                        |
| `addMarker`            | `() => void`                                             | Add the marker back to the map                        |
| `getLngLat`            | `() => LngLatLike \| null`                               | Current position                                      |
| `getPopup`             | `() => Popup \| null`                                    | Currently attached popup                              |
| `getOffset`            | `() => PointLike`                                        | Current pixel offset                                  |
| `getDraggable`         | `() => boolean`                                          | Whether the marker is draggable                       |
| `getRotation`          | `() => number`                                           | Current rotation                                      |

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { useCreateMarker } from 'vue3-maplibre-gl';

const mapInstance = ref(null);
const position = ref([0, 0]);

const { setLngLat, setDraggable } = useCreateMarker({
  map: mapInstance,
  lnglat: position,
  options: { color: '#FF0000' },
  on: {
    dragend: () => console.log('Marker dropped'),
  },
});

setDraggable(true);
</script>
```

### useCreatePopup

Wraps MapLibre GL's `Popup` class to show HTML content or a custom DOM element at a given map location, with reactive content and position.

#### Signature

```typescript
function useCreatePopup(props: CreatePopupProps): CreatePopupActions;
```

#### Parameters (`CreatePopupProps`)

| Property       | Type                                | Description                                                            |
| -------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `map`          | `MaybeRef<Map \| null>`             | Map instance reference                                                 |
| `lnglat`       | `MaybeRef<LngLatLike \| undefined>` | Popup position, reactive                                               |
| `html`         | `MaybeRef<string \| undefined>`     | Popup HTML content, reactive                                           |
| `el`           | `Ref<HTMLElement \| undefined>`     | Custom DOM element to use as content                                   |
| `options`      | `PopupOptions`                      | Native MapLibre `Popup` options                                        |
| `show`         | `boolean`                           | Show the popup immediately once created (default: `true`)              |
| `withMap`      | `boolean`                           | Attach the popup to the map (default: `true`)                          |
| `autoCreate`   | `boolean`                           | Auto-create the popup when the map becomes available (default: `true`) |
| `closeOnClick` | `boolean`                           | Close popup when the map is clicked (default: `true`)                  |
| `closeButton`  | `boolean`                           | Show the close (×) button (default: `true`)                            |
| `on`           | `{ open?, close? }`                 | Open/close event handlers                                              |
| `debug`        | `boolean`                           | Enable debug logging                                                   |

#### Returns

| Property          | Type                             | Description                                                                 |
| ----------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `popup`           | `ComputedRef<Popup \| null>`     | The underlying MapLibre `Popup` instance                                    |
| `popupStatus`     | `ComputedRef<PopupStatus>`       | `'not-created' \| 'creating' \| 'created' \| 'open' \| 'closed' \| 'error'` |
| `isPopupCreated`  | `ComputedRef<boolean>`           | Whether the popup has been created                                          |
| `isPopupOpen`     | `ComputedRef<boolean>`           | Whether the popup is currently open                                         |
| `setLngLat`       | `(lnglat: LngLatLike) => void`   | Move the popup                                                              |
| `setOffset`       | `(offset: PointLike) => void`    | Set pixel offset                                                            |
| `addClassName`    | `(className: string) => void`    | Add a CSS class to the popup                                                |
| `removeClassName` | `(className: string) => void`    | Remove a CSS class                                                          |
| `setMaxWidth`     | `(width: string) => void`        | Set max width (CSS value)                                                   |
| `show`            | `() => void`                     | Show the popup on the map                                                   |
| `hide`            | `() => void`                     | Hide the popup from the map                                                 |
| `toggle`          | `() => void`                     | Toggle visibility                                                           |
| `addToMap`        | `() => void`                     | Add popup to map without opening it                                         |
| `setHTMLContent`  | `(html?: string) => void`        | Update HTML content                                                         |
| `setDOMContent`   | `(element: HTMLElement) => void` | Update DOM content                                                          |
| `setText`         | `(text: string) => void`         | Update text content (escaped)                                               |
| `removePopup`     | `() => void`                     | Remove and clean up the popup                                               |
| `createPopup`     | `() => void`                     | Manually (re)create the popup                                               |
| `getLngLat`       | `() => LngLatLike \| null`       | Current position                                                            |
| `getElement`      | `() => HTMLElement \| null`      | Popup's DOM element                                                         |

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { useCreatePopup } from 'vue3-maplibre-gl';

const mapInstance = ref(null);
const position = ref([0, 0]);

const { show, hide, setHTMLContent } = useCreatePopup({
  map: mapInstance,
  lnglat: position,
  html: '<strong>Hello!</strong>',
  show: false,
});

show();
</script>
```

### useLayer

Registers a layer instance (e.g. from `useCreateFillLayer`) and re-exposes its actions plus richer reactive status tracking. Useful when a component needs to manage a layer created elsewhere via the `register` callback pattern.

#### Signature

```typescript
function useLayer<T extends LayerSpecification>(
  props?: LayerManagementProps,
): LayerManagementActions;
```

#### Parameters (`LayerManagementProps`)

| Property      | Type      | Default | Description                      |
| ------------- | --------- | ------- | -------------------------------- |
| `debug`       | `boolean` | `false` | Enable debug logging             |
| `autoCleanup` | `boolean` | `true`  | Dispose automatically on unmount |

#### Returns

| Property            | Type                                                               | Description                                                                                        |
| ------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `register`          | `(instance: CreateLayerActions<any>, map: Map) => void`            | Register a layer instance (pass this as the `register` callback of a `useCreate*Layer` composable) |
| `layerId`           | `ComputedRef<string \| undefined>`                                 | Registered layer's ID                                                                              |
| `layer`             | `ComputedRef<LayerSpecification \| null>`                          | Registered layer specification                                                                     |
| `layerStatus`       | `ComputedRef<LayerManagementStatus>`                               | `'not-registered' \| 'registering' \| 'registered' \| 'error' \| 'disposed'`                       |
| `isLayerRegistered` | `ComputedRef<boolean>`                                             | Whether a layer instance is registered                                                             |
| `isLayerReady`      | `ComputedRef<boolean>`                                             | Whether the layer exists on the map now                                                            |
| `getFilter`         | `() => FilterSpecification \| void`                                | Current filter                                                                                     |
| `getLayoutProperty` | `(name: keyof AnyLayout) => any`                                   | Get a layout property                                                                              |
| `getPaintProperty`  | `(name: keyof AnyPaint) => any`                                    | Get a paint property                                                                               |
| `setBeforeId`       | `(beforeId?: string) => void`                                      | Reposition the layer                                                                               |
| `setFilter`         | `(filter?: FilterSpecification) => void`                           | Update filter                                                                                      |
| `setPaintProperty`  | `(name: string, value: any, options?: StyleSetterOptions) => void` | Update paint property                                                                              |
| `setLayoutProperty` | `(name: string, value: any, options?: StyleSetterOptions) => void` | Update layout property                                                                             |
| `setZoomRange`      | `(minzoom?: number, maxzoom?: number) => void`                     | Update zoom range                                                                                  |
| `removeLayer`       | `() => void`                                                       | Remove the layer                                                                                   |
| `setStyle`          | `(style: AnyLayout & AnyPaint) => void`                            | Update layer style                                                                                 |
| `dispose`           | `() => void`                                                       | Stop tracking and release resources                                                                |
| `refresh`           | `() => void`                                                       | Re-register the current instance                                                                   |

#### Example

```vue
<script setup>
import { useCreateFillLayer, useLayer } from 'vue3-maplibre-gl';

const { register: registerLayerActions, isLayerReady, setStyle } = useLayer();

useCreateFillLayer({
  map: mapInstance,
  source: sourceRef,
  id: 'fill-layer',
  style: { 'fill-color': '#088' },
  register: registerLayerActions,
});
</script>
```

## Layer Composables

### useCreateLayer

The generic, low-level layer composable that `useCreateFillLayer`, `useCreateCircleLayer`, `useCreateLineLayer`, and `useCreateSymbolLayer` are all built on top of. Use it directly when you need a layer type not covered by the specific helpers, or full control over `paint`/`layout`.

#### Signature

```typescript
function useCreateLayer<Layer extends LayerSpecification>(
  cfg: CreateBaseLayerProps<Layer>,
): EnhancedLayerActions<Layer>;
```

#### Parameters (`CreateBaseLayerProps`)

| Property      | Type                                                                     | Description                                   |
| ------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| `map`         | `MaybeRef<Map \| null>`                                                  | Map instance reference                        |
| `source`      | `MaybeRef<string \| SourceSpecification \| object \| null \| undefined>` | Source id, spec, or reactive reference        |
| `type`        | `LayerTypes`                                                             | MapLibre layer type (e.g. `'fill'`, `'line'`) |
| `id`          | `string`                                                                 | Layer id (auto-generated if omitted)          |
| `beforeId`    | `string`                                                                 | Insert layer before this layer id             |
| `filter`      | `FilterSpecification`                                                    | Filter expression (default: `['all']`)        |
| `layout`      | `Layer['layout']`                                                        | Layout properties                             |
| `paint`       | `Layer['paint']`                                                         | Paint properties                              |
| `maxzoom`     | `number`                                                                 | Maximum zoom (default: `24`)                  |
| `minzoom`     | `number`                                                                 | Minimum zoom (default: `0`)                   |
| `metadata`    | `object`                                                                 | Layer metadata                                |
| `sourceLayer` | `string`                                                                 | Vector tile source layer name                 |
| `debug`       | `boolean`                                                                | Enable debug logging                          |
| `register`    | `(actions: CreateBaseLayerActions<Layer>, map: Map) => void`             | Registration callback                         |

#### Returns

| Property            | Type                                                                  | Description                                           |
| ------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| `layerId`           | `string`                                                              | Generated/provided layer id                           |
| `getLayer`          | `ComputedRef<LayerSpecification \| null>`                             | Current layer specification                           |
| `removeLayer`       | `() => void`                                                          | Remove the layer                                      |
| `setBeforeId`       | `(beforeId?: string) => void`                                         | Reposition the layer                                  |
| `setFilter`         | `(filter?: FilterSpecification) => void`                              | Update filter                                         |
| `setZoomRange`      | `(minzoom?: number, maxzoom?: number) => void`                        | Update zoom range                                     |
| `setPaintProperty`  | `(name: string, value: any, options?: StyleSetterOptions) => void`    | Update a paint property                               |
| `setLayoutProperty` | `(name: string, value: any, options?: StyleSetterOptions) => void`    | Update a layout property                              |
| `layerStatus`       | `ComputedRef<LayerStatus>`                                            | `'not-created' \| 'creating' \| 'created' \| 'error'` |
| `isLayerReady`      | `ComputedRef<boolean>`                                                | Whether the layer currently exists on the map         |
| `refreshLayer`      | `() => void`                                                          | Remove and recreate the layer                         |
| `updateLayer`       | `(updates: { filter?, minzoom?, maxzoom?, paint?, layout? }) => void` | Apply several updates in one call                     |

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { useCreateLayer } from 'vue3-maplibre-gl';

const mapInstance = ref(null);

const { getLayer, updateLayer } = useCreateLayer({
  map: mapInstance,
  source: 'my-source',
  type: 'heatmap',
  id: 'heatmap-layer',
  paint: { 'heatmap-weight': 1 },
});

updateLayer({ paint: { 'heatmap-weight': 2 } });
</script>
```

### useCreateFillLayer

Creates and manages MapLibre GL Fill Layers with reactive updates and comprehensive event handling.

#### Parameters

| Property      | Type                                                                      | Description                     |
| ------------- | ------------------------------------------------------------------------- | ------------------------------- |
| `map`         | `MaybeRef<Map \| null>`                                                   | Map instance reference          |
| `source`      | `MaybeRef<string \| SourceSpecification \| object>`                       | Source id, or a spec with an id |
| `style`       | `FillLayerStyle`                                                          | Fill layer style configuration  |
| `filter`      | `FilterSpecification`                                                     | Filter expression               |
| `id`          | `string`                                                                  | Layer identifier                |
| `beforeId`    | `string`                                                                  | Insert before this layer        |
| `maxzoom`     | `number`                                                                  | Maximum zoom level              |
| `minzoom`     | `number`                                                                  | Minimum zoom level              |
| `metadata`    | `object`                                                                  | Layer metadata                  |
| `sourceLayer` | `string`                                                                  | Source layer name               |
| `debug`       | `boolean`                                                                 | Enable debug logging            |
| `register`    | `(actions: CreateLayerActions<FillLayerSpecification>, map: Map) => void` | Registration callback           |

A layer references its source by id, so an object passed to `source` must carry
its own string `id`; a bare `{ type: 'geojson', data }` is rejected with an
error rather than reaching `addLayer`.

#### Returns

| Property            | Type                                           | Description               |
| ------------------- | ---------------------------------------------- | ------------------------- |
| `layerId`           | `string`                                       | The layer's resolved id   |
| `getLayer`          | `ComputedRef<FillLayerSpecification \| null>`  | Get layer specification   |
| `setStyle`          | `(style?: FillLayerStyle) => void`             | Set layer style           |
| `setBeforeId`       | `(beforeId?: string) => void`                  | Set layer insertion point |
| `setFilter`         | `(filter?: FilterSpecification) => void`       | Set layer filter          |
| `setZoomRange`      | `(minzoom?: number, maxzoom?: number) => void` | Set zoom range            |
| `setPaintProperty`  | `(name, value, options?) => void`              | Set one paint property    |
| `setLayoutProperty` | `(name, value, options?) => void`              | Set one layout property   |
| `removeLayer`       | `() => void`                                   | Remove the layer          |
| `setColor`          | `(color: string) => void`                      | Set `fill-color`          |
| `setOpacity`        | `(opacity: number) => void`                    | Set `fill-opacity`        |
| `setOutlineColor`   | `(color: string) => void`                      | Set `fill-outline-color`  |
| `setPattern`        | `(pattern: string) => void`                    | Set `fill-pattern`        |
| `setAntialias`      | `(antialias: boolean) => void`                 | Set `fill-antialias`      |
| `setSortKey`        | `(sortKey: number) => void`                    | Set `fill-sort-key`       |
| `setVisibility`     | `(visibility: 'visible' \| 'none') => void`    | Show or hide the layer    |

Every `set*` above other than `setStyle` also takes an optional
`StyleSetterOptions` as its last argument.

#### Example

```typescript
import { ref } from 'vue';
import { useCreateFillLayer } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);
const sourceRef = ref('my-source');

const { getLayer, setStyle, setFilter } = useCreateFillLayer({
  map: mapInstance,
  source: sourceRef,
  id: 'fill-layer',
  style: {
    'fill-color': '#088',
    'fill-opacity': 0.8,
  },
  filter: ['==', 'type', 'polygon'],
  register: (actions, map) => {
    console.log('Fill layer registered:', actions);
  },
});

// Update layer style
setStyle({
  'fill-color': '#ff0000',
  'fill-opacity': 0.6,
});

// Update layer filter
setFilter(['==', 'category', 'important']);
```

### useCreateCircleLayer

Creates and manages MapLibre GL Circle Layers for point data visualization.

#### Parameters

The same props as `useCreateFillLayer`, with `CircleLayerStyle` for `style`.

#### Returns

| Property            | Type                                            | Description                 |
| ------------------- | ----------------------------------------------- | --------------------------- |
| `layerId`           | `string`                                        | The layer's resolved id     |
| `getLayer`          | `ComputedRef<CircleLayerSpecification \| null>` | Get layer specification     |
| `setStyle`          | `(style?: CircleLayerStyle) => void`            | Set layer style             |
| `setBeforeId`       | `(beforeId?: string) => void`                   | Set layer insertion point   |
| `setFilter`         | `(filter?: FilterSpecification) => void`        | Set layer filter            |
| `setZoomRange`      | `(minzoom?: number, maxzoom?: number) => void`  | Set zoom range              |
| `setPaintProperty`  | `(name, value, options?) => void`               | Set one paint property      |
| `setLayoutProperty` | `(name, value, options?) => void`               | Set one layout property     |
| `removeLayer`       | `() => void`                                    | Remove the layer            |
| `setRadius`         | `(radius: number \| string) => void`            | Set `circle-radius`         |
| `setColor`          | `(color: string) => void`                       | Set `circle-color`          |
| `setOpacity`        | `(opacity: number) => void`                     | Set `circle-opacity`        |
| `setStrokeWidth`    | `(width: number) => void`                       | Set `circle-stroke-width`   |
| `setStrokeColor`    | `(color: string) => void`                       | Set `circle-stroke-color`   |
| `setStrokeOpacity`  | `(opacity: number) => void`                     | Set `circle-stroke-opacity` |
| `setVisibility`     | `(visibility: 'visible' \| 'none') => void`     | Show or hide the layer      |

Every `set*` above other than `setStyle` also takes an optional
`StyleSetterOptions` as its last argument.

#### Example

```typescript
import { useCreateCircleLayer } from 'vue3-maplibre-gl';

const { getLayer, setStyle } = useCreateCircleLayer({
  map: mapInstance,
  source: sourceRef,
  id: 'circle-layer',
  style: {
    'circle-radius': 6,
    'circle-color': '#007cbf',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff',
  },
});
```

### useCreateLineLayer

Creates and manages MapLibre GL Line Layers for linear features.

#### Parameters

The same props as `useCreateFillLayer`, with `LineLayerStyle` for `style`.

#### Returns

| Property            | Type                                            | Description               |
| ------------------- | ----------------------------------------------- | ------------------------- |
| `layerId`           | `string`                                        | The layer's resolved id   |
| `getLayer`          | `ComputedRef<LineLayerSpecification \| null>`   | Get layer specification   |
| `setStyle`          | `(style?: LineLayerStyle) => void`              | Set layer style           |
| `setBeforeId`       | `(beforeId?: string) => void`                   | Set layer insertion point |
| `setFilter`         | `(filter?: FilterSpecification) => void`        | Set layer filter          |
| `setZoomRange`      | `(minzoom?: number, maxzoom?: number) => void`  | Set zoom range            |
| `setPaintProperty`  | `(name, value, options?) => void`               | Set one paint property    |
| `setLayoutProperty` | `(name, value, options?) => void`               | Set one layout property   |
| `removeLayer`       | `() => void`                                    | Remove the layer          |
| `setColor`          | `(color: string) => void`                       | Set `line-color`          |
| `setWidth`          | `(width: number \| string) => void`             | Set `line-width`          |
| `setOpacity`        | `(opacity: number) => void`                     | Set `line-opacity`        |
| `setBlur`           | `(blur: number) => void`                        | Set `line-blur`           |
| `setCap`            | `(cap: 'butt' \| 'round' \| 'square') => void`  | Set `line-cap`            |
| `setJoin`           | `(join: 'bevel' \| 'round' \| 'miter') => void` | Set `line-join`           |
| `setOffset`         | `(offset: number) => void`                      | Set `line-offset`         |
| `setGapWidth`       | `(gapWidth: number) => void`                    | Set `line-gap-width`      |
| `setDashArray`      | `(dashArray: number[]) => void`                 | Set `line-dasharray`      |
| `setGradient`       | `(gradient: string) => void`                    | Set `line-gradient`       |
| `setPattern`        | `(pattern: string) => void`                     | Set `line-pattern`        |
| `setSortKey`        | `(sortKey: number) => void`                     | Set `line-sort-key`       |
| `setVisibility`     | `(visibility: 'visible' \| 'none') => void`     | Show or hide the layer    |

Every `set*` above other than `setStyle` also takes an optional
`StyleSetterOptions` as its last argument.

#### Example

```typescript
import { useCreateLineLayer } from 'vue3-maplibre-gl';

const { getLayer, setStyle } = useCreateLineLayer({
  map: mapInstance,
  source: sourceRef,
  id: 'line-layer',
  style: {
    'line-color': '#007cbf',
    'line-width': 3,
    'line-opacity': 0.8,
  },
});
```

### useCreateSymbolLayer

Creates and manages MapLibre GL Symbol Layers for icons and text.

#### Parameters

The same props as `useCreateFillLayer`, with `SymbolLayerStyle` for `style`.

#### Returns

| Property            | Type                                            | Description               |
| ------------------- | ----------------------------------------------- | ------------------------- |
| `layerId`           | `string`                                        | The layer's resolved id   |
| `getLayer`          | `ComputedRef<SymbolLayerSpecification \| null>` | Get layer specification   |
| `setStyle`          | `(style?: SymbolLayerStyle) => void`            | Set layer style           |
| `setBeforeId`       | `(beforeId?: string) => void`                   | Set layer insertion point |
| `setFilter`         | `(filter?: FilterSpecification) => void`        | Set layer filter          |
| `setZoomRange`      | `(minzoom?: number, maxzoom?: number) => void`  | Set zoom range            |
| `setPaintProperty`  | `(name, value, options?) => void`               | Set one paint property    |
| `setLayoutProperty` | `(name, value, options?) => void`               | Set one layout property   |
| `removeLayer`       | `() => void`                                    | Remove the layer          |
| `setIconImage`      | `(image: string) => void`                       | Set `icon-image`          |
| `setIconSize`       | `(size: number \| string) => void`              | Set `icon-size`           |
| `setIconColor`      | `(color: string) => void`                       | Set `icon-color`          |
| `setIconOpacity`    | `(opacity: number) => void`                     | Set `icon-opacity`        |
| `setIconRotate`     | `(rotation: number) => void`                    | Set `icon-rotate`         |
| `setIconOffset`     | `(offset: [number, number]) => void`            | Set `icon-offset`         |
| `setIconAnchor`     | `(anchor: string) => void`                      | Set `icon-anchor`         |
| `setIconHaloColor`  | `(color: string) => void`                       | Set `icon-halo-color`     |
| `setIconHaloWidth`  | `(width: number) => void`                       | Set `icon-halo-width`     |
| `setIconHaloBlur`   | `(blur: number) => void`                        | Set `icon-halo-blur`      |
| `setTextField`      | `(field: string) => void`                       | Set `text-field`          |
| `setTextFont`       | `(font: string[]) => void`                      | Set `text-font`           |
| `setTextSize`       | `(size: number \| string) => void`              | Set `text-size`           |
| `setTextColor`      | `(color: string) => void`                       | Set `text-color`          |
| `setTextOpacity`    | `(opacity: number) => void`                     | Set `text-opacity`        |
| `setTextRotate`     | `(rotation: number) => void`                    | Set `text-rotate`         |
| `setTextOffset`     | `(offset: [number, number]) => void`            | Set `text-offset`         |
| `setTextAnchor`     | `(anchor: string) => void`                      | Set `text-anchor`         |
| `setTextHaloColor`  | `(color: string) => void`                       | Set `text-halo-color`     |
| `setTextHaloWidth`  | `(width: number) => void`                       | Set `text-halo-width`     |
| `setTextHaloBlur`   | `(blur: number) => void`                        | Set `text-halo-blur`      |
| `setSortKey`        | `(sortKey: number) => void`                     | Set `symbol-sort-key`     |
| `setVisibility`     | `(visibility: 'visible' \| 'none') => void`     | Show or hide the layer    |

Every `set*` above other than `setStyle` also takes an optional
`StyleSetterOptions` as its last argument.

#### Example

```typescript
import { useCreateSymbolLayer } from 'vue3-maplibre-gl';

const { getLayer, setStyle } = useCreateSymbolLayer({
  map: mapInstance,
  source: sourceRef,
  id: 'symbol-layer',
  style: {
    'text-field': ['get', 'name'],
    'text-font': ['Open Sans Regular'],
    'text-size': 12,
    'text-color': '#333',
  },
});
```

## Source Composables

### useCreateGeoJsonSource

Creates and manages MapLibre GL GeoJSON Sources with reactive data updates and comprehensive error handling.

#### Parameters

| Parameter | Type                       | Description                  |
| --------- | -------------------------- | ---------------------------- |
| `props`   | `CreateGeoJsonSourceProps` | GeoJSON source configuration |

#### CreateGeoJsonSourceProps Interface

| Property   | Type                                                      | Description               |
| ---------- | --------------------------------------------------------- | ------------------------- |
| `map`      | `MaybeRef<Map \| null>`                                   | Map instance reference    |
| `id`       | `string`                                                  | Source identifier         |
| `data`     | `GeoJSONSourceSpecification['data']`                      | GeoJSON data              |
| `options`  | `Partial<GeoJSONSourceSpecification>`                     | Additional source options |
| `debug`    | `boolean`                                                 | Enable debug logging      |
| `register` | `(actions: CreateGeoJsonSourceActions, map: Map) => void` | Registration callback     |

#### Returns

| Property        | Type                                                 | Description             |
| --------------- | ---------------------------------------------------- | ----------------------- |
| `sourceId`      | `string`                                             | Source identifier       |
| `getSource`     | `ShallowRef<GeoJSONSource \| null>`                  | Get source instance     |
| `setData`       | `(data: GeoJSONSourceSpecification['data']) => void` | Update source data      |
| `removeSource`  | `() => void`                                         | Remove source from map  |
| `refreshSource` | `() => void`                                         | Refresh source          |
| `sourceStatus`  | `ComputedRef<SourceStatus>`                          | Source status           |
| `isSourceReady` | `ComputedRef<boolean>`                               | Whether source is ready |

#### Example

```typescript
import { ref } from 'vue';
import { useCreateGeoJsonSource } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);
const geoJsonData = ref({
  type: 'FeatureCollection',
  features: [],
});

const { sourceId, getSource, setData, isSourceReady } = useCreateGeoJsonSource({
  map: mapInstance,
  id: 'my-geojson-source',
  data: geoJsonData.value,
  options: {
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  },
  debug: true,
  register: (actions, map) => {
    console.log('GeoJSON source registered:', actions);
  },
});

// Update source data
const newData = {
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
};

setData(newData);
```

### useGeoJsonSource

A simplified composable for managing GeoJSON source instances with enhanced error handling.

#### Parameters

| Parameter | Type                    | Description           |
| --------- | ----------------------- | --------------------- |
| `props`   | `UseGeoJsonSourceProps` | Configuration options |

#### Returns

| Property        | Type                                                 | Description                                |
| --------------- | ---------------------------------------------------- | ------------------------------------------ |
| `sourceId`      | `ComputedRef<string \| undefined>`                   | Source identifier                          |
| `getSource`     | `ComputedRef<GeoJSONSource \| null>`                 | Get source instance                        |
| `setData`       | `(data: GeoJSONSourceSpecification['data']) => void` | Update source data                         |
| `refreshSource` | `() => void`                                         | Refresh source                             |
| `isSourceReady` | `ComputedRef<boolean>`                               | Whether source is ready                    |
| `sourceStatus`  | `ComputedRef<GeoJsonSourceStatus>`                   | Source status                              |
| `register`      | `(instance: CreateGeoJsonSourceActions) => void`     | Bind a source created by `<GeoJsonSource>` |

#### Example

```typescript
import { useGeoJsonSource } from 'vue3-maplibre-gl';

const { sourceId, getSource, setData, isSourceReady, register } =
  useGeoJsonSource({
    debug: true,
    autoRefresh: true,
  });

// Register with a source instance
register(sourceActions);
```

## Control Composables

### useGeolocateControl

Creates and manages MapLibre GL Geolocate Controls with comprehensive event handling.

#### Parameters

| Property   | Type                      | Default          | Description             |
| ---------- | ------------------------- | ---------------- | ----------------------- |
| `map`      | `MaybeRef<Map \| null>`   | —                | Map instance reference  |
| `position` | `ControlPosition`         | `'bottom-right'` | Control position on map |
| `options`  | `GeolocateControlOptions` | `{}`             | Control options         |
| `debug`    | `boolean`                 | `false`          | Enable debug logging    |

#### Returns

| Property           | Type                                   | Description                       |
| ------------------ | -------------------------------------- | --------------------------------- |
| `geolocateControl` | `ShallowRef<GeolocateControl \| null>` | Control instance                  |
| `isControlAdded`   | `ShallowRef<boolean>`                  | Whether the control is on the map |
| `addControl`       | `() => void`                           | Add the control to the map        |
| `removeControl`    | `() => void`                           | Remove the control from the map   |
| `trigger`          | `() => void`                           | Trigger geolocation               |

#### Example

```typescript
import { ref } from 'vue';
import { useGeolocateControl } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

const { geolocateControl, isControlAdded, trigger } = useGeolocateControl({
  map: mapInstance,
  position: 'top-right',
  options: {
    positionOptions: {
      enableHighAccuracy: true,
    },
    trackUserLocation: true,
  },
  debug: true,
});

// The control adds itself once the map exists; trigger no-ops before then.
watch(isControlAdded, (added) => {
  if (added) trigger();
});
```

## Event Composables

### useMapEventListener

Provides reactive event handling for MapLibre GL map events with automatic cleanup.

#### Parameters

| Property | Type                    | Default     | Description                                                                      |
| -------- | ----------------------- | ----------- | -------------------------------------------------------------------------------- |
| `map`    | `MaybeRef<Map \| null>` | —           | Map instance reference                                                           |
| `event`  | `keyof MapEventTypes`   | —           | Event type to listen for                                                         |
| `on`     | `(event) => void`       | —           | Event handler                                                                    |
| `once`   | `boolean`               | `undefined` | Detach after the first event; anything falsy, omission included, keeps listening |
| `debug`  | `boolean`               | `undefined` | Enable debug logging; omitted logs nothing                                       |

The handler prop is `on`, not `handler`.

#### Returns

| Property             | Type                               | Description                      |
| -------------------- | ---------------------------------- | -------------------------------- |
| `attachListener`     | `() => void`                       | Attach the listener manually     |
| `removeListener`     | `() => void`                       | Detach the listener (idempotent) |
| `isListenerAttached` | `ComputedRef<boolean>`             | Whether the listener is attached |
| `listenerStatus`     | `ComputedRef<EventListenerStatus>` | Current listener status          |

The listener attaches itself once the map exists and detaches on unmount, so
most callers never touch these.

#### Example

```typescript
import { ref } from 'vue';
import { useMapEventListener } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

// Listen for map click events
useMapEventListener({
  map: mapInstance,
  event: 'click',
  on: (event) => {
    console.log('Map clicked at:', event.lngLat);
  },
});

// Listen for map zoom events
useMapEventListener({
  map: mapInstance,
  event: 'zoom',
  on: (event) => {
    console.log('Map zoom level:', event.target.getZoom());
  },
});
```

### useLayerEventListener

Provides reactive event handling for MapLibre GL layer events with automatic cleanup.

#### Parameters

| Property | Type                                             | Default     | Description                                                                      |
| -------- | ------------------------------------------------ | ----------- | -------------------------------------------------------------------------------- |
| `map`    | `MaybeRef<Map \| null>`                          | —           | Map instance reference                                                           |
| `layer`  | `MaybeRef<LayerSpecification \| string \| null>` | —           | Layer, or its id                                                                 |
| `event`  | `keyof MapLayerEventType`                        | —           | Event type to listen for                                                         |
| `on`     | `(event) => void`                                | —           | Event handler                                                                    |
| `once`   | `boolean`                                        | `undefined` | Detach after the first event; anything falsy, omission included, keeps listening |
| `debug`  | `boolean`                                        | `undefined` | Enable debug logging; omitted logs nothing                                       |

The layer prop is `layer` and accepts a specification as well as an id; the
handler prop is `on`, not `handler`.

#### Returns

Everything [`useMapEventListener`](#usemapeventlistener) returns, plus:

<!-- returns-spread: useMapEventListener -->

| Property  | Type                          | Description                          |
| --------- | ----------------------------- | ------------------------------------ |
| `layerId` | `ComputedRef<string \| null>` | The resolved id of the watched layer |

#### Example

```typescript
import { ref } from 'vue';
import { useLayerEventListener } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

// Listen for layer click events
useLayerEventListener({
  map: mapInstance,
  layer: 'my-layer',
  event: 'click',
  on: (event) => {
    console.log('Layer clicked:', event.features[0]);
  },
});

// Listen for layer hover events
useLayerEventListener({
  map: mapInstance,
  layer: 'my-layer',
  event: 'mouseenter',
  on: (event) => {
    console.log('Mouse entered layer:', event.features[0]);
  },
});
```

### useGeolocateEventListener

Listens to events from a `GeolocateControl` instance (e.g. `geolocate`, `trackuserlocationstart`, `error`), the geolocate-specific counterpart to `useMapEventListener`.

#### Signature

```typescript
function useGeolocateEventListener<T extends keyof GeolocateEventTypes>(
  props: GeolocateEventListenerProps<T>,
): EventListenerActions;
```

#### Parameters

| Property    | Type                                      | Description                                             |
| ----------- | ----------------------------------------- | ------------------------------------------------------- |
| `geolocate` | `MaybeRef<GeolocateControl \| null>`      | Geolocate control instance (from `useGeolocateControl`) |
| `event`     | `keyof GeolocateEventTypes`               | Event name, e.g. `'geolocate'`, `'error'`               |
| `on`        | `(event: GeolocateEventTypes[T]) => void` | Event handler, typed by `event`                         |
| `once`      | `boolean`                                 | Listen only once                                        |
| `debug`     | `boolean`                                 | Enable debug logging                                    |

#### Returns

| Property             | Type                               | Description                          |
| -------------------- | ---------------------------------- | ------------------------------------ |
| `attachListener`     | `() => void`                       | Attach the handler if it is detached |
| `removeListener`     | `() => void`                       | Detach the handler                   |
| `isListenerAttached` | `ComputedRef<boolean>`             | Whether the handler is attached      |
| `listenerStatus`     | `ComputedRef<EventListenerStatus>` | Current listener status              |

The same `EventListenerActions` shape as `useMapEventListener` and
`useLayerEventListener`.

#### Example

```vue
<script setup>
import {
  useGeolocateControl,
  useGeolocateEventListener,
} from 'vue3-maplibre-gl';

const { geolocateControl } = useGeolocateControl({ map: mapInstance });

useGeolocateEventListener({
  geolocate: geolocateControl,
  event: 'geolocate',
  on: (position) => {
    console.log('User located at:', position.coords);
  },
});
</script>
```

### useMapReloadEvent

Low-level building block that tracks the map's `load`/`styledata`/`styledataloading` events and fires `onLoad`/`onUnload` callbacks whenever the style is (re)loaded — including on style switches, not just the initial load. Many other composables (like `useCreateLayer`) use this internally to recreate their layers/sources after a style change.

#### Signature

```typescript
function useMapReloadEvent(props: MapReloadEventProps): MapReloadEventActions;
```

#### Parameters (`MapReloadEventProps`)

| Property             | Type                    | Description                                                                |
| -------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `map`                | `MaybeRef<Map \| null>` | Map instance reference                                                     |
| `callbacks.onLoad`   | `(map: Map) => void`    | Called when the style finishes (re)loading                                 |
| `callbacks.onUnload` | `(map: Map) => void`    | Called when the style starts reloading (optional)                          |
| `callbacks.onError`  | `(error: any) => void`  | Called on handler errors (optional)                                        |
| `debug`              | `boolean`               | Enable debug logging                                                       |
| `autoTriggerOnMount` | `boolean`               | Fire `onLoad` immediately if the style is already loaded (default: `true`) |

#### Returns

| Property      | Type                                | Description                                        |
| ------------- | ----------------------------------- | -------------------------------------------------- |
| `clear`       | `() => void`                        | Remove all listeners                               |
| `forceLoad`   | `() => void`                        | Manually trigger the load callback                 |
| `forceUnload` | `() => void`                        | Manually trigger the unload callback               |
| `isMapLoaded` | `ComputedRef<boolean>`              | Whether the style is currently loaded              |
| `loadStatus`  | `ComputedRef<MapReloadEventStatus>` | `'not-loaded' \| 'loading' \| 'loaded' \| 'error'` |

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { useMapReloadEvent } from 'vue3-maplibre-gl';

const mapInstance = ref(null);

useMapReloadEvent({
  map: mapInstance,
  callbacks: {
    onLoad: (map) => console.log('Style (re)loaded'),
    onUnload: (map) => console.log('Style is being replaced'),
  },
});
</script>
```

## Camera Composables

Composables for moving the map's camera (panning, rotating, zooming, and fitting to bounds). All of them return a promise-based action plus a status enum you can watch (`'not-started' | '...ing' | 'completed' | 'error'`), and all accept either a `props` object (recommended) or the legacy `(map, options)` call signature for backward compatibility. They all clean up in-flight animations automatically on unmount.

### usePanBy / usePanTo

Pans the map by a pixel offset (`usePanBy`) or to a specific coordinate (`usePanTo`), with animation.

#### Signature

```typescript
function usePanBy(props: PanByProps): PanByActions;
function usePanTo(props: PanToProps): PanToActions;
```

#### Parameters

The two take the same props but for the target: `usePanBy` moves by a pixel
offset, `usePanTo` to a coordinate.

**`usePanBy`**

| Property  | Type                    | Description                                            |
| --------- | ----------------------- | ------------------------------------------------------ |
| `map`     | `MaybeRef<Map \| null>` | Map instance reference                                 |
| `offset`  | `PointLike`             | Pixel offset `[x, y]`                                  |
| `options` | `AnimationOptions`      | Animation options (duration, easing, etc.)             |
| `autoPan` | `boolean`               | Auto-pan once offset and map are set (default: `true`) |
| `debug`   | `boolean`               | Enable debug logging                                   |

**`usePanTo`**

| Property  | Type                    | Description                                            |
| --------- | ----------------------- | ------------------------------------------------------ |
| `map`     | `MaybeRef<Map \| null>` | Map instance reference                                 |
| `lnglat`  | `LngLatLike`            | Target coordinate                                      |
| `options` | `AnimationOptions`      | Animation options (duration, easing, etc.)             |
| `autoPan` | `boolean`               | Auto-pan once lnglat and map are set (default: `true`) |
| `debug`   | `boolean`               | Enable debug logging                                   |

#### Returns

Both return the same four fields:

| Property           | Type                          | Description                                            |
| ------------------ | ----------------------------- | ------------------------------------------------------ |
| `stopPanning`      | `() => void`                  | Stops the in-progress pan                              |
| `getCurrentCamera` | `() => CameraOptions \| null` | Current `{ center, zoom, bearing, pitch }`             |
| `panStatus`        | `ComputedRef<PanStatus>`      | `'not-started' \| 'panning' \| 'completed' \| 'error'` |
| `isPanning`        | `ComputedRef<boolean>`        | Whether a pan is in progress                           |

**`usePanBy`**

| Property            | Type                                                               | Description                             |
| ------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| `panBy`             | `(offset: PointLike, options?: AnimationOptions) => Promise<void>` | Executes the pan, resolves on `moveend` |
| `validatePanOffset` | `(offset: PointLike) => boolean`                                   | Validates the offset shape              |

**`usePanTo`**

| Property            | Type                                                                | Description                             |
| ------------------- | ------------------------------------------------------------------- | --------------------------------------- |
| `panTo`             | `(lnglat: LngLatLike, options?: AnimationOptions) => Promise<void>` | Executes the pan, resolves on `moveend` |
| `validatePanTarget` | `(lnglat: LngLatLike) => boolean`                                   | Validates the coordinate shape          |

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { usePanBy, usePanTo } from 'vue3-maplibre-gl';

const mapInstance = ref(null);

const { panBy } = usePanBy({ map: mapInstance, autoPan: false });
const { panTo } = usePanTo({ map: mapInstance, autoPan: false });

await panBy([100, 0], { duration: 500 });
await panTo([106.7, 10.8], { duration: 1000 });
</script>
```

### useRotateTo / useSnapToNorth / useResetNorth / useResetNorthPitch

Rotates the map's bearing. `useRotateTo` rotates to an arbitrary bearing; `useSnapToNorth`, `useResetNorth`, and `useResetNorthPitch` are shortcuts around MapLibre's `snapToNorth()`, `resetNorth()`, and `resetNorthPitch()`.

#### Signature

```typescript
function useRotateTo(props: RotateToProps): RotateToActions;
function useSnapToNorth(props: SnapToNorthProps): SnapToNorthActions;
function useResetNorth(props: ResetNorthProps): ResetNorthActions;
function useResetNorthPitch(
  props: ResetNorthPitchProps,
): ResetNorthPitchActions;
```

#### Parameters

All four take a map, animation options and a debug flag. They differ in the
target and in the name of the auto-run flag.

**`useRotateTo`**

| Property     | Type                    | Description                                                   |
| ------------ | ----------------------- | ------------------------------------------------------------- |
| `map`        | `MaybeRef<Map \| null>` | Map instance reference                                        |
| `bearing`    | `number`                | Target bearing in degrees                                     |
| `options`    | `AnimationOptions`      | Animation options                                             |
| `autoRotate` | `boolean`               | Auto-run once the map and bearing are ready (default: `true`) |
| `debug`      | `boolean`               | Enable debug logging                                          |

**`useSnapToNorth`**

| Property   | Type                    | Description                                      |
| ---------- | ----------------------- | ------------------------------------------------ |
| `map`      | `MaybeRef<Map \| null>` | Map instance reference                           |
| `options`  | `AnimationOptions`      | Animation options                                |
| `autoSnap` | `boolean`               | Auto-run once the map is ready (default: `true`) |
| `debug`    | `boolean`               | Enable debug logging                             |

**`useResetNorth`**

| Property    | Type                    | Description                                      |
| ----------- | ----------------------- | ------------------------------------------------ |
| `map`       | `MaybeRef<Map \| null>` | Map instance reference                           |
| `options`   | `AnimationOptions`      | Animation options                                |
| `autoReset` | `boolean`               | Auto-run once the map is ready (default: `true`) |
| `debug`     | `boolean`               | Enable debug logging                             |

**`useResetNorthPitch`**

| Property    | Type                    | Description                                      |
| ----------- | ----------------------- | ------------------------------------------------ |
| `map`       | `MaybeRef<Map \| null>` | Map instance reference                           |
| `options`   | `AnimationOptions`      | Animation options                                |
| `autoReset` | `boolean`               | Auto-run once the map is ready (default: `true`) |
| `debug`     | `boolean`               | Enable debug logging                             |

#### Returns

All four return these:

| Property            | Type                          | Description                                             |
| ------------------- | ----------------------------- | ------------------------------------------------------- |
| `stopRotating`      | `() => void`                  | Stops the in-progress rotation                          |
| `getCurrentBearing` | `() => number \| null`        | Current bearing                                         |
| `getCurrentCamera`  | `() => CameraOptions \| null` | Current camera state                                    |
| `rotationStatus`    | `ComputedRef<RotationStatus>` | `'not-started' \| 'rotating' \| 'completed' \| 'error'` |
| `isRotating`        | `ComputedRef<boolean>`        | Whether a rotation is in progress                       |

Plus, per composable, the method that runs the rotation:

**`useRotateTo`**

| Property          | Type                                                             | Description               |
| ----------------- | ---------------------------------------------------------------- | ------------------------- |
| `rotateTo`        | `(bearing: number, options?: AnimationOptions) => Promise<void>` | Rotates to a bearing      |
| `validateBearing` | `(bearing: number) => boolean`                                   | Validates a bearing value |

**`useResetNorth`**

| Property     | Type                                            | Description           |
| ------------ | ----------------------------------------------- | --------------------- |
| `resetNorth` | `(options?: AnimationOptions) => Promise<void>` | Rotates back to north |

**`useResetNorthPitch`**

| Property          | Type                                            | Description                   |
| ----------------- | ----------------------------------------------- | ----------------------------- |
| `resetNorthPitch` | `(options?: AnimationOptions) => Promise<void>` | Resets both bearing and pitch |
| `getCurrentPitch` | `() => number \| null`                          | Current pitch                 |

**`useSnapToNorth`**

| Property      | Type                                            | Description                      |
| ------------- | ----------------------------------------------- | -------------------------------- |
| `snapToNorth` | `(options?: AnimationOptions) => Promise<void>` | Snaps to north when close enough |

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { useRotateTo, useResetNorth } from 'vue3-maplibre-gl';

const mapInstance = ref(null);

const { rotateTo } = useRotateTo({ map: mapInstance, autoRotate: false });
const { resetNorth } = useResetNorth({ map: mapInstance, autoReset: false });

await rotateTo(45, { duration: 500 });
await resetNorth({ duration: 500 });
</script>
```

### useZoomIn / useZoomOut / useZoomTo

Animates the map's zoom level: `useZoomIn`/`useZoomOut` change by one level, `useZoomTo` zooms to an exact level.

#### Signature

```typescript
function useZoomIn(props: ZoomInProps): ZoomInActions;
function useZoomOut(props: ZoomOutProps): ZoomOutActions;
function useZoomTo(props: ZoomToProps): ZoomToActions;
```

#### Parameters

`useZoomTo` takes a target level; `useZoomIn` and `useZoomOut` step from
wherever the map is.

**`useZoomTo`**

| Property   | Type                    | Description                                                |
| ---------- | ----------------------- | ---------------------------------------------------------- |
| `map`      | `MaybeRef<Map \| null>` | Map instance reference                                     |
| `zoom`     | `number`                | Target zoom level (0-24)                                   |
| `options`  | `AnimationOptions`      | Animation options                                          |
| `autoZoom` | `boolean`               | Auto-run once the map and zoom are ready (default: `true`) |
| `debug`    | `boolean`               | Enable debug logging                                       |

**`useZoomIn`** / **`useZoomOut`**

| Property   | Type                    | Description                                      |
| ---------- | ----------------------- | ------------------------------------------------ |
| `map`      | `MaybeRef<Map \| null>` | Map instance reference                           |
| `options`  | `AnimationOptions`      | Animation options                                |
| `autoZoom` | `boolean`               | Auto-run once the map is ready (default: `true`) |
| `debug`    | `boolean`               | Enable debug logging                             |

#### Returns

| Property           | Type                          | Description                                            |
| ------------------ | ----------------------------- | ------------------------------------------------------ |
| `stopZooming`      | `() => void`                  | Stops the in-progress zoom                             |
| `getCurrentZoom`   | `() => number \| null`        | Current zoom level                                     |
| `getCurrentCamera` | `() => CameraOptions \| null` | Current camera state                                   |
| `zoomStatus`       | `ComputedRef<ZoomStatus>`     | `'not-started' \| 'zooming' \| 'completed' \| 'error'` |
| `isZooming`        | `ComputedRef<boolean>`        | Whether a zoom is in progress                          |

Plus, per composable, the method that runs the zoom:

**`useZoomIn`**

| Property | Type                                            | Description                               |
| -------- | ----------------------------------------------- | ----------------------------------------- |
| `zoomIn` | `(options?: AnimationOptions) => Promise<void>` | Zooms in one level, resolves on `zoomend` |

**`useZoomOut`**

| Property  | Type                                            | Description                                |
| --------- | ----------------------------------------------- | ------------------------------------------ |
| `zoomOut` | `(options?: AnimationOptions) => Promise<void>` | Zooms out one level, resolves on `zoomend` |

**`useZoomTo`**

| Property            | Type                                                          | Description                             |
| ------------------- | ------------------------------------------------------------- | --------------------------------------- |
| `zoomTo`            | `(zoom: number, options?: AnimationOptions) => Promise<void>` | Zooms to a level, resolves on `zoomend` |
| `validateZoomLevel` | `(zoom: number) => boolean`                                   | Validates a zoom value (0-24)           |

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { useZoomIn, useZoomOut, useZoomTo } from 'vue3-maplibre-gl';

const mapInstance = ref(null);

const { zoomIn } = useZoomIn({ map: mapInstance, autoZoom: false });
const { zoomOut } = useZoomOut({ map: mapInstance, autoZoom: false });
const { zoomTo } = useZoomTo({ map: mapInstance, autoZoom: false });

await zoomIn({ duration: 300 });
await zoomOut({ duration: 300 });
await zoomTo(14, { duration: 500 });
</script>
```

### useFitBounds / useCameraForBounds

`useFitBounds` moves and zooms the map so a bounding box fits in view (wraps `map.fitBounds()`). `useCameraForBounds` only _calculates_ the camera options for a bounding box without moving the map (wraps `map.cameraForBounds()`) — useful when you want to inspect or tweak the result before applying it.

#### Signature

```typescript
function useFitBounds(props: FitBoundsProps): FitBoundsActions;
function useCameraForBounds(
  props: CameraForBoundsProps,
): CameraForBoundsActions;
```

#### Parameters

Both take a map and a debug flag; only the options type differs.

**`useFitBounds`**

| Property  | Type                    | Description                 |
| --------- | ----------------------- | --------------------------- |
| `map`     | `MaybeRef<Map \| null>` | Map instance reference      |
| `options` | `FitBoundsOptions`      | Fit options, e.g. `padding` |
| `debug`   | `boolean`               | Enable debug logging        |

**`useCameraForBounds`**

| Property  | Type                                                     | Description                    |
| --------- | -------------------------------------------------------- | ------------------------------ |
| `map`     | `MaybeRef<Map \| null>`                                  | Map instance reference         |
| `options` | `CameraForBoundsOptions & { bounds?: LngLatBoundsLike }` | Camera options, e.g. `padding` |
| `debug`   | `boolean`                                                | Enable debug logging           |

#### Returns

**`useFitBounds`**

| Property           | Type                                                             | Description                                  |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------- |
| `setFitBounds`     | `(bounds: LngLatBoundsLike, options?: FitBoundsOptions) => void` | Fits the map to the given bounds             |
| `clearBounds`      | `() => void`                                                     | Resets internal bounds state                 |
| `getCurrentBounds` | `() => LngLatBounds \| null`                                     | Current map bounds                           |
| `bounds`           | `ComputedRef<LngLatBoundsLike \| undefined>`                     | Last bounds applied                          |
| `boundsStatus`     | `ComputedRef<BoundsStatus>`                                      | `'not-set' \| 'setting' \| 'set' \| 'error'` |
| `isBoundsSet`      | `ComputedRef<boolean>`                                           | Whether bounds are currently set             |

**`useCameraForBounds`**

| Property           | Type                                                                   | Description                                  |
| ------------------ | ---------------------------------------------------------------------- | -------------------------------------------- |
| `cameraForBounds`  | `(bounds: LngLatBoundsLike, options?: CameraForBoundsOptions) => void` | Calculates camera options for bounds         |
| `clearCamera`      | `() => void`                                                           | Resets internal state                        |
| `getCurrentBounds` | `() => LngLatBounds \| null`                                           | Current map bounds                           |
| `bbox`             | `ComputedRef<LngLatBoundsLike \| undefined>`                           | Last bounding box used                       |
| `cameraStatus`     | `ComputedRef<BoundsStatus>`                                            | `'not-set' \| 'setting' \| 'set' \| 'error'` |
| `isCameraSet`      | `ComputedRef<boolean>`                                                 | Whether a camera was computed                |

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { useFitBounds } from 'vue3-maplibre-gl';

const mapInstance = ref(null);
const { setFitBounds } = useFitBounds({ map: mapInstance });

setFitBounds(
  [
    [-74.0, 40.7], // Southwest
    [-73.9, 40.8], // Northeast
  ],
  { padding: 20, duration: 1000 },
);
</script>
```

### useFitScreenCoordinates

Fits the map to a rectangle defined by **screen pixel** coordinates (rather than geographic bounds) — wraps `map.fitScreenCoordinates()`. Handy for "draw a box on screen to zoom into it" UI.

#### Signature

```typescript
function useFitScreenCoordinates(
  props: FitScreenCoordinatesProps,
): FitScreenCoordinatesActions;
```

#### Parameters (`FitScreenCoordinatesProps`)

| Property         | Type                                | Description                                    |
| ---------------- | ----------------------------------- | ---------------------------------------------- |
| `map`            | `MaybeRef<Map \| null>`             | Map instance reference                         |
| `defaultOptions` | `Omit<FitBoundsOptions, 'bearing'>` | Default fit options                            |
| `defaultBearing` | `number`                            | Default bearing to use if none is passed       |
| `autoCleanup`    | `boolean`                           | Clear coordinates on unmount (default: `true`) |
| `debug`          | `boolean`                           | Enable debug logging                           |

#### Returns

| Property               | Type                                                         | Description                                  |
| ---------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `fitScreenCoordinates` | `(p0: PointLike, p1: PointLike, options?, bearing?) => void` | Fits the map to the pixel rectangle          |
| `clearCoordinates`     | `() => void`                                                 | Clears the current selection                 |
| `status`               | `ComputedRef<FitScreenCoordinatesStatus>`                    | `'not-set' \| 'setting' \| 'set' \| 'error'` |
| `isCoordinatesSet`     | `ComputedRef<boolean>`                                       | Whether both points are set                  |
| `isFitting`            | `ComputedRef<boolean>`                                       | Whether the fit is in progress               |
| `hasError`             | `ComputedRef<boolean>`                                       | Whether the last fit failed                  |

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { useFitScreenCoordinates } from 'vue3-maplibre-gl';

const mapInstance = ref(null);
const { fitScreenCoordinates } = useFitScreenCoordinates({ map: mapInstance });

// User drew a selection box from (50,50) to (300,300) pixels
fitScreenCoordinates([50, 50], [300, 300]);
</script>
```

## Utility Composables

### useFlyTo

Provides smooth animated transitions to new map positions with customizable easing and duration.

#### Parameters

| Property  | Type                    | Default     | Description                                |
| --------- | ----------------------- | ----------- | ------------------------------------------ |
| `map`     | `MaybeRef<Map \| null>` | —           | Map instance reference                     |
| `options` | `FlyToOptions`          | —           | Default options for every call             |
| `debug`   | `boolean`               | `undefined` | Enable debug logging; omitted logs nothing |

#### Returns

| Property           | Type                                        | Description                     |
| ------------------ | ------------------------------------------- | ------------------------------- |
| `flyTo`            | `(options?: FlyToOptions) => Promise<void>` | Execute fly-to animation        |
| `flyToCenter`      | `(center, options?) => Promise<void>`       | Fly, changing only the center   |
| `flyToZoom`        | `(zoom, options?) => Promise<void>`         | Fly, changing only the zoom     |
| `flyToBearing`     | `(bearing, options?) => Promise<void>`      | Fly, changing only the bearing  |
| `flyToPitch`       | `(pitch, options?) => Promise<void>`        | Fly, changing only the pitch    |
| `stopFlying`       | `() => void`                                | Interrupt the running animation |
| `getCurrentCamera` | `() => CameraOptions \| null`               | Read the camera as it is now    |
| `flyStatus`        | `ComputedRef<FlyStatus>`                    | Current animation status        |
| `isFlying`         | `ComputedRef<boolean>`                      | Whether animation is active     |
| `cleanup`          | `() => void`                                | Release listeners early         |

Each `flyTo*` resolves when the animation settles, so they can be awaited.

#### Example

```typescript
import { ref } from 'vue';
import { useFlyTo } from 'vue3-maplibre-gl';

const mapInstance = ref<Map | null>(null);

const { flyTo, isFlying } = useFlyTo({
  map: mapInstance,
});

// Fly to a new location
flyTo({
  center: [0, 0],
  zoom: 10,
  duration: 2000,
  essential: true,
});

// Check if animation is active
watch(isFlying, (flying) => {
  console.log('Animation active:', flying);
});
```

### useEaseTo

Provides smooth animated transitions with easing functions for map camera changes.

#### Parameters

| Property  | Type                    | Default     | Description                                |
| --------- | ----------------------- | ----------- | ------------------------------------------ |
| `map`     | `MaybeRef<Map \| null>` | —           | Map instance reference                     |
| `options` | `EaseToOptions`         | —           | Default options for every call             |
| `debug`   | `boolean`               | `undefined` | Enable debug logging; omitted logs nothing |

#### Returns

| Property           | Type                                              | Description                     |
| ------------------ | ------------------------------------------------- | ------------------------------- |
| `easeTo`           | `(options?: EaseToOptions) => Promise<void>`      | Ease with the given options     |
| `easeToCenter`     | `(center: LngLatLike, options?) => Promise<void>` | Ease to a centre                |
| `easeToZoom`       | `(zoom: number, options?) => Promise<void>`       | Ease to a zoom level            |
| `easeToBearing`    | `(bearing: number, options?) => Promise<void>`    | Ease to a bearing               |
| `easeToPitch`      | `(pitch: number, options?) => Promise<void>`      | Ease to a pitch                 |
| `stopEasing`       | `() => void`                                      | Stop the animation in place     |
| `getCurrentCamera` | `() => CameraOptions \| null`                     | Read the camera as it is now    |
| `easeStatus`       | `ComputedRef<EaseStatus>`                         | Current animation status        |
| `isEasing`         | `ComputedRef<boolean>`                            | Whether an animation is running |

The same shape as [`useFlyTo`](#useflyto) with `ease` in place of `fly`, minus
`cleanup`. Each `easeTo*` resolves when the animation settles.

#### Example

```typescript
import { useEaseTo } from 'vue3-maplibre-gl';

const { easeTo, isEasing } = useEaseTo({
  map: mapInstance,
});

// Ease to a new position
easeTo({
  center: [0, 0],
  zoom: 12,
  bearing: 45,
  pitch: 30,
  duration: 1000,
});
```

### useJumpTo

Provides instant map position changes without animation.

#### Parameters

| Property   | Type                    | Default     | Description                                                                |
| ---------- | ----------------------- | ----------- | -------------------------------------------------------------------------- |
| `map`      | `MaybeRef<Map \| null>` | —           | Map instance reference                                                     |
| `options`  | `JumpToOptions`         | —           | Default options for every call                                             |
| `autoJump` | `boolean`               | `undefined` | Jump as soon as the map is available; only an explicit `false` disables it |
| `debug`    | `boolean`               | `undefined` | Enable debug logging; omitted logs nothing                                 |

#### Returns

| Property              | Type                                  | Description                     |
| --------------------- | ------------------------------------- | ------------------------------- |
| `jumpTo`              | `(options?: JumpToOptions) => void`   | Execute instant position change |
| `jumpToCenter`        | `(center, options?) => void`          | Jump, changing only the center  |
| `jumpToZoom`          | `(zoom, options?) => void`            | Jump, changing only the zoom    |
| `jumpToBearing`       | `(bearing, options?) => void`         | Jump, changing only the bearing |
| `jumpToPitch`         | `(pitch, options?) => void`           | Jump, changing only the pitch   |
| `getCurrentCamera`    | `() => CameraOptions \| null`         | Read the camera as it is now    |
| `validateJumpOptions` | `(options: JumpToOptions) => boolean` | Check options before jumping    |
| `jumpStatus`          | `ComputedRef<JumpStatus>`             | Current jump status             |
| `isJumping`           | `ComputedRef<boolean>`                | Whether a jump is in progress   |

#### Example

```typescript
import { useJumpTo } from 'vue3-maplibre-gl';

const { jumpTo } = useJumpTo({
  map: mapInstance,
});

// Jump to a new position instantly
jumpTo({
  center: [0, 0],
  zoom: 15,
  bearing: 0,
  pitch: 0,
});
```

### useLogger

Provides consistent logging functionality with debug level control.

#### Parameters

| Parameter | Type      | Description                     |
| --------- | --------- | ------------------------------- |
| `debug`   | `boolean` | Whether to enable debug logging |

#### Returns

| Property   | Type                                        | Description         |
| ---------- | ------------------------------------------- | ------------------- |
| `log`      | `(message: string, ...args: any[]) => void` | Log debug message   |
| `logError` | `(message: string, ...args: any[]) => void` | Log error message   |
| `logWarn`  | `(message: string, ...args: any[]) => void` | Log warning message |

#### Example

```typescript
import { useLogger } from 'vue3-maplibre-gl';

const { log, logError, logWarn } = useLogger(true);

// Log debug information
log('Map initialized successfully');

// Log errors
logError('Failed to load map style:', error);

// Log warnings
logWarn('Deprecated API usage detected');
```

## Performance Composables

Generic, map-agnostic helpers for debouncing and optimizing reactive computations. Useful when a map event (e.g. `move`, `mousemove`) fires faster than you want to react to it.

### useDebounce

Wraps a plain function so it only runs after a delay of no further calls (or on a leading/trailing edge, lodash-`debounce` style). Great for wrapping expensive handlers on high-frequency map events like `move` or `mousemove`.

#### Signature

```typescript
function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  options?: DebounceOptions,
): DebouncedFunction<T>;
```

#### Parameters (`DebounceOptions`)

| Property   | Type      | Default | Description                                                    |
| ---------- | --------- | ------- | -------------------------------------------------------------- |
| `delay`    | `number`  | `300`   | Delay in milliseconds                                          |
| `leading`  | `boolean` | `false` | Invoke on the leading edge of the delay                        |
| `trailing` | `boolean` | `true`  | Invoke on the trailing edge of the delay                       |
| `maxWait`  | `number`  | —       | Force invocation after this many ms even if still being called |
| `debug`    | `boolean` | `false` | Enable debug logging                                           |

#### Returns

A `DebouncedFunction<T>` — call it like the original function; it also exposes:

| Property  | Type            | Description                          |
| --------- | --------------- | ------------------------------------ |
| `cancel`  | `() => void`    | Cancel any pending invocation        |
| `flush`   | `() => void`    | Invoke immediately if one is pending |
| `pending` | `() => boolean` | Whether an invocation is pending     |

#### Example

```vue
<script setup>
import { useDebounce } from 'vue3-maplibre-gl';

const logMove = useDebounce(
  (center) => {
    console.log('Map moved to:', center);
  },
  { delay: 300 },
);

// call logMove(center) inside a 'move' handler — it only logs 300ms after moves stop
</script>
```

### useDebouncedRef

Creates a ref pair: write to the "immediate" ref instantly, read a "debounced" ref that only updates after the delay. Useful for search inputs or sliders tied to map operations.

#### Signature

```typescript
function useDebouncedRef<T>(
  initialValue: T,
  delay?: number,
): [Ref<T>, Ref<T>, () => void, () => void];
```

#### Parameters

| Parameter      | Type     | Default | Description                    |
| -------------- | -------- | ------- | ------------------------------ |
| `initialValue` | `T`      | —       | Initial value for both refs    |
| `delay`        | `number` | `300`   | Debounce delay in milliseconds |

#### Returns

A tuple `[debouncedRef, immediateRef, flush, cancel]`:

| Index | Name           | Type         | Description                                         |
| ----- | -------------- | ------------ | --------------------------------------------------- |
| `0`   | `debouncedRef` | `Ref<T>`     | Updates `delay` ms after `immediateRef` settles     |
| `1`   | `immediateRef` | `Ref<T>`     | Updates instantly when you write to it              |
| `2`   | `flush`        | `() => void` | Immediately sync `debouncedRef` to the latest value |
| `3`   | `cancel`       | `() => void` | Cancel the pending update                           |

#### Example

```vue
<script setup>
import { useDebouncedRef } from 'vue3-maplibre-gl';

const [debouncedZoom, zoom] = useDebouncedRef(10, 250);

// zoom.value = 12  → updates immediately
// debouncedZoom.value → updates 250ms later, good for triggering expensive layer updates
</script>
```

### useDebouncedWatch

Combines Vue's `watch` with debouncing — the callback only fires `delay` ms after the watched source stops changing.

#### Signature

```typescript
function useDebouncedWatch<T>(
  source: WatchSource<T>,
  callback: (value: T, oldValue: T | undefined) => void,
  options?: DebounceOptions & {
    immediate?: boolean;
    deep?: boolean;
    flush?: 'pre' | 'post' | 'sync';
  },
): () => void;
```

#### Parameters

| Parameter  | Type                                              | Description                                    |
| ---------- | ------------------------------------------------- | ---------------------------------------------- |
| `source`   | `WatchSource<T>`                                  | Same as the first argument to Vue's `watch`    |
| `callback` | `(value: T, oldValue: T \| undefined) => void`    | Debounced watch callback                       |
| `options`  | `DebounceOptions & { immediate?, deep?, flush? }` | Debounce options plus standard `watch` options |

#### Returns

`() => void` — stops both the watcher and any pending debounced call.

#### Example

```vue
<script setup>
import { ref } from 'vue';
import { useDebouncedWatch } from 'vue3-maplibre-gl';

const searchQuery = ref('');

useDebouncedWatch(
  searchQuery,
  (query) => {
    console.log('Searching for:', query);
  },
  { delay: 400 },
);
</script>
```
