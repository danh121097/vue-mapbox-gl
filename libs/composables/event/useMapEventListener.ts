import { onUnmounted, unref, watchEffect, computed, ref } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, MapEventTypes } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { Map } from 'maplibre-gl';

/**
 * Event listener status enum for better state management
 */
export enum EventListenerStatus {
  NotAttached = 'not-attached',
  Attached = 'attached',
  Error = 'error',
}

interface MapEventListenerProps {
  map: MaybeRef<Nullable<Map>>;
  event: keyof MapEventTypes;
  on: <T extends keyof MapEventTypes>(e: MapEventTypes[T]) => void;
  debug?: boolean;
  once?: boolean;
}

interface MapEventListenerActions {
  removeListener: () => void;
  attachListener: () => void;
  isListenerAttached: boolean;
  listenerStatus: Readonly<EventListenerStatus>;
}

/**
 * Composable for managing MapLibre GL Map Event Listeners
 * Provides reactive event listener with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for the map event listener
 * @returns Enhanced actions and state for the event listener
 */
export function useMapEventListener(
  props: MapEventListenerProps,
): MapEventListenerActions {
  const { logError } = useLogger(props.debug ?? false);
  const listenerStatus = ref<EventListenerStatus>(
    EventListenerStatus.NotAttached,
  );

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isListenerAttached = computed(
    () => listenerStatus.value === EventListenerStatus.Attached,
  );

  /**
   * Enhanced event handler with error handling and debugging
   * @param e - Map event data
   */
  const mapEventFn = (e: MapEventTypes[keyof MapEventTypes]): void => {
    try {
      if (props.on) props.on(e);

      // Remove listener if it's a one-time event
      if (props.once) removeListener();
    } catch (error) {
      logError('Error in map event handler:', error, { event: props.event });
      listenerStatus.value = EventListenerStatus.Error;
    }
  };

  /**
   * Attaches the event listener to the map with error handling
   */
  function attachListener(): void {
    const map = mapInstance.value;

    if (!map) return;

    if (listenerStatus.value === EventListenerStatus.Attached) return;

    try {
      map.on(props.event, mapEventFn);
      listenerStatus.value = EventListenerStatus.Attached;
    } catch (error) {
      listenerStatus.value = EventListenerStatus.Error;
      logError('Error attaching map event listener:', error, {
        event: props.event,
      });
    }
  }

  /**
   * Removes the event listener from the map with error handling
   */
  function removeListener(): void {
    const map = mapInstance.value;

    if (!map) return;

    if (listenerStatus.value === EventListenerStatus.NotAttached) return;
    try {
      map.off(props.event, mapEventFn);
      listenerStatus.value = EventListenerStatus.NotAttached;
    } catch (error) {
      logError('Error removing map event listener:', error, {
        event: props.event,
      });
      // Still mark as not attached even if removal failed
      listenerStatus.value = EventListenerStatus.NotAttached;
    }
  }

  // Optimized watch for map changes with reduced overhead
  let lastMapInstance: any = null;
  const stopEffect = watchEffect((onCleanUp) => {
    const map = mapInstance.value;

    // Only process if map instance actually changed
    if (map === lastMapInstance) return;
    lastMapInstance = map;

    if (map && listenerStatus.value === EventListenerStatus.NotAttached) {
      attachListener();
    } else if (!map && listenerStatus.value === EventListenerStatus.Attached) {
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
    listenerStatus: listenerStatus.value as Readonly<EventListenerStatus>,
  };
}
