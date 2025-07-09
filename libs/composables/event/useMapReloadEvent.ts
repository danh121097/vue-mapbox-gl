import { watchEffect, onUnmounted, unref, computed, ref } from 'vue';
import { useLogger } from '@libs/composables';
import type { MaybeRef } from 'vue';
import type { Nullable } from '@libs/types';
import type { Map } from 'maplibre-gl';

/**
 * Map reload event status enum for better state management
 */
export enum MapReloadEventStatus {
  NotLoaded = 'not-loaded',
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

interface MapReloadEventCallbacks {
  onLoad: (map: Map) => void;
  onUnload?: (map: Map) => void;
  onError?: (error: any) => void;
}

interface MapReloadEventProps {
  map: MaybeRef<Nullable<Map>>;
  callbacks: MapReloadEventCallbacks;
  debug?: boolean;
  autoTriggerOnMount?: boolean;
}

interface MapReloadEventActions {
  clear: () => void;
  forceLoad: () => void;
  forceUnload: () => void;
  isMapLoaded: boolean;
  loadStatus: Readonly<MapReloadEventStatus>;
}

/**
 * Composable for managing MapLibre GL Map Reload Events
 * Provides reactive map load/unload event handling with enhanced error handling and state management
 *
 * @param props - Configuration options for the map reload event handler
 * @returns Enhanced actions and state for map reload events
 */
export function useMapReloadEvent(
  props: MapReloadEventProps,
): MapReloadEventActions;

/**
 * Legacy overload for backward compatibility
 * @deprecated Use the new props-based interface for better type safety and features
 */
export function useMapReloadEvent(
  mapRef: MaybeRef<Nullable<Map>>,
  callbacks: {
    unLoad?: (map: Map) => void;
    onLoad: (map: Map) => void;
  },
): { clear: () => void };

export function useMapReloadEvent(
  mapRefOrProps: MaybeRef<Nullable<Map>> | MapReloadEventProps,
  legacyCallbacks?: {
    unLoad?: (map: Map) => void;
    onLoad: (map: Map) => void;
  },
): MapReloadEventActions | { clear: () => void } {
  // Handle legacy API for backward compatibility
  const isLegacyAPI = legacyCallbacks !== undefined;
  const props: MapReloadEventProps = isLegacyAPI
    ? {
        map: mapRefOrProps as MaybeRef<Nullable<Map>>,
        callbacks: {
          onLoad: legacyCallbacks!.onLoad,
          onUnload: legacyCallbacks!.unLoad,
        },
        debug: false,
        autoTriggerOnMount: true,
      }
    : (mapRefOrProps as MapReloadEventProps);

  const { logError } = useLogger(props.debug ?? false);
  const loadStatus = ref<MapReloadEventStatus>(MapReloadEventStatus.NotLoaded);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isMapLoaded = computed(
    () => loadStatus.value === MapReloadEventStatus.Loaded,
  );

  // Initialize load status based on map state
  const initialMap = mapInstance.value;
  if (initialMap?._loaded) {
    loadStatus.value = MapReloadEventStatus.Loaded;
    if (props.autoTriggerOnMount !== false) {
      // Trigger initial load callback if map is already loaded
      setTimeout(() => forceLoad(), 0);
    }
  }

  /**
   * Enhanced unload event handler with error handling and debugging
   */
  function handleUnloadEvent(): void {
    const map = mapInstance.value;

    if (loadStatus.value === MapReloadEventStatus.NotLoaded) return;

    try {
      loadStatus.value = MapReloadEventStatus.NotLoaded;

      if (props.callbacks.onUnload && map) props.callbacks.onUnload(map);
    } catch (error) {
      loadStatus.value = MapReloadEventStatus.Error;
      logError('Error in map unload handler:', error);

      if (props.callbacks.onError) {
        props.callbacks.onError(error);
      }
    }
  }

  /**
   * Enhanced load event handler with error handling and debugging
   * @param isForced - Whether this is a forced load event
   */
  function handleLoadEvent(isForced: boolean = false): void {
    const map = mapInstance.value;

    if (!map) return;

    if (loadStatus.value === MapReloadEventStatus.Loaded && !isForced) return;

    try {
      loadStatus.value = MapReloadEventStatus.Loaded;

      props.callbacks.onLoad(map);
    } catch (error) {
      loadStatus.value = MapReloadEventStatus.Error;
      logError('Error in map load handler:', error);

      if (props.callbacks.onError) {
        props.callbacks.onError(error);
      }
    }
  }

  /**
   * Forces a load event to be triggered
   */
  function forceLoad(): void {
    handleLoadEvent(true);
  }

  /**
   * Forces an unload event to be triggered
   */
  function forceUnload(): void {
    handleUnloadEvent();
  }

  /**
   * Clears all event listeners from the map with enhanced error handling
   */
  function clear(): void {
    const map = mapInstance.value;

    if (!map) return;

    try {
      map.off('styledata', handleLoadEvent);
      map.off('styledataloading', handleUnloadEvent);
      map.off('load', handleLoadEvent);
    } catch (error) {
      logError('Error clearing map reload event listeners:', error);
    }
  }

  // Watch for map changes and manage event listener lifecycle
  const stopEffect = watchEffect((onCleanUp) => {
    const map = mapInstance.value;

    if (!map) return;

    try {
      // Set up event listeners
      if (loadStatus.value === MapReloadEventStatus.NotLoaded && !map._loaded) {
        map.on('load', handleLoadEvent);
      } else if (
        map._loaded &&
        loadStatus.value !== MapReloadEventStatus.Loaded
      ) {
        // Map is already loaded, trigger load event
        handleLoadEvent();
      }

      map.on('styledata', handleLoadEvent);
      map.on('styledataloading', handleUnloadEvent);
    } catch (error) {
      loadStatus.value = MapReloadEventStatus.Error;
      logError('Error setting up map reload event listeners:', error);

      if (props.callbacks.onError) {
        props.callbacks.onError(error);
      }
    }

    onCleanUp(clear);
  });

  // Cleanup function for removing listeners and stopping watchers
  function cleanup(): void {
    handleUnloadEvent();
    stopEffect();
    clear();
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  // Return appropriate interface based on API version
  if (isLegacyAPI) {
    return { clear };
  }

  return {
    clear,
    forceLoad,
    forceUnload,
    isMapLoaded: isMapLoaded.value,
    loadStatus: loadStatus.value,
  };
}
