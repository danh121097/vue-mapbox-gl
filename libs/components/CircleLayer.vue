<script lang="ts" setup>
import { ref, inject, watch, computed, onUnmounted } from 'vue';
import {
  MapProvideKey,
  SourceProvideKey,
  MapboxLayerEvents,
} from '@libs/enums';
import { useLayerEventListener, useCreateCircleLayer } from '@libs/composables';
import type {
  CreateLayerActions,
  AnyLayout,
  CircleLayerStyle,
} from '@libs/types';
import type {
  Map,
  MapLayerEventType,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  FilterSpecification,
  CircleLayerSpecification,
} from 'maplibre-gl';

/**
 * Props interface for CircleLayer component
 * Defines all configurable properties for a MapLibre GL Circle Layer
 */
interface LayerProps {
  /** Unique identifier for the layer */
  id: string;
  /** Filter expression to apply to the layer */
  filter: FilterSpecification;
  /** Style configuration for the circle layer */
  style: CircleLayerStyle;
  /** Maximum zoom level for layer visibility */
  maxzoom: number;
  /** Minimum zoom level for layer visibility */
  minzoom: number;
  /** Arbitrary metadata for the layer */
  metadata: object;
  /** Data source for the layer */
  source: string | object;
  /** Source layer name for vector sources */
  sourceLayer: string;
  /** ID of layer before which to insert this layer */
  beforeId: string;
  /** Whether the layer is visible */
  visible: boolean;
  /** Enable debug logging */
  debug: boolean;
  /** Callback function to register layer actions */
  register: (
    actions: CreateLayerActions<CircleLayerSpecification>,
    map: Map,
  ) => void;
}

/**
 * Events interface for CircleLayer component
 * Defines all events that can be emitted by the layer
 */
interface Emits {
  /** Generic layer event */
  (e: keyof MapLayerEventType, ev: any): void;
  /** Layer registration event */
  (
    e: 'register',
    actions: CreateLayerActions<CircleLayerSpecification>,
    map: Map,
  ): void;
  /** Mouse events */
  (
    e:
      | 'click'
      | 'dblclick'
      | 'mousedown'
      | 'mouseup'
      | 'mousemove'
      | 'mouseenter'
      | 'mouseleave'
      | 'mouseover'
      | 'mouseout'
      | 'contextmenu',
    ev: MapLayerMouseEvent,
  ): void;
  /** Touch events */
  (e: 'touchstart' | 'touchend' | 'touchcancel', ev: MapLayerTouchEvent): void;
}

// Component props with sensible defaults and performance optimizations
const props = withDefaults(defineProps<Partial<LayerProps>>(), {
  visible: true,
  debug: false,
  filter: () => ['all'] as FilterSpecification,
  style: () => ({}) as CircleLayerStyle,
});

// Component events
const emits = defineEmits<Emits>();

// Injected dependencies
const sourceData = inject(SourceProvideKey, ref(null));
const mapInstance = inject(MapProvideKey, ref(null));

// Computed properties for better performance and reactivity
const effectiveSource = computed(() => props.source || sourceData.value);

const visibilityStyle = computed(
  (): AnyLayout => ({
    visibility: props.visible ? 'visible' : 'none',
  }),
);

const mergedStyle = computed(() => ({
  ...props.style,
  ...visibilityStyle.value,
}));

// Enhanced register callback with proper typing
const handleRegister = (
  actions: CreateLayerActions<CircleLayerSpecification>,
  map: Map,
) => {
  props.register?.(actions, map);
  emits('register', actions, map);
};

// Create circle layer with optimized configuration
const {
  getLayer,
  setBeforeId,
  setFilter,
  setStyle,
  setZoomRange,
  setLayoutProperty,
} = useCreateCircleLayer({
  map: mapInstance,
  source: effectiveSource,
  style: mergedStyle.value,
  filter: props.filter || ['all'],
  id: props.id,
  maxzoom: props.maxzoom || 22,
  minzoom: props.minzoom || 1,
  metadata: props.metadata,
  sourceLayer: props.sourceLayer,
  register: handleRegister,
});

// Optimized event listener setup with error handling
MapboxLayerEvents.forEach((evt) => {
  useLayerEventListener({
    map: mapInstance,
    layer: getLayer,
    event: evt,
    on: (data) => {
      emits(evt, data);
    },
  });
});

// Optimized single watcher for all prop changes to reduce overhead
const stopPropsWatcher = watch(
  () => ({
    filter: props.filter,
    style: props.style,
    maxzoom: props.maxzoom,
    minzoom: props.minzoom,
    beforeId: props.beforeId,
    visible: props.visible,
  }),
  (newProps, oldProps) => {
    // Only update if values actually changed to prevent unnecessary operations
    if (newProps.filter !== oldProps?.filter) {
      setFilter(newProps.filter);
    }
    if (newProps.style !== oldProps?.style) {
      setStyle(newProps.style);
    }
    if (
      newProps.maxzoom !== oldProps?.maxzoom ||
      newProps.minzoom !== oldProps?.minzoom
    ) {
      setZoomRange(newProps.minzoom, newProps.maxzoom);
    }
    if (newProps.beforeId !== oldProps?.beforeId) {
      setBeforeId(newProps.beforeId);
    }
    if (newProps.visible !== oldProps?.visible) {
      setLayoutProperty('visibility', newProps.visible ? 'visible' : 'none');
    }
  },
  {
    deep: true,
    flush: 'post', // Run after DOM updates for better performance
  },
);

// Enhanced cleanup
onUnmounted(() => {
  stopPropsWatcher();
});
</script>
<template></template>
