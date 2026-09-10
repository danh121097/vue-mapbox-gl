import { watch, onUnmounted, unref, computed, ref } from 'vue';
import { useLogger } from '@libs/composables';
import type { ComputedRef, MaybeRef } from 'vue';
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
  isMapLoaded: ComputedRef<boolean>;
  loadStatus: ComputedRef<MapReloadEventStatus>;
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
  // Whether `styledataloading` has been seen since the last `style.load`. See
  // `handleStyleLoadEvent` for what it discriminates.
  let sawStyleUnload = false;
  // Pending rebuild after an in-place style diff, so teardown can cancel it.
  let rebuildTimer: Nullable<ReturnType<typeof setTimeout>> = null;

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isMapLoaded = computed(
    () => loadStatus.value === MapReloadEventStatus.Loaded,
  );

  // Initialize load status based on map state
  const initialMap = mapInstance.value;
  // Pending initial-load timer, so an unmount within the same tick can cancel
  // it instead of letting `onLoad` build objects nothing will ever remove.
  let initialLoadTimer: Nullable<ReturnType<typeof setTimeout>> = null;
  if (initialMap?.isStyleLoaded()) {
    loadStatus.value = MapReloadEventStatus.Loaded;
    if (props.autoTriggerOnMount !== false) {
      // Trigger initial load callback if map is already loaded
      initialLoadTimer = setTimeout(() => {
        initialLoadTimer = null;
        forceLoad();
      }, 0);
    }
  }

  /**
   * Applies an unload for a specific map. Takes the map as an argument because
   * a replaced map must be unloaded after the ref already points at its
   * successor.
   */
  function applyUnload(map: Nullable<Map>): void {
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
   * MapLibre listener for `styledataloading`. Ignores the event argument.
   */
  function handleUnloadEvent(): void {
    sawStyleUnload = true;
    applyUnload(mapInstance.value);
  }

  /**
   * Applies a load event.
   *
   * MapLibre calls listeners with the event object as their first argument, so
   * this must never be registered directly — a listener bound here would
   * receive a truthy event as `isForced` and defeat the "already loaded" guard
   * on every `styledata` dispatch.
   *
   * @param isForced - Whether to re-run the callback even when already loaded
   */
  function applyLoad(isForced: boolean): void {
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
   * MapLibre listener. Ignores the event argument and never forces.
   */
  function handleLoadEvent(): void {
    applyLoad(false);
  }

  /**
   * Listener for `style.load`, which is the only signal an in-place style swap
   * gives.
   *
   * `map.setStyle(next)` defaults to `diff: true`, and that path does not
   * reload the style: it diffs the serialized current style — which includes
   * every source and layer this library added at runtime — against the new
   * one and runs `removeSource`/`removeLayer` for everything the new style
   * does not itself declare. So the map is emptied of this composable's
   * objects while no `styledataloading` fires, `loadStatus` still reads
   * `Loaded`, and the `styledata` that follows is swallowed by the
   * already-loaded guard. The layers were simply gone until the next full
   * reload.
   *
   * A full reload fires `style.load` too, right after the `styledata` that
   * already rebuilt everything. `styledataloading` is what separates the two
   * cases: it precedes a reload and never precedes a diff.
   */
  function handleStyleLoadEvent(): void {
    if (sawStyleUnload) {
      // A reload: `styledataloading` -> `styledata` already ran the cycle.
      sawStyleUnload = false;
      return;
    }

    // Release synchronously, so every subscriber on this map has let go
    // before any of them rebuilds — a layer added back before its source
    // would fail the source-exists check and never be created.
    applyUnload(mapInstance.value);

    if (rebuildTimer) clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => {
      rebuildTimer = null;
      applyLoad(false);
    }, 0);
  }

  /**
   * Forces a load event to be triggered
   */
  function forceLoad(): void {
    applyLoad(true);
  }

  /**
   * Forces an unload event to be triggered
   */
  function forceUnload(): void {
    handleUnloadEvent();
  }

  /**
   * Detaches this composable's listeners from a specific map instance.
   */
  function detachListeners(map: Map): void {
    try {
      map.off('styledata', handleLoadEvent);
      map.off('styledataloading', handleUnloadEvent);
      map.off('style.load', handleStyleLoadEvent);
      map.off('load', handleLoadEvent);
    } catch (error) {
      logError('Error clearing map reload event listeners:', error);
    }
  }

  /**
   * Clears all event listeners from the current map
   */
  function clear(): void {
    const map = mapInstance.value;

    if (!map) return;

    detachListeners(map);
  }

  // Watch for map changes and manage event listener lifecycle.
  // A `watch` on the map instance, not a `watchEffect`: the body reads
  // `loadStatus` and the load handler writes it, so an effect would have been
  // its own dependency and re-registered listeners on every status change.
  const stopEffect = watch(
    mapInstance,
    (map, previousMap, onCleanUp) => {
      // A replacement map carries none of the previous map's load state.
      // Unload the outgoing map first so consumers release the objects they
      // built on it — otherwise they still hold them and skip building on the
      // new map — then reset so the branches below treat the newcomer as
      // fresh; without that a map arriving already style-loaded never gets
      // its `onLoad`.
      if (previousMap && previousMap !== map) {
        applyUnload(previousMap);
        loadStatus.value = MapReloadEventStatus.NotLoaded;
      }

      if (!map) return;

      try {
        // Set up event listeners
        if (
          loadStatus.value === MapReloadEventStatus.NotLoaded &&
          !map.isStyleLoaded()
        ) {
          map.on('load', handleLoadEvent);
        } else if (
          map.isStyleLoaded() &&
          loadStatus.value !== MapReloadEventStatus.Loaded
        ) {
          // Map is already loaded, trigger load event
          handleLoadEvent();
        }

        map.on('styledata', handleLoadEvent);
        map.on('styledataloading', handleUnloadEvent);
        map.on('style.load', handleStyleLoadEvent);
      } catch (error) {
        loadStatus.value = MapReloadEventStatus.Error;
        logError('Error setting up map reload event listeners:', error);

        if (props.callbacks.onError) {
          props.callbacks.onError(error);
        }
      }

      onCleanUp(() => detachListeners(map));
    },
    { immediate: true },
  );

  // Cleanup function for removing listeners and stopping watchers
  function cleanup(): void {
    if (initialLoadTimer) {
      clearTimeout(initialLoadTimer);
      initialLoadTimer = null;
    }
    if (rebuildTimer) {
      clearTimeout(rebuildTimer);
      rebuildTimer = null;
    }
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
    isMapLoaded,
    loadStatus: computed(() => loadStatus.value),
  };
}
