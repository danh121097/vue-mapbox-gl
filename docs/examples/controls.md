# Controls

This library ships one control component, `<GeolocateControls>`. Every other
MapLibre control — navigation, scale, fullscreen, attribution — is used as
MapLibre's own class, constructed and handed to `map.addControl()`.

There is no `<NavigationControl>` component, and there never was. If you find a
snippet importing one from `vue3-maplibre-gl`, it is wrong.

## Geolocation

`<GeolocateControls>` wraps MapLibre's `GeolocateControl` and adds Vue events.

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px">
    <GeolocateControls
      position="top-right"
      :options="{ trackUserLocation: true }"
      @geolocate="onGeolocate"
      @error="onGeolocateError"
    />
  </Maplibre>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Maplibre, GeolocateControls } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

function onGeolocate(position) {
  console.log(
    'Located at',
    position.coords.latitude,
    position.coords.longitude,
  );
}

function onGeolocateError(error) {
  console.error('Geolocation failed:', error.message);
}
</script>
```

### Props

| Prop          | Type                      | Default          | Description                     |
| ------------- | ------------------------- | ---------------- | ------------------------------- |
| `position`    | `ControlPosition`         | `'bottom-right'` | Corner the control is placed in |
| `options`     | `GeolocateControlOptions` | `{}`             | Passed to MapLibre's control    |
| `debug`       | `boolean`                 | `false`          | Enable debug logging            |
| `autoCleanup` | `boolean`                 | `true`           | Remove the control on unmount   |

Callback props mirror the events: `onGeolocateSuccess`, `onGeolocateError`,
`onTrackingStart`, `onTrackingEnd`, `onOutOfMaxBounds`. The first two are not
`onGeolocate` and `onError`, because Vue already keys the `geolocate` and
`error` emits' listeners there.

### Events

| Event                    | Payload                    | Description                       |
| ------------------------ | -------------------------- | --------------------------------- |
| `register`               | `GeolocateControl`         | The underlying MapLibre control   |
| `geolocate`              | `GeolocateSuccess`         | A position was resolved           |
| `error`                  | `GeolocationPositionError` | Geolocation failed or was denied  |
| `outofmaxbounds`         | `GeolocateSuccess`         | Position lies outside `maxBounds` |
| `trackuserlocationstart` | `GeolocateSuccess`         | Continuous tracking began         |
| `trackuserlocationend`   | `GeolocateSuccess`         | Continuous tracking ended         |

## MapLibre's own controls

Import the class from the `vue3-maplibre-gl/maplibre` subpath. Since v6 the
runtime lives there rather than at the package root, so importing one component
does not pin the whole MapLibre runtime into your bundle.

```vue
<template>
  <Maplibre :options="mapOptions" style="height: 400px" @load="onLoad" />
</template>

<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount } from 'vue';
import { Maplibre } from 'vue3-maplibre-gl';
import {
  NavigationControl,
  ScaleControl,
  FullscreenControl,
} from 'vue3-maplibre-gl/maplibre';
import type { Map } from 'vue3-maplibre-gl';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 2,
});

const map = shallowRef<Map | null>(null);
const controls = shallowRef<any[]>([]);

function onLoad(instance: Map) {
  map.value = instance;

  controls.value = [
    [new NavigationControl({ showCompass: true }), 'top-right'],
    [new ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left'],
    [new FullscreenControl(), 'top-left'],
  ];

  for (const [control, position] of controls.value) {
    instance.addControl(control, position);
  }
}

// The map is destroyed with the component, so this only matters if the controls
// outlive the map — but removing what you added keeps the intent explicit.
onBeforeUnmount(() => {
  for (const [control] of controls.value) map.value?.removeControl(control);
  controls.value = [];
});
</script>
```

Attribution is a special case: MapLibre adds one automatically. Pass
`attributionControl: false` in the map options before adding your own, or you
get two.

```ts
import { AttributionControl } from 'vue3-maplibre-gl/maplibre';

const mapOptions = ref({
  style: 'https://demotiles.maplibre.org/style.json',
  attributionControl: false,
});

// then, on load:
instance.addControl(new AttributionControl({ compact: true }), 'bottom-right');
```

## Adding a control from a composable

If you are outside a component that receives the map, `useMaplibre()` gives you
the instance and a readiness flag. Both are refs — read them with `.value`.

```ts
import { watchEffect, shallowRef } from 'vue';
import { useMaplibre } from 'vue3-maplibre-gl';
import { NavigationControl } from 'vue3-maplibre-gl/maplibre';

const { mapInstance, isMapReady } = useMaplibre();
const control = shallowRef<NavigationControl | null>(null);

watchEffect((onCleanup) => {
  if (!isMapReady.value || !mapInstance.value) return;

  const map = mapInstance.value;
  control.value = new NavigationControl();
  map.addControl(control.value, 'top-right');

  onCleanup(() => {
    if (control.value) map.removeControl(control.value);
    control.value = null;
  });
});
```

`useGeolocateControl` is the composable equivalent of `<GeolocateControls>` and
handles this bookkeeping for you:

```ts
import { useGeolocateControl } from 'vue3-maplibre-gl';

const { geolocateControl, isControlAdded, removeControl } = useGeolocateControl(
  {
    map: mapInstance,
    position: 'top-right',
    options: { trackUserLocation: true },
  },
);
```

## A custom control

MapLibre's control contract is an object with `onAdd` and `onRemove`. Anything
satisfying it can be added the same way.

```ts
import type { IControl, Map } from 'vue3-maplibre-gl';

class ResetViewControl implements IControl {
  private container!: HTMLDivElement;
  private map!: Map;

  onAdd(map: Map) {
    this.map = map;
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'Reset view');
    button.textContent = '⌂';
    button.addEventListener('click', () => {
      this.map.flyTo({ center: [0, 0], zoom: 2 });
    });

    this.container.appendChild(button);
    return this.container;
  }

  onRemove() {
    this.container.remove();
  }
}

// instance.addControl(new ResetViewControl(), 'top-left');
```

Reuse MapLibre's `maplibregl-ctrl maplibregl-ctrl-group` classes and your
control inherits the built-in styling and spacing.

## Related

- [`GeolocateControls` API](/api/components#geolocatecontrols)
- [`useGeolocateControl` API](/api/composables#usegeolocatecontrol)
- [Migration to v6](/guide/migration-v6) — why the MapLibre runtime moved to the
  `vue3-maplibre-gl/maplibre` subpath
