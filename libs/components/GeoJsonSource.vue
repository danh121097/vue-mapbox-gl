<script lang="ts" setup>
import { inject, ref, provide, watch, computed, onUnmounted } from 'vue';
import { MapProvideKey, SourceProvideKey } from '@libs/enums';
import { useCreateGeoJsonSource, useLogger } from '@libs/composables';
import type { CreateGeoJsonSourceActions } from '@libs/composables';
import type { GeoJSONSource, GeoJSONSourceSpecification } from 'maplibre-gl';

/**
 * Enhanced GeoJsonSource component props with comprehensive configuration options
 */
interface GeoJsonSourceProps {
  /** Unique identifier for the source */
  id?: string;
  /** GeoJSON data for the source */
  data?: GeoJSONSourceSpecification['data'];
  /** Additional source configuration options */
  options?: Partial<GeoJSONSourceSpecification>;
  /** Callback for registering source actions */
  register?: (actions: CreateGeoJsonSourceActions) => void;
  /** Enable debug logging */
  debug?: boolean;
  /** Automatically cleanup resources on unmount */
  autoCleanup?: boolean;
  /** Error handling callback */
  onError?: (error: any) => void;
  /** Source load success callback */
  onLoad?: (source: GeoJSONSource) => void;
  /** Data update callback */
  onDataUpdate?: (data: GeoJSONSourceSpecification['data']) => void;
}

/**
 * Enhanced event emits with proper typing and comprehensive event coverage
 */
interface Emits {
  (e: 'register', actions: CreateGeoJsonSourceActions): void;
  (e: 'error', error: any): void;
  (e: 'load', source: any): void;
  (e: 'data-update', data: GeoJSONSourceSpecification['data']): void;
}

const props = withDefaults(defineProps<GeoJsonSourceProps>(), {
  data: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
  options: () => ({}),
  debug: false,
  autoCleanup: true,
});

const emits = defineEmits<Emits>();

// Enhanced logging and error handling
const { logError } = useLogger(props.debug);

// Reactive state management
const mapInstance = inject(MapProvideKey, ref(null));
const isSourceRegistered = ref(false);
const lastDataUpdate = ref<GeoJSONSourceSpecification['data']>();

// Computed properties for better reactivity and performance
const isDataValid = computed(() => {
  const data = props.data;
  if (!data) return false;

  // Basic GeoJSON validation
  if (typeof data === 'object' && 'type' in data) {
    return data.type === 'FeatureCollection' || data.type === 'Feature';
  }

  // URL validation for string data
  if (typeof data === 'string') {
    try {
      new URL(data);
      return true;
    } catch {
      return false;
    }
  }

  return false;
});

/**
 * Enhanced data setter with validation and error handling
 * @param newData - New GeoJSON data to set
 */
function handleSetData(newData: GeoJSONSourceSpecification['data']): void {
  try {
    if (!newData) return;

    // Validate data before setting
    if (typeof newData === 'object' && 'type' in newData) {
      if (!['FeatureCollection', 'Feature'].includes(newData.type)) {
        logError('Invalid GeoJSON type:', newData.type);
        return;
      }
    }

    setData(newData);
    lastDataUpdate.value = newData;

    // Emit data update event
    emits('data-update', newData);
    props.onDataUpdate?.(newData);
  } catch (error) {
    logError('Error setting GeoJSON source data:', error);
    emits('error', error);
    props.onError?.(error);
  }
}

// Enhanced GeoJSON source with comprehensive error handling
const {
  sourceId,
  getSource,
  setData,
  removeSource,
  refreshSource,
  sourceStatus,
  isSourceReady,
} = useCreateGeoJsonSource({
  map: mapInstance,
  id: props.id,
  data: props.data,
  options: props.options,
  debug: props.debug,
  register: (actions) => {
    try {
      const enhancedActions = {
        ...actions,
        // Additional enhanced methods
        isSourceRegistered: isSourceRegistered.value,
        lastDataUpdate: lastDataUpdate.value,
        isDataValid: isDataValid.value,
      };

      props.register?.(enhancedActions);
      emits('register', enhancedActions);

      isSourceRegistered.value = true;

      // Emit load event
      if (actions.getSource.value) {
        emits('load', actions.getSource.value);
        props.onLoad?.(actions.getSource.value);
      }
    } catch (error) {
      logError('Error registering GeoJSON source:', error);
      emits('error', error);
      props.onError?.(error);
    }
  },
});

// Provide source to child components
provide(SourceProvideKey, getSource);

// Enhanced data watcher with validation and error handling
watch(
  () => props.data,
  (newData, oldData) => {
    if (newData === oldData) return;

    try {
      if (newData && isDataValid.value) {
        handleSetData(newData);
      } else if (newData && !isDataValid.value) {
        const error = new Error('Invalid GeoJSON data format');
        logError('Invalid GeoJSON data provided:', newData);
        emits('error', error);
        props.onError?.(error);
      }
    } catch (error) {
      logError('Error in data watcher:', error);
      emits('error', error);
      props.onError?.(error);
    }
  },
  {
    deep: true,
    immediate: true,
    flush: 'post', // Optimize by running after DOM updates
  },
);

/**
 * Enhanced cleanup function for disposing resources
 */
function cleanup(): void {
  try {
    if (props.autoCleanup) {
      // Reset state
      isSourceRegistered.value = false;
      lastDataUpdate.value = undefined;

      // Remove source if still available
      if (isSourceReady) {
        removeSource();
      }
    }
  } catch (error) {
    logError('Error during GeoJSON source cleanup:', error);
  }
}

// Cleanup on component unmount
onUnmounted(cleanup);

// Expose source methods for parent components
defineExpose({
  sourceId,
  getSource,
  setData: handleSetData,
  removeSource,
  refreshSource,
  sourceStatus,
  isSourceReady,
  isSourceRegistered,
  isDataValid,
  lastDataUpdate,
  cleanup,
});
</script>

<template>
  <!-- Main content slot -->
  <slot />
</template>
