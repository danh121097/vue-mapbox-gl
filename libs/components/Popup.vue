<script lang="ts" setup>
import { inject, ref, watch, computed, shallowRef } from 'vue';
import { MapProvideKey } from '@libs/enums';
import { useCreatePopup } from '@libs/composables';
import type { LngLatLike, PopupOptions } from 'maplibre-gl';

/**
 * Props interface for Popup component
 * Defines all configurable properties for a MapLibre GL Popup
 */
interface PopupProps {
  /** CSS class name for the popup */
  className: string;
  /** Geographic coordinates for the popup */
  lnglat: LngLatLike;
  /** Whether the popup is visible */
  show: boolean;
  /** Whether to attach popup to the map */
  withMap: boolean;
  /** Popup configuration options */
  options: PopupOptions;
  /** HTML content for the popup */
  html: string;
  /** Maximum width of the popup */
  maxWidth?: string;
  /** Whether to show close button */
  closeButton?: boolean;
  /** Whether to close on map click */
  closeOnClick?: boolean;
  /** Whether to close on escape key */
  closeOnEscape?: boolean;
}

/**
 * Events interface for Popup component
 * Defines all events that can be emitted by the popup
 */
interface Emits {
  /** Fired when popup is closed */
  (event: 'close'): void;
  /** Fired when popup is opened */
  (event: 'open'): void;
  /** Fired when show state changes (for v-model support) */
  (event: 'update:show', show: boolean): void;
}

// Component props with sensible defaults
const props = withDefaults(defineProps<Partial<PopupProps>>(), {
  show: true,
  withMap: true,
  closeButton: true,
  closeOnClick: true,
  closeOnEscape: true,
});

// Component events
const emits = defineEmits<Emits>();

// Injected dependencies
const mapInstance = inject(MapProvideKey, shallowRef(null));
const popupElRef = ref<HTMLElement>();

// Computed properties for better performance
const popupOptions = computed(() => ({
  ...props.options,
  className: props.className,
  maxWidth: props.maxWidth,
  closeButton: props.closeButton,
  closeOnClick: props.closeOnClick,
  closeOnEscape: props.closeOnEscape,
}));

// Enhanced event handlers with error handling
const eventHandlers = {
  open: () => {
    emits('open');
    emits('update:show', true);
  },
  close: () => {
    emits('close');
    emits('update:show', false);
  },
};

// Create popup with optimized configuration
const { setLngLat, show, hide } = useCreatePopup({
  map: mapInstance,
  el: popupElRef,
  lnglat: props.lnglat,
  html: props.html,
  show: props.show,
  withMap: props.withMap,
  options: popupOptions.value,
  on: eventHandlers,
});

// Reactive watchers for prop changes with error handling
watch(
  () => props.show,
  (isShow) => {
    isShow ? show() : hide();
  },
);

watch(
  () => props.lnglat,
  (newLnglat) => {
    if (newLnglat) {
      setLngLat(newLnglat);
    }
  },
  { deep: true },
);
</script>
<template>
  <div ref="popupElRef" class="mapboxgl-popup-content-inner">
    <slot />
  </div>
</template>
