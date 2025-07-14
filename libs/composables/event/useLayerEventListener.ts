import { onUnmounted, unref, watchEffect, computed, ref } from 'vue';
import { useLogger } from '@libs/composables';
import { hasLayer } from '@libs/helpers';
import type { Nullable } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { Map, MapLayerEventType, LayerSpecification } from 'maplibre-gl';

/**
 * Layer event listener status enum for better state management
 */
export enum LayerEventListenerStatus {
  NotAttached = 'not-attached',
  Attached = 'attached',
  Error = 'error',
}

interface LayerEventListenerProps<T extends keyof MapLayerEventType> {
  map: MaybeRef<Nullable<Map>>;
  layer: MaybeRef<Nullable<LayerSpecification | string>>;
  event: keyof MapLayerEventType;
  on: (e: MapLayerEventType[T]) => void;
  debug?: boolean;
  once?: boolean;
}

interface LayerEventListenerActions {
  removeListener: () => void;
  attachListener: () => void;
  isListenerAttached: boolean;
  listenerStatus: Readonly<LayerEventListenerStatus>;
  layerId: string | null;
}

/**
 * Composable for managing MapLibre GL Layer Event Listeners
 * Provides reactive layer event listener with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for the layer event listener
 * @returns Enhanced actions and state for the layer event listener
 */
export function useLayerEventListener<T extends keyof MapLayerEventType>(
  props: LayerEventListenerProps<T>,
): LayerEventListenerActions {
  const { logError } = useLogger(props.debug ?? false);
  const listenerStatus = ref<LayerEventListenerStatus>(
    LayerEventListenerStatus.NotAttached,
  );

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const layerInstance = computed(() => unref(props.layer));
  const layerId = computed(() => {
    const layer = layerInstance.value;
    return layer ? (typeof layer === 'string' ? layer : layer.id) : null;
  });
  const isListenerAttached = computed(
    () => listenerStatus.value === LayerEventListenerStatus.Attached,
  );

  /**
   * Enhanced layer event handler with error handling and debugging
   * @param e - Layer event data
   */
  const layerEventFn = <K extends T>(e: MapLayerEventType[K]): void => {
    try {
      if (props.on) props.on(e);

      // Remove listener if it's a one-time event
      if (props.once) removeListener();
    } catch (error) {
      logError('Error in layer event handler:', error, {
        event: props.event,
        layerId: layerId.value,
      });
      listenerStatus.value = LayerEventListenerStatus.Error;
    }
  };

  /**
   * Validates if the layer event listener can be attached
   * @returns boolean indicating if listener can be attached
   */
  function validateListenerAttachment(): boolean {
    const map = mapInstance.value;
    const currentLayerId = layerId.value;

    if (!map) return false;

    if (!currentLayerId) return false;

    if (!hasLayer(map, currentLayerId)) return false;

    return true;
  }

  /**
   * Attaches the layer event listener to the map with error handling
   */
  function attachListener(): void {
    if (!validateListenerAttachment()) return;

    const map = mapInstance.value!;
    const currentLayerId = layerId.value!;

    if (listenerStatus.value === LayerEventListenerStatus.Attached) return;

    try {
      map.on<T>(props.event as T, currentLayerId, layerEventFn);
      listenerStatus.value = LayerEventListenerStatus.Attached;
    } catch (error) {
      listenerStatus.value = LayerEventListenerStatus.Error;
      logError('Error attaching layer event listener:', error, {
        event: props.event,
        layerId: currentLayerId,
      });
    }
  }

  /**
   * Removes the layer event listener from the map with error handling
   */
  function removeListener(): void {
    const map = mapInstance.value;
    const currentLayerId = layerId.value;

    if (!map || !currentLayerId) return;

    if (listenerStatus.value === LayerEventListenerStatus.NotAttached) return;

    try {
      map.off<T>(props.event as T, currentLayerId, layerEventFn);
      listenerStatus.value = LayerEventListenerStatus.NotAttached;
    } catch (error) {
      logError('Error removing layer event listener:', error, {
        event: props.event,
        layerId: currentLayerId,
      });
      // Still mark as not attached even if removal failed
      listenerStatus.value = LayerEventListenerStatus.NotAttached;
    }
  }

  // Optimized watch for map and layer changes with reduced overhead
  let lastMapInstance: any = null;
  let lastLayerInstance: any = null;
  const stopEffect = watchEffect((onCleanUp) => {
    const map = mapInstance.value;
    const layer = layerInstance.value;

    // Only process if instances actually changed
    if (map === lastMapInstance && layer === lastLayerInstance) return;
    lastMapInstance = map;
    lastLayerInstance = layer;

    if (
      map &&
      layer &&
      listenerStatus.value === LayerEventListenerStatus.NotAttached
    ) {
      attachListener();
    } else if (
      (!map || !layer) &&
      listenerStatus.value === LayerEventListenerStatus.Attached
    ) {
      removeListener();
    }
    onCleanUp(removeListener);
  });

  // Cleanup function for removing listener and stopping watchers
  function cleanup(): void {
    stopEffect();
    removeListener();
  }

  // Automatic cleanup on component unmount
  onUnmounted(cleanup);

  return {
    removeListener,
    attachListener,
    isListenerAttached: isListenerAttached.value,
    listenerStatus: listenerStatus.value as Readonly<LayerEventListenerStatus>,
    layerId: layerId.value,
  };
}
