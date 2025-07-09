import { onUnmounted, unref, watchEffect, computed, ref } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, GeolocateEventTypes } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { GeolocateControl } from 'maplibre-gl';

/**
 * Event listener status enum for better state management
 */
export enum GeolocateEventListenerStatus {
  NotAttached = 'not-attached',
  Attached = 'attached',
  Error = 'error',
}

interface GeolocateEventListenerProps {
  geolocate: MaybeRef<Nullable<GeolocateControl>>;
  event: keyof GeolocateEventTypes;
  on: <T extends keyof GeolocateEventTypes>(e: GeolocateEventTypes[T]) => void;
  debug?: boolean;
  once?: boolean;
}

interface GeolocateEventListenerActions {
  removeListener: () => void;
  attachListener: () => void;
  isListenerAttached: boolean;
  listenerStatus: Readonly<GeolocateEventListenerStatus>;
}

/**
 * Composable for managing MapLibre GL Geolocate Control Event Listeners
 * Provides reactive event listener with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for the geolocate event listener
 * @returns Enhanced actions and state for the event listener
 */
export function useGeolocateEventListener(
  props: GeolocateEventListenerProps,
): GeolocateEventListenerActions {
  const { logWarn, logError } = useLogger(props.debug ?? false);
  const listenerStatus = ref<GeolocateEventListenerStatus>(
    GeolocateEventListenerStatus.NotAttached,
  );

  // Computed property for better reactivity and performance
  const geolocateInstance = computed(() => unref(props.geolocate));
  const isListenerAttached = computed(
    () => listenerStatus.value === GeolocateEventListenerStatus.Attached,
  );

  /**
   * Enhanced event handler with error handling and debugging
   * @param e - Geolocate event data
   */
  const geoEventFn = (
    e: GeolocateEventTypes[keyof GeolocateEventTypes],
  ): void => {
    try {
      if (props.on) props.on(e);

      // Remove listener if it's a one-time event
      if (props.once) removeListener();
    } catch (error) {
      logError('Error in geolocate event handler:', error, {
        event: props.event,
      });
      listenerStatus.value = GeolocateEventListenerStatus.Error;
    }
  };

  /**
   * Attaches the event listener to the geolocate control with error handling
   */
  function attachListener(): void {
    const geolocate = geolocateInstance.value;

    if (!geolocate) return;

    if (listenerStatus.value === GeolocateEventListenerStatus.Attached) {
      logWarn('Event listener already attached', { event: props.event });
      return;
    }

    try {
      geolocate.on(props.event, geoEventFn);
      listenerStatus.value = GeolocateEventListenerStatus.Attached;
    } catch (error) {
      listenerStatus.value = GeolocateEventListenerStatus.Error;
      logError('Error attaching geolocate event listener:', error, {
        event: props.event,
      });
    }
  }

  /**
   * Removes the event listener from the geolocate control with error handling
   */
  function removeListener(): void {
    const geolocate = geolocateInstance.value;

    if (!geolocate) return;

    if (listenerStatus.value === GeolocateEventListenerStatus.NotAttached)
      return;
    try {
      geolocate.off(props.event, geoEventFn);
      listenerStatus.value = GeolocateEventListenerStatus.NotAttached;
    } catch (error) {
      logError('Error removing geolocate event listener:', error, {
        event: props.event,
      });
      // Still mark as not attached even if removal failed
      listenerStatus.value = GeolocateEventListenerStatus.NotAttached;
    }
  }

  // Watch for geolocate control changes and manage listener lifecycle
  const stopEffect = watchEffect((onCleanUp) => {
    const geolocate = geolocateInstance.value;
    if (
      geolocate &&
      listenerStatus.value === GeolocateEventListenerStatus.NotAttached
    ) {
      attachListener();
    } else if (
      !geolocate &&
      listenerStatus.value === GeolocateEventListenerStatus.Attached
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

  // Cleanup on component unmount
  onUnmounted(cleanup);

  return {
    removeListener,
    attachListener,
    isListenerAttached: isListenerAttached.value,
    listenerStatus: listenerStatus.value,
  };
}
