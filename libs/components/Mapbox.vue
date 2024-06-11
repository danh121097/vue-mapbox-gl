<script lang="ts" setup>
import { ref, provide, computed, unref, watch } from 'vue';
import { MapProvideKey, MapboxEvents, MapboxStatus } from '@libs/enums';
import { useCreateMapbox, useMapEventListener } from '@libs/composables';
import type {
  CreateMaplibreActions,
  MaplibreActions,
  MapEventTypes,
} from '@libs/types';
import type {
  MapLibreEvent,
  MapOptions,
  MapLibreZoomEvent,
  MapContextEvent,
  MapDataEvent,
  MapMouseEvent,
  MapSourceDataEvent,
  MapStyleDataEvent,
  MapTouchEvent,
  MapWheelEvent,
} from 'maplibre-gl';

interface MapboxProps {
  options?: Partial<MapOptions>;
  register?: (actions: MaplibreActions) => void;
}

interface Emits {
  (e: keyof MapEventTypes, ev: any): void;
  (e: 'register', actions: MaplibreActions): void;
  (e: 'error', ev: ErrorEvent): void;
  (e: 'load', ev: MapLibreEvent): void;
  (e: 'idle', ev: MapLibreEvent): void;
  (e: 'remove', ev: MapLibreEvent): void;
  (e: 'render', ev: MapLibreEvent): void;
  (e: 'resize', ev: MapLibreEvent): void;
  (e: 'webglcontextlost', ev: MapContextEvent): void;
  (e: 'webglcontextrestored', ev: MapContextEvent): void;
  (e: 'dataloading', ev: MapDataEvent): void;
  (e: 'data', ev: MapDataEvent): void;
  (e: 'tiledataloading', ev: MapDataEvent): void;
  (e: 'sourcedataloading', ev: MapSourceDataEvent): void;
  (e: 'styledataloading', ev: MapStyleDataEvent): void;
  (e: 'sourcedata', ev: MapSourceDataEvent): void;
  (e: 'styledata', ev: MapStyleDataEvent): void;
  (e: 'boxzoomcancel', ev: MapLibreZoomEvent): void;
  (e: 'boxzoomstart', ev: MapLibreZoomEvent): void;
  (e: 'boxzoomend', ev: MapLibreZoomEvent): void;
  (e: 'touchcancel', ev: MapTouchEvent): void;
  (e: 'touchmove', ev: MapTouchEvent): void;
  (e: 'touchend', ev: MapTouchEvent): void;
  (e: 'touchstart', ev: MapTouchEvent): void;
  (e: 'click', ev: MapMouseEvent): void;
  (e: 'contextmenu', ev: MapMouseEvent): void;
  (e: 'dblclick', ev: MapMouseEvent): void;
  (e: 'mousemove', ev: MapMouseEvent): void;
  (e: 'mouseup', ev: MapMouseEvent): void;
  (e: 'mousedown', ev: MapMouseEvent): void;
  (e: 'mouseout', ev: MapMouseEvent): void;
  (e: 'mouseover', ev: MapMouseEvent): void;
  (e: 'movestart', ev: MouseEvent): void;
  (e: 'move', ev: MouseEvent): void;
  (e: 'moveend', ev: MouseEvent): void;
  (e: 'zoomstart', ev: MapLibreZoomEvent): void;
  (e: 'zoom', ev: MapLibreZoomEvent): void;
  (e: 'zoomend', ev: MapLibreZoomEvent): void;
  (e: 'rotatestart', ev: MouseEvent): void;
  (e: 'rotate', ev: MouseEvent): void;
  (e: 'rotateend', ev: MouseEvent): void;
  (e: 'dragstart', ev: MouseEvent): void;
  (e: 'drag', ev: MouseEvent): void;
  (e: 'dragend', ev: MouseEvent): void;
  (e: 'pitchstart', ev: MouseEvent): void;
  (e: 'pitch', ev: MouseEvent): void;
  (e: 'pitchend', ev: MouseEvent): void;
  (e: 'wheel', ev: MapWheelEvent): void;
}

const props = withDefaults(defineProps<MapboxProps>(), {
  options: () => ({}),
});
const emits = defineEmits<Emits>();

const innerOptions = ref<Partial<MapOptions>>({});
const maplibreElRef = ref<HTMLElement>();
const styleRef = ref(props.options.style as string);

const mapOptions = computed(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return {
    ...props.options,
    ...innerOptions.value,
  };
});

function setMapOptions(options: Partial<MapOptions>) {
  innerOptions.value = {
    style: options.style,
    ...unref(mapOptions),
    ...options,
  };
}

const {
  mapInstance,
  mapStatus,
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
});

MapboxEvents.map((evt) => {
  useMapEventListener({
    map: mapInstance,
    event: evt,
    on: (data) => {
      emits(evt, data);
    },
  });
});

provide(MapProvideKey, mapInstance);

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
</script>
<template>
  <div ref="maplibreElRef" class="maplibre_container">
    <slot v-if="mapStatus >= MapboxStatus.Loading" name="beforeLoad" />
    <slot v-if="mapStatus >= MapboxStatus.Loaded" name="default" />
  </div>
</template>
<style lang="scss">
.maplibre_container {
  width: 100%;
  height: 100%;
}
</style>
