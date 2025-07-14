import { watchEffect, ref, computed, unref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, Undefinedable } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { Map, FlyToOptions, LngLatLike, CameraOptions } from 'maplibre-gl';

/**
 * Fly animation status enum for better state management
 */
export enum FlyStatus {
  NotStarted = 'not-started',
  Flying = 'flying',
  Completed = 'completed',
  Error = 'error',
}

interface FlyToProps {
  map: MaybeRef<Nullable<Map>>;
  options?: FlyToOptions;
  debug?: boolean;
}

interface FlyToActions {
  flyTo: (options?: FlyToOptions) => Promise<void>;
  flyToCenter: (
    center: LngLatLike,
    options?: Omit<FlyToOptions, 'center'>,
  ) => Promise<void>;
  flyToZoom: (
    zoom: number,
    options?: Omit<FlyToOptions, 'zoom'>,
  ) => Promise<void>;
  flyToBearing: (
    bearing: number,
    options?: Omit<FlyToOptions, 'bearing'>,
  ) => Promise<void>;
  flyToPitch: (
    pitch: number,
    options?: Omit<FlyToOptions, 'pitch'>,
  ) => Promise<void>;
  stopFlying: () => void;
  getCurrentCamera: () => CameraOptions | null;
  flyStatus: Readonly<FlyStatus>;
  isFlying: boolean;
  cleanup: () => void;
}

/**
 * Composable for managing smooth map camera fly animations with enhanced error handling
 * Provides reactive fly-to animations with validation and debugging capabilities
 *
 * @param props - Configuration options for fly-to animations
 * @returns Enhanced actions and state for camera fly animations
 */
export function useFlyTo(props: FlyToProps): FlyToActions {
  const { logWarn, logError } = useLogger(props.debug ?? false);
  const flyOptions = ref<Undefinedable<FlyToOptions>>(props.options);
  const flyStatus = ref<FlyStatus>(FlyStatus.NotStarted);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isFlying = computed(() => flyStatus.value === FlyStatus.Flying);

  /**
   * Validates if fly operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateFlyOperation(): boolean {
    const map = mapInstance.value;
    if (!map) return false;
    return true;
  }

  /**
   * Validates fly-to options
   * @param options - Options to validate
   * @returns boolean indicating if options are valid
   */
  function validateFlyOptions(options: FlyToOptions): boolean {
    if (!options || typeof options !== 'object') return false;

    // Validate zoom range
    if (options.zoom !== undefined && (options.zoom < 0 || options.zoom > 24)) {
      logWarn('Warning: Zoom level should be between 0 and 24', {
        zoom: options.zoom,
      });
    }

    // Validate bearing range
    if (
      options.bearing !== undefined &&
      (options.bearing < -180 || options.bearing > 180)
    ) {
      logWarn('Warning: Bearing should be between -180 and 180 degrees', {
        bearing: options.bearing,
      });
    }

    // Validate pitch range
    if (
      options.pitch !== undefined &&
      (options.pitch < 0 || options.pitch > 60)
    ) {
      logWarn('Warning: Pitch should be between 0 and 60 degrees', {
        pitch: options.pitch,
      });
    }

    // Validate speed
    if (options.speed !== undefined && options.speed <= 0) {
      logWarn('Warning: Speed should be greater than 0', {
        speed: options.speed,
      });
    }

    // Validate curve
    if (options.curve !== undefined && options.curve < 0) {
      logWarn('Warning: Curve should be non-negative', {
        curve: options.curve,
      });
    }

    return true;
  }

  /**
   * Gets the current camera state
   * @returns Current camera options or null if not available
   */
  function getCurrentCamera(): CameraOptions | null {
    const map = mapInstance.value;
    if (!map) return null;

    try {
      return {
        center: map.getCenter(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      };
    } catch (error) {
      logError('Error getting current camera state:', error);
      return null;
    }
  }

  /**
   * Performs fly-to animation with enhanced error handling and validation
   * @param options - Fly-to options
   * @returns Promise that resolves when animation completes
   */
  function flyTo(options?: FlyToOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!validateFlyOperation()) {
        reject(new Error('Map instance not available'));
        return;
      }

      const finalOptions = options || flyOptions.value;
      if (!finalOptions) {
        reject(new Error('No fly options provided'));
        return;
      }

      if (!validateFlyOptions(finalOptions)) {
        flyStatus.value = FlyStatus.Error;
        reject(new Error('Invalid fly options'));
        return;
      }

      const map = mapInstance.value!;
      flyStatus.value = FlyStatus.Flying;

      try {
        // Store options for future use
        if (options) flyOptions.value = options;

        // Add event listeners for animation completion
        const onMoveEnd = () => {
          map.off('moveend', onMoveEnd);
          map.off('error', onError);
          flyStatus.value = FlyStatus.Completed;
          resolve();
        };

        const onError = (error: any) => {
          map.off('moveend', onMoveEnd);
          map.off('error', onError);
          flyStatus.value = FlyStatus.Error;
          reject(error);
        };

        map.once('moveend', onMoveEnd);
        map.once('error', onError);

        // Start the animation
        map.flyTo(finalOptions);
      } catch (error) {
        flyStatus.value = FlyStatus.Error;
        logError('Error starting fly-to animation:', error);
        reject(error);
      }
    });
  }

  /**
   * Flies to a specific center coordinate
   * @param center - Target center coordinate
   * @param options - Additional fly options (excluding center)
   * @returns Promise that resolves when animation completes
   */
  function flyToCenter(
    center: LngLatLike,
    options?: Omit<FlyToOptions, 'center'>,
  ): Promise<void> {
    return flyTo({ ...options, center });
  }

  /**
   * Flies to a specific zoom level
   * @param zoom - Target zoom level
   * @param options - Additional fly options (excluding zoom)
   * @returns Promise that resolves when animation completes
   */
  function flyToZoom(
    zoom: number,
    options?: Omit<FlyToOptions, 'zoom'>,
  ): Promise<void> {
    return flyTo({ ...options, zoom });
  }

  /**
   * Flies to a specific bearing
   * @param bearing - Target bearing in degrees
   * @param options - Additional fly options (excluding bearing)
   * @returns Promise that resolves when animation completes
   */
  function flyToBearing(
    bearing: number,
    options?: Omit<FlyToOptions, 'bearing'>,
  ): Promise<void> {
    return flyTo({ ...options, bearing });
  }

  /**
   * Flies to a specific pitch
   * @param pitch - Target pitch in degrees
   * @param options - Additional fly options (excluding pitch)
   * @returns Promise that resolves when animation completes
   */
  function flyToPitch(
    pitch: number,
    options?: Omit<FlyToOptions, 'pitch'>,
  ): Promise<void> {
    return flyTo({ ...options, pitch });
  }

  /**
   * Stops any ongoing flying animation
   */
  function stopFlying(): void {
    const map = mapInstance.value;
    if (!map) return;

    try {
      map.stop();
      flyStatus.value = FlyStatus.Completed;
    } catch (error) {
      logError('Error stopping flying animation:', error);
    }
  }

  // Watch for map and options changes with cleanup
  const stopWatchEffect = watchEffect(() => {
    const map = mapInstance.value;
    if (map && flyOptions.value && flyStatus.value === FlyStatus.NotStarted) {
      flyTo(flyOptions.value).catch((error) => {
        logError('Error in watchEffect flyTo:', error);
      });
    }
  });

  // Enhanced cleanup function
  function cleanup(): void {
    try {
      // Stop any ongoing animation
      stopFlying();

      // Stop watch effect
      stopWatchEffect();

      // Clear references
      flyOptions.value = undefined;
      flyStatus.value = FlyStatus.NotStarted;
    } catch (error) {
      logError('Error during useFlyTo cleanup:', error);
    }
  }

  // Automatic cleanup on unmount
  onUnmounted(cleanup);

  return {
    flyTo,
    flyToCenter,
    flyToZoom,
    flyToBearing,
    flyToPitch,
    stopFlying,
    getCurrentCamera,
    flyStatus: flyStatus.value as Readonly<FlyStatus>,
    isFlying: isFlying.value,
    cleanup, // Expose cleanup for manual use
  };
}
