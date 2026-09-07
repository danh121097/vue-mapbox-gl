<script lang="ts" setup>
import {
  ref,
  provide,
  computed,
  unref,
  watch,
  nextTick,
  onUnmounted,
  watchEffect,
  shallowRef,
} from 'vue';
import { MapProvideKey, MaplibreEvents, MapCreationStatus } from '@libs/enums';
import type { MaplibreEvent } from '@libs/enums';
import {
  useCreateMaplibre,
  useMapEventListener,
  useLogger,
} from '@libs/composables';
import type { CreateMaplibreActions, MaplibreActions } from '@libs/types';
import type {
  ErrorEvent,
  Map,
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
  /**
   * Error handling callback.
   *
   * Not `onError`: this component also emits `error`, and Vue puts an emit's
   * handler on `$props` under that same `onError` key. Two declarations of one
   * prop are intersected, so both the prop and the emit became impossible to
   * satisfy -- no function is assignable to
   * `((error: any) => void) & ((ev: ErrorEvent) => any)`.
   */
  onMapError?: (error: any) => void;
  /** Load success callback. Named for the same reason as `onMapError`. */
  onMapLoad?: (map: Map) => void;
}

/**
 * What this component emits.
 *
 * One signature per group of forwarded events, covering exactly the names in
 * `MaplibreEvents` -- the list the runtime attaches listeners for -- with
 * maplibre's own payload type for each. The version this replaced was wrong in
 * both directions: it declared `Event`, the DOM one, where maplibre delivers
 * `MapLibreEvent`, so `@move="(e) => e.target"` did not type-check for anyone
 * using it; and a catch-all `(e: keyof MapEventType, ev: any)` overload
 * advertised three events the component never forwards.
 *
 * The events stay grouped by payload rather than listed one per line because
 * `vue-tsc` gives up and emits `any` for both the emits and the props of a
 * component with this many separate overloads -- which would leave the whole
 * component unchecked.
 */
interface Emits {
  (e: 'error', ev: ErrorEvent): void;
  (
    e: 'load' | 'idle' | 'remove' | 'render' | 'resize',
    ev: MapLibreEvent,
  ): void;
  (e: 'webglcontextlost' | 'webglcontextrestored', ev: MapContextEvent): void;
  (e: 'dataloading' | 'data' | 'tiledataloading', ev: MapDataEvent): void;
  (e: 'sourcedataloading' | 'sourcedata', ev: MapSourceDataEvent): void;
  (e: 'styledata', ev: MapStyleDataEvent): void;
  (e: 'styleimagemissing', ev: MapStyleImageMissingEvent): void;
  (e: 'dataabort', ev: MapDataEvent): void;
  (e: 'sourcedataabort', ev: MapSourceDataEvent): void;
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
    e: 'movestart' | 'move' | 'moveend' | 'zoomstart' | 'zoom' | 'zoomend',
    ev: MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined>,
  ): void;
  (
    e:
      | 'rotatestart'
      | 'rotate'
      | 'rotateend'
      | 'dragstart'
      | 'drag'
      | 'dragend'
      | 'pitchstart'
      | 'pitch'
      | 'pitchend',
    ev: MapLibreEvent<MouseEvent | TouchEvent | undefined>,
  ): void;
  (e: 'wheel', ev: MapWheelEvent): void;
  (e: 'terrain', ev: MapTerrainEvent): void;
  (e: 'register', actions: MaplibreActions): void;
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

/**
 * `emits` under one signature covering every forwarded event, so the loop below
 * can call it with a name it only knows as the whole union.
 *
 * The assignment is also what keeps `Emits` honest. Its payload types have to
 * be written out, and a transcript drifts; TypeScript checks parameters
 * contravariantly here, so a signature declaring anything maplibre's own
 * `MapEventType` does not deliver fails on this line.
 */
const forward: <K extends MaplibreEvent>(
  event: K,
  payload: MapEventType[K],
) => void = emits;

// Enhanced logging and error handling
const { logError } = useLogger(props.debug);

// Only the keys overridden through `setMapOptions`. Merged over `props.options`
// so a prop that was never overridden keeps flowing through. Shallow, so an
// object `style` keeps its identity — the style watcher compares by reference,
// and a proxy wrapper would re-issue `map.setStyle` for an unchanged style.
const innerOptions = shallowRef<Partial<MapOptions>>({});
const mapContainerRef = shallowRef<HTMLElement | null>(null);
const styleRef = ref(props.options.style as string);

const isComponentMounted = ref(false);
const mapCreationStatus = ref<MapCreationStatus>(
  MapCreationStatus.NotInitialized,
);

// Enhanced computed properties for better reactivity and performance
const mapOptions = computed(() => ({
  ...props.options,
  ...innerOptions.value,
}));

/**
 * Structural comparison for the coordinate-shaped option values (`center`,
 * `maxBounds`), so a parent re-render that rebuilds an inline `options` literal
 * does not re-issue the matching map command with an unchanged value.
 *
 * The recursion is unbounded, so this is only applied to the coordinate options
 * — a handful of numbers each. `style` is deliberately left on reference
 * equality; deep-walking a full style specification on every render is exactly
 * the cost this component was changed to stop paying.
 */
function isSameCoordinateValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) =>
    isSameCoordinateValue(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

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
 * Overrides individual map options on top of the `options` prop
 * @param options - Partial map options to merge
 */
function setMapOptions(options: Partial<MapOptions>): void {
  innerOptions.value = { ...innerOptions.value, ...options };
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
      // Status comes from `useCreateMaplibre` alone. The component keeps its
      // own copy for the template, but it never reaches `Loading`, so mixing
      // the two sources in one payload gave consumers contradictory values.
      const enhancedActions = {
        ...actions,
        setMapOptions,
      };

      props.register?.(enhancedActions as MaplibreActions);
      emits('register', enhancedActions as MaplibreActions);
    } catch (error) {
      logError('Error during map registration:', error);
      props.onMapError?.(error);
    }
  },
  onLoad: (map) => {
    try {
      mapCreationStatus.value = MapCreationStatus.Loaded;
      props.onMapLoad?.(map);
    } catch (error) {
      logError('Error in map load handler:', error);
      props.onMapError?.(error);
    }
  },
  onError: (error) => {
    try {
      // A loaded map reports failed tiles, glyphs and sprites through the same
      // callback. Those must reach the consumer but must not flip the template
      // gate — `load` never fires again, so the default slot (and every layer,
      // marker and popup inside it) would be gone for good.
      if (!isMapReady.value) {
        mapCreationStatus.value = MapCreationStatus.Error;
      }
      logError('Map error:', error);
      props.onMapError?.(error);
    } catch (handlerError) {
      logError('Error in error handler:', handlerError);
    }
  },
  debug: props.debug,
});

// Provide map instance to child components
provide(MapProvideKey, mapInstance);

// Enhanced event listeners with error handling — capture cleanup functions for defense-in-depth
const eventCleanups = MaplibreEvents.map((evt) => {
  const { removeListener } = useMapEventListener({
    map: mapInstance,
    event: evt,
    on: (data) => {
      try {
        forward(evt, data);
      } catch (error) {
        logError(`Error in ${evt} event handler:`, error, { data });
      }
    },
    debug: props.debug,
  });
  return removeListener;
});

// Create optimized watchers for map properties with null safety
const watchers = [
  watch(
    () => unref(mapOptions).center,
    (value, oldValue) =>
      value && !isSameCoordinateValue(value, oldValue) && setCenter(value),
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
    (value, oldValue) =>
      value && !isSameCoordinateValue(value, oldValue) && setMaxBounds(value),
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
    props.onMapError?.(error);
  }
});

// Enhanced cleanup with comprehensive resource disposal
function cleanup(): void {
  try {
    // Stop all watchers
    watchers.forEach((stopWatcher) => stopWatcher?.());

    // Explicitly remove event listeners (defense-in-depth alongside onUnmounted in factory)
    eventCleanups.forEach((cleanup) => cleanup?.());

    // Reset state
    isComponentMounted.value = false;
    mapCreationStatus.value = MapCreationStatus.Destroyed;
  } catch (error) {
    logError('Error during cleanup:', error);
  }
}

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
