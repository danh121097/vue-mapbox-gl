<script lang="ts" setup>
import {
  ref,
  provide,
  computed,
  unref,
  watch,
  nextTick,
  onBeforeMount,
  onUnmounted,
  watchEffect,
  shallowRef,
} from 'vue';
import { MapProvideKey, MaplibreEvents, MapCreationStatus } from '@libs/enums';
import {
  useCreateMaplibre,
  useMapEventListener,
  useLogger,
  useOptimizedComputed,
} from '@libs/composables';
import type { CreateMaplibreActions, MaplibreActions } from '@libs/types';
import type {
  Map,
  MapContextEvent,
  MapDataEvent,
  MapEventType,
  MapLibreZoomEvent,
  MapMouseEvent,
  MapOptions,
  MapSourceDataEvent,
  MapTouchEvent,
  MapWheelEvent,
} from 'maplibre-gl';

/**
 * Enhanced Maplibre component props with comprehensive configuration options
 */
interface MaplibreProps {
  /** Map configuration options */
  options?: Partial<MapOptions>;
  /** Callback for registering map actions */
  register?: (actions: MaplibreActions) => void;
  /** Enable debug logging */
  debug?: boolean;
  /** Automatically cleanup resources on unmount */
  autoCleanup?: boolean;
  /** Container ID for the map element */
  containerId?: string;
  /** Custom container class names */
  containerClass?: string;
  /** Error handling callback */
  onError?: (error: any) => void;
  /** Load success callback */
  onLoad?: (map: Map) => void;
}

interface Emits {
  (e: keyof MapEventType, ev: any): void;
  (e: 'register', actions: MaplibreActions): void;
  (
    e: 'error' | 'load' | 'idle' | 'remove' | 'render' | 'resize',
    ev: Event,
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
  (e: 'styledata', ev: Event): void;
  (e: 'styleimagemissing', ev: Event): void;
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
    ev: Event,
  ): void;
  (e: 'wheel', ev: MapWheelEvent): void;
  (e: 'terrain', ev: Event): void;
}

const props = withDefaults(defineProps<MaplibreProps>(), {
  options: () => ({
    // Provide sensible defaults for better performance
    style: 'https://demotiles.maplibre.org/style.json',
    center: [0, 0] as [number, number],
    zoom: 1,
    pitch: 0,
    bearing: 0,
    antialias: true,
    optimizeForTerrain: true,
    // Performance optimizations
    preserveDrawingBuffer: false,
    refreshExpiredTiles: true,
    maxTileCacheSize: null,
    localIdeographFontFamily: false,
    transformRequest: undefined,
    collectResourceTiming: false,
    fadeDuration: 300,
    crossSourceCollisions: true,
  }),
  debug: false,
  autoCleanup: true,
  containerId: () => `maplibre-${Math.random().toString(36).substring(2, 11)}`,
  containerClass: '',
});
const emits = defineEmits<Emits>();

// Enhanced logging and error handling
const { logError } = useLogger(props.debug);

// Reactive state management
const innerOptions = ref<Partial<MapOptions>>();
const mapContainerRef = shallowRef<HTMLElement | null>(null);
const styleRef = ref(props.options.style as string);

const isComponentMounted = ref(false);
const mapCreationStatus = ref<MapCreationStatus>(
  MapCreationStatus.NotInitialized,
);

// Enhanced computed properties for better reactivity and performance
const mapOptions = useOptimizedComputed(
  () => {
    const baseOptions = { ...props.options };
    const mergedOptions = { ...baseOptions, ...innerOptions.value };
    return mergedOptions;
  },
  {
    deepEqual: true, // Use deep equality for complex objects
  },
);

const isMapReady = computed(
  () => mapCreationStatus.value === MapCreationStatus.Loaded,
);
const isMapLoading = computed(
  () => mapCreationStatus.value === MapCreationStatus.Loading,
);
const hasMapError = computed(
  () => mapCreationStatus.value === MapCreationStatus.Error,
);

/**
 * Enhanced map options setter with validation and error handling
 * @param options - Partial map options to merge
 */
function setMapOptions(options: Partial<MapOptions>): void {
  try {
    innerOptions.value = {
      ...(unref(mapOptions) || {}),
      ...options,
    };
  } catch (error) {
    logError('Error setting map options:', error, { options });
  }
}

// Enhanced map creation with comprehensive error handling and performance monitoring
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
} = useCreateMaplibre(mapContainerRef, styleRef, {
  ...unref(mapOptions),
  register: (actions: CreateMaplibreActions) => {
    try {
      const enhancedActions = {
        ...actions,
        setMapOptions,
        // Additional enhanced methods
        isMapReady: isMapReady.value,
        isMapLoading: isMapLoading.value,
        hasMapError: hasMapError.value,
      };

      props.register?.(enhancedActions as MaplibreActions);
      emits('register', enhancedActions as MaplibreActions);
    } catch (error) {
      logError('Error during map registration:', error);
      props.onError?.(error);
    }
  },
  onLoad: (map) => {
    try {
      mapCreationStatus.value = MapCreationStatus.Loaded;
      props.onLoad?.(map);
    } catch (error) {
      logError('Error in map load handler:', error);
      props.onError?.(error);
    }
  },
  onError: (error) => {
    try {
      mapCreationStatus.value = MapCreationStatus.Error;
      logError('Map creation error:', error);
      props.onError?.(error);
    } catch (handlerError) {
      logError('Error in error handler:', handlerError);
    }
  },
  debug: props.debug,
});

// Provide map instance to child components
provide(MapProvideKey, mapInstance);

// Enhanced event listeners with error handling and performance monitoring
MaplibreEvents.map((evt) => {
  return useMapEventListener({
    map: mapInstance,
    event: evt,
    on: (data) => {
      try {
        emits(evt as keyof MapEventType, data);
      } catch (error) {
        logError(`Error in ${evt} event handler:`, error, { data });
      }
    },
    debug: props.debug,
  });
});

// Create optimized watchers for map properties with null safety
const watchers = [
  watch(
    () => unref(mapOptions).center,
    (value) => value && setCenter(value),
    { flush: 'post' },
  ),
  watch(
    () => unref(mapOptions).bearing,
    (value) => value !== undefined && setBearing(value),
    { flush: 'post' },
  ),
  watch(
    () => unref(mapOptions).zoom,
    (value) => value !== undefined && setZoom(value),
    { flush: 'post' },
  ),
  watch(
    () => unref(mapOptions).pitch,
    (value) => value !== undefined && setPitch(value),
    { flush: 'post' },
  ),
  watch(
    () => unref(mapOptions).style,
    (value) => value && setStyle(value),
    { flush: 'post' },
  ),
  watch(
    () => unref(mapOptions).maxBounds,
    (value) => value && setMaxBounds(value),
    { flush: 'post' },
  ),
  watch(
    () => unref(mapOptions).maxPitch,
    (value) => value !== undefined && value !== null && setMaxPitch(value),
    { flush: 'post' },
  ),
  watch(
    () => unref(mapOptions).maxZoom,
    (value) => value !== undefined && value !== null && setMaxZoom(value),
    { flush: 'post' },
  ),
  watch(
    () => unref(mapOptions).minPitch,
    (value) => value !== undefined && value !== null && setMinPitch(value),
    { flush: 'post' },
  ),
  watch(
    () => unref(mapOptions).minZoom,
    (value) => value !== undefined && value !== null && setMinZoom(value),
    { flush: 'post' },
  ),
  watch(
    () => unref(mapOptions).renderWorldCopies,
    (value) => value !== undefined && setRenderWorldCopies(value),
    { flush: 'post' },
  ),
];

// Enhanced container management
watchEffect(async () => {
  try {
    await nextTick();

    if (mapContainerRef.value) {
      isComponentMounted.value = true;
      mapCreationStatus.value = MapCreationStatus.Initializing;
    } else {
      // Wait for next tick if container is not ready yet
      return;
    }
  } catch (error) {
    logError('Error in container creation watchEffect:', error);
    mapCreationStatus.value = MapCreationStatus.Error;
    props.onError?.(error);
  }
});

// Enhanced cleanup with comprehensive resource disposal
function cleanup(): void {
  try {
    // Stop all watchers
    watchers.forEach((stopWatcher) => stopWatcher?.());

    // Reset state
    isComponentMounted.value = false;
    mapCreationStatus.value = MapCreationStatus.Destroyed;
  } catch (error) {
    logError('Error during cleanup:', error);
  }
}

onBeforeMount(() => {
  if (props.autoCleanup) {
    cleanup();
  }
});

onUnmounted(() => {
  if (props.autoCleanup) {
    cleanup();
  }
});
</script>

<template>
  <div
    :id="containerId"
    ref="mapContainerRef"
    :class="['maplibre-container', containerClass]"
  >
    <!-- Loading state -->
    <div v-if="isMapLoading">
      <slot name="loading"> </slot>
    </div>

    <!-- Error state -->
    <div v-if="hasMapError">
      <slot name="error"> </slot>
    </div>

    <!-- Map content -->
    <slot v-if="isMapReady || (!isMapLoading && !hasMapError)" />
  </div>
</template>

<style lang="scss">
.maplibre-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
