import { shallowRef, watchEffect, onUnmounted, computed, unref } from 'vue';
import { GeolocateControl } from 'maplibre-gl';
import { useLogger } from '@libs/composables';
import type { ShallowRef, MaybeRef } from 'vue';
import type { Nullable } from '@libs/types';
import type {
  Map,
  GeolocateControlOptions,
  ControlPosition,
} from 'maplibre-gl';

interface GeolocateControlProps {
  map: MaybeRef<Nullable<Map>>;
  position?: ControlPosition;
  options?: GeolocateControlOptions;
  debug?: boolean;
}

interface GeolocateControlActions {
  geolocateControl: ShallowRef<Nullable<GeolocateControl>>;
  isControlAdded: ShallowRef<boolean>;
  removeControl: () => void;
  addControl: () => void;
  trigger: () => void;
}

/**
 * Composable for managing MapLibre GL Geolocate Control
 * Provides reactive geolocate control with error handling and lifecycle management
 *
 * @param props - Configuration options for the geolocate control
 * @returns Actions and state for the geolocate control
 */
export function useGeolocateControl({
  map,
  position = 'bottom-right',
  options = {},
  debug = false,
}: GeolocateControlProps): GeolocateControlActions {
  const { logError } = useLogger(debug);
  const geolocateControl = shallowRef<Nullable<GeolocateControl>>(null);
  const isControlAdded = shallowRef<boolean>(false);

  // Computed property for better reactivity and performance
  const mapInstance = computed(() => unref(map));

  /**
   * Safely adds the geolocate control to the map
   */
  function addControl(): void {
    const mapRef = mapInstance.value;

    if (!mapRef) return;

    if (geolocateControl.value && isControlAdded.value) return;

    try {
      if (!geolocateControl.value)
        geolocateControl.value = new GeolocateControl(options);

      mapRef.addControl(geolocateControl.value, position);
      isControlAdded.value = true;
    } catch (error) {
      logError('Error adding geolocate control to map:', error);
      // Reset state on error
      geolocateControl.value = null;
      isControlAdded.value = false;
    }
  }

  /**
   * Safely removes the geolocate control from the map
   */
  function removeControl(): void {
    const mapRef = mapInstance.value;

    if (!mapRef || !geolocateControl.value || !isControlAdded.value) return;

    try {
      mapRef.removeControl(geolocateControl.value);
      isControlAdded.value = false;
    } catch (error) {
      logError('Error removing geolocate control from map:', error);
      // Still reset state even if removal failed
      isControlAdded.value = false;
    } finally {
      geolocateControl.value = null;
    }
  }

  /**
   * Triggers the geolocate functionality programmatically
   */
  function trigger(): void {
    if (!geolocateControl.value) return;

    try {
      geolocateControl.value.trigger();
    } catch (error) {
      logError('Error triggering geolocate:', error);
    }
  }

  // Watch for map changes and manage control lifecycle
  const stopWatchEffect = watchEffect(() => {
    const mapRef = mapInstance.value;

    if (mapRef && !isControlAdded.value) {
      addControl();
    } else if (!mapRef && isControlAdded.value) {
      removeControl();
    }
  });

  // Cleanup function for removing control and stopping watchers
  function cleanup(): void {
    stopWatchEffect();
    removeControl();
  }

  // Automatic cleanup on component unmount
  onUnmounted(cleanup);

  return {
    geolocateControl,
    isControlAdded,
    removeControl,
    addControl,
    trigger,
  };
}
