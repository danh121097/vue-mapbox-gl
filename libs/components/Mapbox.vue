<script lang="ts" setup>
import {
  ref,
  provide,
  computed,
  unref,
  watch,
  nextTick,
  onBeforeMount,
  watchEffect,
} from 'vue';
import { MapProvideKey, MapboxEvents } from '@libs/enums';
import { useCreateMapbox, useMapEventListener } from '@libs/composables';
import { MapTouchEvent, MapWheelEvent } from 'maplibre-gl';
import type { CreateMaplibreActions, MaplibreActions } from '@libs/types';
import type {
  MapContextEvent,
  MapDataEvent,
  MapEventType,
  MapLibreEvent,
  MapLibreZoomEvent,
  MapMouseEvent,
  MapOptions,
  MapSourceDataEvent,
  MapStyleDataEvent,
  MapStyleImageMissingEvent,
  MapTerrainEvent,
} from 'maplibre-gl';

interface MapboxProps {
  options?: Partial<MapOptions>;
  register?: (actions: MaplibreActions) => void;
  debug?: boolean;
}

interface Emits {
  (e: keyof MapEventType, ev: any): void;
  (e: 'register', actions: MaplibreActions): void;
  (
    e: 'error' | 'load' | 'idle' | 'remove' | 'render' | 'resize',
    ev: MapLibreEvent,
  ): void;
  (e: 'webglcontextlost' | 'webglcontextrestored', ev: MapContextEvent): void;
  (
    e: 'dataloading' | 'data' | 'tiledataloading' | 'dataabort',
    ev: MapDataEvent,
  ): void;
  (
    e: 'sourcedataloading' | 'sourcedata' | 'sourcedataabort',
    ev: MapSourceDataEvent,
  ): void;
  (e: 'styledata', ev: MapStyleDataEvent): void;
  (e: 'styleimagemissing', ev: MapStyleImageMissingEvent): void;
  (
    e: 'boxzoomcancel' | 'boxzoomstart' | 'boxzoomend',
    ev: MapLibreZoomEvent,
  ): void;
  (
    e: 'touchcancel' | 'touchmove' | 'touchend' | 'touchstart',
    ev: MapTouchEvent,
  ): void;
  (
    e:
      | 'click'
      | 'contextmenu'
      | 'dblclick'
      | 'mousemove'
      | 'mouseup'
      | 'mousedown'
      | 'mouseout'
      | 'mouseover',
    ev: MapMouseEvent,
  ): void;
  (
    e:
      | 'movestart'
      | 'move'
      | 'moveend'
      | 'zoomstart'
      | 'zoom'
      | 'zoomend'
      | 'rotatestart'
      | 'rotate'
      | 'rotateend'
      | 'dragstart'
      | 'drag'
      | 'dragend'
      | 'pitchstart'
      | 'pitch'
      | 'pitchend',
    ev: MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined>,
  ): void;
  (e: 'wheel', ev: MapWheelEvent): void;
  (e: 'terrain', ev: MapTerrainEvent): void;
}

const props = withDefaults(defineProps<MapboxProps>(), {
  options: () => ({}),
});
const emits = defineEmits<Emits>();

const innerOptions = ref<Partial<MapOptions>>();
const maplibreElRef = ref<HTMLElement>();
const styleRef = ref(props.options.style as string);

const mapOptions = computed(() => {
  const options = { ...props.options };
  Object.assign(options, innerOptions.value);
  return options;
});

function setMapOptions(options: Partial<MapOptions>) {
  innerOptions.value = {
    ...(unref(mapOptions) || {}),
    ...options,
    style: options.style,
  };
}

const {
  mapInstance,
  setCenter,
  setBearing,
  setZoom,
  setPitch,
  setStyle,
  setMaxBounds,
  setMaxPitch,
  setMaxZoom,
  setMinPitch,
  setMinZoom,
  setRenderWorldCopies,
} = useCreateMapbox(maplibreElRef, styleRef, {
  ...unref(mapOptions),
  register: (actions: CreateMaplibreActions) => {
    props.register?.({
      ...actions,
      setMapOptions,
    });
    emits('register', {
      ...actions,
      setMapOptions,
    });
  },
  debug: props.debug,
});

provide(MapProvideKey, mapInstance);

MapboxEvents.map((evt) => {
  useMapEventListener({
    map: mapInstance,
    event: evt,
    on: (data) => {
      emits(evt, data);
    },
  });
});

watch(() => unref(mapOptions).center!, setCenter);

watch(() => unref(mapOptions).bearing!, setBearing);

watch(() => unref(mapOptions).zoom!, setZoom);

watch(() => unref(mapOptions).pitch!, setPitch);

watch(() => unref(mapOptions).style!, setStyle);

watch(() => unref(mapOptions).maxBounds!, setMaxBounds);

watch(() => unref(mapOptions).maxPitch!, setMaxPitch);

watch(() => unref(mapOptions).maxZoom!, setMaxZoom);

watch(() => unref(mapOptions).minPitch!, setMinPitch);

watch(() => unref(mapOptions).minZoom!, setMinZoom);

watch(() => unref(mapOptions).renderWorldCopies!, setRenderWorldCopies);

watchEffect(async () => {
  await nextTick();
  const wrapper = document.getElementById('maplibre_container');
  maplibreElRef.value = document.createElement('div');
  maplibreElRef.value.id = props.options?.container
    ? String(props.options?.container)
    : 'maplibre';
  maplibreElRef.value.style.width = '100%';
  maplibreElRef.value.style.height = '100%';
  wrapper?.appendChild(maplibreElRef.value);
});

onBeforeMount(() => {
  maplibreElRef.value?.remove();
});
</script>

<template>
  <div id="maplibre_container">
    <slot />
  </div>
</template>

<style lang="scss">
#maplibre_container {
  width: 100%;
  height: 100%;
}
</style>
