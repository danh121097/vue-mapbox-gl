<script lang="ts" setup>
import { inject, ref, watchEffect, computed, onUnmounted } from 'vue';
import { MapProvideKey, GeolocateEvents } from '@libs/enums';
import {
  useGeolocateControl,
  useGeolocateEventListener,
  useLogger,
} from '@libs/composables';
import type {
  GeolocateSuccess,
  GeolocationPositionError,
  GeolocateEventTypes,
} from '@libs/types';
import type {
  ControlPosition,
  GeolocateControl,
  GeolocateControlOptions,
} from 'maplibre-gl';

/**
 * Enhanced GeolocateControl component props with comprehensive configuration options
 */
interface GeolocateControlProps {
  /** Position of the control on the map */
  position?: ControlPosition;
  /** Geolocate control configuration options */
  options?: GeolocateControlOptions;
  /** Enable debug logging */
  debug?: boolean;
  /** Automatically cleanup resources on unmount */
  autoCleanup?: boolean;
  /** Error handling callback */
  onError?: (error: any) => void;
  /** Success callback for geolocation */
  onGeolocate?: (data: GeolocateSuccess) => void;
  /** Callback when user location tracking starts */
  onTrackingStart?: (data: GeolocateSuccess) => void;
  /** Callback when user location tracking ends */
  onTrackingEnd?: (data: GeolocateSuccess) => void;
  /** Callback when user location is out of max bounds */
  onOutOfMaxBounds?: (data: GeolocateSuccess) => void;
}

/**
 * Enhanced event emits with proper typing and comprehensive event coverage
 */
interface Emits {
  (e: keyof GeolocateEventTypes, ev: any): void;
  (e: 'register', ev: GeolocateControl): void;
  (e: 'geolocate', ev: GeolocateSuccess): void;
  (e: 'error', ev: GeolocationPositionError): void;
  (e: 'outofmaxbounds', ev: GeolocateSuccess): void;
  (e: 'trackuserlocationstart', ev: GeolocateSuccess): void;
  (e: 'trackuserlocationend', ev: GeolocateSuccess): void;
}

const props = withDefaults(defineProps<GeolocateControlProps>(), {
  position: 'bottom-right',
  options: () => ({}),
  debug: false,
  autoCleanup: true,
});
const emits = defineEmits<Emits>();

// Enhanced logging and error handling
const { logError } = useLogger(props.debug);

// Reactive state management
const mapInstance = inject(MapProvideKey, ref(null));
const isControlRegistered = ref(false);
const controlError = ref<any>(null);

// Computed properties for better reactivity and performance
const hasControlError = computed(() => !!controlError.value);

// Enhanced geolocate control with comprehensive error handling
const { geolocateControl, isControlAdded, removeControl, addControl, trigger } =
  useGeolocateControl({
    map: mapInstance,
    position: props.position,
    options: props.options,
    debug: props.debug,
  });

/**
 * Enhanced event handler with error handling and callback support
 * @param eventType - The type of geolocate event
 * @param data - Event data
 */
function handleGeolocateEvent(
  eventType: keyof GeolocateEventTypes,
  data: any,
): void {
  try {
    // Emit the event
    emits(eventType, data);

    // Call specific callback handlers
    switch (eventType) {
      case 'geolocate':
        props.onGeolocate?.(data as GeolocateSuccess);
        break;
      case 'error':
        controlError.value = data;
        props.onError?.(data);
        break;
      case 'trackuserlocationstart':
        props.onTrackingStart?.(data as GeolocateSuccess);
        break;
      case 'trackuserlocationend':
        props.onTrackingEnd?.(data as GeolocateSuccess);
        break;
      case 'outofmaxbounds':
        props.onOutOfMaxBounds?.(data as GeolocateSuccess);
        break;
      default:
        break;
    }
  } catch (error) {
    logError(`Error handling ${eventType} event:`, error, { data });
    controlError.value = error;
    props.onError?.(error);
  }
}

// Enhanced control registration with error handling
watchEffect(() => {
  try {
    if (geolocateControl.value && !isControlRegistered.value) {
      emits('register', geolocateControl.value);
      isControlRegistered.value = true;
      controlError.value = null;
    }
  } catch (error) {
    logError('Error registering geolocate control:', error);
    controlError.value = error;
    props.onError?.(error);
  }
});

// Enhanced event listeners with error handling and performance optimization
GeolocateEvents.map((evt) => {
  return useGeolocateEventListener({
    geolocate: geolocateControl,
    event: evt,
    on: (data) => handleGeolocateEvent(evt, data),
    debug: props.debug,
  });
});

/**
 * Enhanced cleanup function for disposing resources
 */
function cleanup(): void {
  try {
    if (props.autoCleanup) {
      // Reset state
      isControlRegistered.value = false;
      controlError.value = null;

      // Remove control if still added
      if (isControlAdded.value) {
        removeControl();
      }
    }
  } catch (error) {
    logError('Error during geolocate control cleanup:', error);
  }
}

// Cleanup on component unmount
onUnmounted(cleanup);

// Expose control methods for parent components
defineExpose({
  geolocateControl,
  isControlAdded,
  isControlRegistered,
  hasControlError,
  controlError,
  addControl,
  removeControl,
  trigger,
  cleanup,
});
</script>

<template>
  <!-- Enhanced template with error state and accessibility -->
  <div v-if="hasControlError">
    <slot name="error"> </slot>
  </div>
</template>
