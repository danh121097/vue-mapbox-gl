import { watchEffect, ref, computed, unref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, Undefinedable } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { Map, AnimationOptions, CameraOptions } from 'maplibre-gl';

/**
 * Rotation animation status enum for better state management
 */
export enum RotationStatus {
  NotStarted = 'not-started',
  Rotating = 'rotating',
  Completed = 'completed',
  Error = 'error',
}

interface RotateToProps {
  map: MaybeRef<Nullable<Map>>;
  bearing?: number;
  options?: AnimationOptions;
  debug?: boolean;
  autoRotate?: boolean;
}

interface RotateToActions {
  rotateTo: (bearing: number, options?: AnimationOptions) => Promise<void>;
  stopRotating: () => void;
  getCurrentBearing: () => number | null;
  getCurrentCamera: () => CameraOptions | null;
  validateBearing: (bearing: number) => boolean;
  rotationStatus: Readonly<RotationStatus>;
  isRotating: boolean;
}

interface ResetNorthProps {
  map: MaybeRef<Nullable<Map>>;
  options?: AnimationOptions;
  debug?: boolean;
  autoReset?: boolean;
}

interface ResetNorthActions {
  resetNorth: (options?: AnimationOptions) => Promise<void>;
  stopRotating: () => void;
  getCurrentBearing: () => number | null;
  getCurrentCamera: () => CameraOptions | null;
  rotationStatus: Readonly<RotationStatus>;
  isRotating: boolean;
}

interface ResetNorthPitchProps {
  map: MaybeRef<Nullable<Map>>;
  options?: AnimationOptions;
  debug?: boolean;
  autoReset?: boolean;
}

interface ResetNorthPitchActions {
  resetNorthPitch: (options?: AnimationOptions) => Promise<void>;
  stopRotating: () => void;
  getCurrentBearing: () => number | null;
  getCurrentPitch: () => number | null;
  getCurrentCamera: () => CameraOptions | null;
  rotationStatus: Readonly<RotationStatus>;
  isRotating: boolean;
}

interface SnapToNorthProps {
  map: MaybeRef<Nullable<Map>>;
  options?: AnimationOptions;
  debug?: boolean;
  autoSnap?: boolean;
}

interface SnapToNorthActions {
  snapToNorth: (options?: AnimationOptions) => Promise<void>;
  stopRotating: () => void;
  getCurrentBearing: () => number | null;
  getCurrentCamera: () => CameraOptions | null;
  rotationStatus: Readonly<RotationStatus>;
  isRotating: boolean;
}

/**
 * Composable for managing map rotation-to operations with enhanced error handling
 * Provides reactive rotation-to functionality with validation and debugging capabilities
 *
 * @param props - Configuration options for rotation-to functionality
 * @returns Enhanced actions and state for rotation-to operations
 */
export function useRotateTo(props: RotateToProps): RotateToActions;

/**
 * Legacy overload for backward compatibility
 * @deprecated Use the new props-based interface for better type safety and features
 */
export function useRotateTo(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions & { bearing: number },
): { rotateTo: (bearingVal: number, options?: AnimationOptions) => void };

export function useRotateTo(
  mapOrProps: MaybeRef<Nullable<Map>> | RotateToProps,
  legacyOptions?: AnimationOptions & { bearing: number },
):
  | RotateToActions
  | { rotateTo: (bearingVal: number, options?: AnimationOptions) => void } {
  // Handle legacy API for backward compatibility
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  const props: RotateToProps = isLegacyAPI
    ? {
        map: mapOrProps as MaybeRef<Nullable<Map>>,
        bearing: legacyOptions?.bearing,
        options: legacyOptions,
        debug: false,
        autoRotate: true,
      }
    : (mapOrProps as RotateToProps);

  const { logError, logWarn } = useLogger(props.debug ?? false);
  const bearing = ref<number | undefined>(props.bearing);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const rotationStatus = ref<RotationStatus>(RotationStatus.NotStarted);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isRotating = computed(
    () => rotationStatus.value === RotationStatus.Rotating,
  );

  /**
   * Validates if rotation operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateRotationOperation(): boolean {
    const map = mapInstance.value;
    if (!map) return false;
    return true;
  }

  /**
   * Validates bearing value for correctness
   * @param bearing - Bearing value to validate
   * @returns boolean indicating if bearing is valid
   */
  function validateBearing(bearing: number): boolean {
    if (typeof bearing !== 'number' || isNaN(bearing)) {
      return false;
    }

    // Normalize bearing to 0-360 range for validation
    const normalizedBearing = ((bearing % 360) + 360) % 360;
    if (normalizedBearing !== bearing && bearing < 0) {
      logWarn('Warning: Negative bearing will be normalized', {
        original: bearing,
        normalized: normalizedBearing,
      });
    }

    return true;
  }

  /**
   * Gets the current bearing
   * @returns Current bearing or null
   */
  function getCurrentBearing(): number | null {
    const map = mapInstance.value;
    if (!map) return null;

    try {
      return map.getBearing();
    } catch (error) {
      logError('Error getting current bearing:', error);
      return null;
    }
  }

  /**
   * Gets the current camera position
   * @returns Current camera options or null
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
      logError('Error getting current camera:', error);
      return null;
    }
  }

  /**
   * Performs rotate-to operation with enhanced error handling and validation
   * @param bearingVal - Target bearing value
   * @param options - Animation options
   * @returns Promise that resolves when animation completes
   */
  function rotateTo(
    bearingVal: number,
    options?: AnimationOptions,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!validateRotationOperation()) {
        reject(new Error('Map instance not available'));
        return;
      }

      if (!validateBearing(bearingVal)) {
        rotationStatus.value = RotationStatus.Error;
        reject(new Error('Invalid bearing value'));
        return;
      }

      const map = mapInstance.value!;
      const finalOptions = options || animationOptions.value;
      rotationStatus.value = RotationStatus.Rotating;

      try {
        // Store values for future use
        bearing.value = bearingVal;
        if (options) animationOptions.value = options;

        if (finalOptions) {
          // Add event listeners for animation completion
          const onRotateEnd = () => {
            map.off('rotateend', onRotateEnd);
            map.off('error', onError);
            rotationStatus.value = RotationStatus.Completed;
            resolve();
          };

          const onError = (error: any) => {
            map.off('rotateend', onRotateEnd);
            map.off('error', onError);
            rotationStatus.value = RotationStatus.Error;
            reject(error);
          };

          map.once('rotateend', onRotateEnd);
          map.once('error', onError);

          // Start the animation
          map.rotateTo(bearingVal, finalOptions);
        } else {
          // Immediate rotation without animation
          map.rotateTo(bearingVal);
          rotationStatus.value = RotationStatus.Completed;
          resolve();
        }
      } catch (error) {
        rotationStatus.value = RotationStatus.Error;
        logError('Error performing rotate-to operation:', error);
        reject(error);
      }
    });
  }

  /**
   * Stops any ongoing rotation animation
   */
  function stopRotating(): void {
    const map = mapInstance.value;
    if (!map) return;

    try {
      map.stop();
      rotationStatus.value = RotationStatus.Completed;
    } catch (error) {
      logError('Error stopping rotation animation:', error);
    }
  }

  // Legacy function for backward compatibility
  function legacyRotateTo(
    bearingVal: number,
    options?: AnimationOptions,
  ): void {
    rotateTo(bearingVal, options).catch((error) => {
      logError('Error in legacy rotateTo:', error);
    });
  }

  // Watch for map and options changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (
      map &&
      bearing.value !== undefined &&
      props.autoRotate !== false &&
      rotationStatus.value === RotationStatus.NotStarted
    ) {
      rotateTo(bearing.value, animationOptions.value).catch((error) => {
        logError('Error in watchEffect rotateTo:', error);
      });
    }
  });

  // Cleanup function
  function cleanup(): void {
    rotationStatus.value = RotationStatus.Completed;
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  // Return appropriate interface based on API version
  if (isLegacyAPI) {
    return { rotateTo: legacyRotateTo };
  }

  return {
    rotateTo,
    stopRotating,
    getCurrentBearing,
    getCurrentCamera,
    validateBearing,
    rotationStatus: rotationStatus.value as Readonly<RotationStatus>,
    isRotating: isRotating.value,
  };
}

/**
 * Composable for managing map reset-north operations with enhanced error handling
 * Provides reactive reset-north functionality with validation and debugging capabilities
 *
 * @param props - Configuration options for reset-north functionality
 * @returns Enhanced actions and state for reset-north operations
 */
export function useResetNorth(props: ResetNorthProps): ResetNorthActions;

/**
 * Legacy overload for backward compatibility
 * @deprecated Use the new props-based interface for better type safety and features
 */
export function useResetNorth(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions,
): { resetNorth: (options?: AnimationOptions) => void };

export function useResetNorth(
  mapOrProps: MaybeRef<Nullable<Map>> | ResetNorthProps,
  legacyOptions?: AnimationOptions,
): ResetNorthActions | { resetNorth: (options?: AnimationOptions) => void } {
  // Handle legacy API for backward compatibility
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  const props: ResetNorthProps = isLegacyAPI
    ? {
        map: mapOrProps as MaybeRef<Nullable<Map>>,
        options: legacyOptions,
        debug: false,
        autoReset: true,
      }
    : (mapOrProps as ResetNorthProps);

  const { logError } = useLogger(props.debug ?? false);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const rotationStatus = ref<RotationStatus>(RotationStatus.NotStarted);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isRotating = computed(
    () => rotationStatus.value === RotationStatus.Rotating,
  );

  /**
   * Validates if rotation operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateRotationOperation(): boolean {
    const map = mapInstance.value;
    if (!map) return false;
    return true;
  }

  /**
   * Gets the current bearing
   * @returns Current bearing or null
   */
  function getCurrentBearing(): number | null {
    const map = mapInstance.value;
    if (!map) return null;

    try {
      return map.getBearing();
    } catch (error) {
      logError('Error getting current bearing:', error);
      return null;
    }
  }

  /**
   * Gets the current camera position
   * @returns Current camera options or null
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
      logError('Error getting current camera:', error);
      return null;
    }
  }

  /**
   * Performs reset-north operation with enhanced error handling and validation
   * @param options - Animation options
   * @returns Promise that resolves when animation completes
   */
  function resetNorth(options?: AnimationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!validateRotationOperation()) {
        reject(new Error('Map instance not available'));
        return;
      }

      const map = mapInstance.value!;
      const finalOptions = options || animationOptions.value;
      rotationStatus.value = RotationStatus.Rotating;

      try {
        // Store options for future use
        if (options) animationOptions.value = options;

        if (finalOptions) {
          // Add event listeners for animation completion
          const onRotateEnd = () => {
            map.off('rotateend', onRotateEnd);
            map.off('error', onError);
            rotationStatus.value = RotationStatus.Completed;
            resolve();
          };

          const onError = (error: any) => {
            map.off('rotateend', onRotateEnd);
            map.off('error', onError);
            rotationStatus.value = RotationStatus.Error;
            reject(error);
          };

          map.once('rotateend', onRotateEnd);
          map.once('error', onError);

          // Start the animation
          map.resetNorth(finalOptions);
        } else {
          // Immediate reset without animation
          map.resetNorth();
          rotationStatus.value = RotationStatus.Completed;
          resolve();
        }
      } catch (error) {
        rotationStatus.value = RotationStatus.Error;
        logError('Error performing reset-north operation:', error);
        reject(error);
      }
    });
  }

  /**
   * Stops any ongoing rotation animation
   */
  function stopRotating(): void {
    const map = mapInstance.value;
    if (!map) return;

    try {
      map.stop();
      rotationStatus.value = RotationStatus.Completed;
    } catch (error) {
      logError('Error stopping rotation animation:', error);
    }
  }

  // Legacy function for backward compatibility
  function legacyResetNorth(options?: AnimationOptions): void {
    resetNorth(options).catch((error) => {
      logError('Error in legacy resetNorth:', error);
    });
  }

  // Watch for map and options changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (
      map &&
      props.autoReset !== false &&
      rotationStatus.value === RotationStatus.NotStarted
    ) {
      resetNorth(animationOptions.value).catch((error) => {
        logError('Error in watchEffect resetNorth:', error);
      });
    }
  });

  // Cleanup function
  function cleanup(): void {
    rotationStatus.value = RotationStatus.Completed;
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  // Return appropriate interface based on API version
  if (isLegacyAPI) {
    return { resetNorth: legacyResetNorth };
  }

  return {
    resetNorth,
    stopRotating,
    getCurrentBearing,
    getCurrentCamera,
    rotationStatus: rotationStatus.value as Readonly<RotationStatus>,
    isRotating: isRotating.value,
  };
}

/**
 * Enhanced useResetNorthPitch with error handling and debugging
 */
export function useResetNorthPitch(
  props: ResetNorthPitchProps,
): ResetNorthPitchActions;
export function useResetNorthPitch(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions,
): { resetNorthPitch: (options?: AnimationOptions) => void };
export function useResetNorthPitch(
  mapOrProps: MaybeRef<Nullable<Map>> | ResetNorthPitchProps,
  legacyOptions?: AnimationOptions,
):
  | ResetNorthPitchActions
  | { resetNorthPitch: (options?: AnimationOptions) => void } {
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  const props: ResetNorthPitchProps = isLegacyAPI
    ? {
        map: mapOrProps as MaybeRef<Nullable<Map>>,
        options: legacyOptions,
        debug: false,
        autoReset: true,
      }
    : (mapOrProps as ResetNorthPitchProps);

  const { logError } = useLogger(props.debug ?? false);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const rotationStatus = ref<RotationStatus>(RotationStatus.NotStarted);
  const mapInstance = computed(() => unref(props.map));
  const isRotating = computed(
    () => rotationStatus.value === RotationStatus.Rotating,
  );

  function getCurrentBearing(): number | null {
    try {
      return mapInstance.value?.getBearing() ?? null;
    } catch {
      logError('Error getting current bearing');
      return null;
    }
  }

  function getCurrentPitch(): number | null {
    try {
      return mapInstance.value?.getPitch() ?? null;
    } catch {
      logError('Error getting current pitch');
      return null;
    }
  }

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
    } catch {
      logError('Error getting current camera');
      return null;
    }
  }

  function resetNorthPitch(options?: AnimationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const map = mapInstance.value;
      if (!map) {
        reject(new Error('Map instance not available'));
        return;
      }

      try {
        rotationStatus.value = RotationStatus.Rotating;
        const finalOptions = options || animationOptions.value;

        if (finalOptions) {
          const onComplete = () => {
            rotationStatus.value = RotationStatus.Completed;
            resolve();
          };
          map.once('moveend', onComplete);
          map.resetNorthPitch(finalOptions);
        } else {
          map.resetNorthPitch();
          rotationStatus.value = RotationStatus.Completed;
          resolve();
        }
      } catch (error) {
        rotationStatus.value = RotationStatus.Error;
        logError('Error performing reset-north-pitch operation:', error);
        reject(error);
      }
    });
  }

  function stopRotating(): void {
    try {
      mapInstance.value?.stop();
      rotationStatus.value = RotationStatus.Completed;
    } catch {
      logError('Error stopping rotation animation');
    }
  }

  onUnmounted(() => {
    rotationStatus.value = RotationStatus.Completed;
  });

  if (isLegacyAPI) {
    return {
      resetNorthPitch: (options?: AnimationOptions) => {
        resetNorthPitch(options).catch(() => {
          logError('Error in legacy resetNorthPitch');
        });
      },
    };
  }

  return {
    resetNorthPitch,
    stopRotating,
    getCurrentBearing,
    getCurrentPitch,
    getCurrentCamera,
    rotationStatus: rotationStatus.value as Readonly<RotationStatus>,
    isRotating: isRotating.value,
  };
}

/**
 * Enhanced useSnapToNorth with error handling and debugging
 */
export function useSnapToNorth(props: SnapToNorthProps): SnapToNorthActions;
export function useSnapToNorth(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions,
): { snapToNorth: (options?: AnimationOptions) => void };
export function useSnapToNorth(
  mapOrProps: MaybeRef<Nullable<Map>> | SnapToNorthProps,
  legacyOptions?: AnimationOptions,
): SnapToNorthActions | { snapToNorth: (options?: AnimationOptions) => void } {
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  const props: SnapToNorthProps = isLegacyAPI
    ? {
        map: mapOrProps as MaybeRef<Nullable<Map>>,
        options: legacyOptions,
        debug: false,
        autoSnap: true,
      }
    : (mapOrProps as SnapToNorthProps);

  const { logError } = useLogger(props.debug ?? false);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const rotationStatus = ref<RotationStatus>(RotationStatus.NotStarted);
  const mapInstance = computed(() => unref(props.map));
  const isRotating = computed(
    () => rotationStatus.value === RotationStatus.Rotating,
  );

  function getCurrentBearing(): number | null {
    try {
      return mapInstance.value?.getBearing() ?? null;
    } catch {
      logError('Error getting current bearing');
      return null;
    }
  }

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
    } catch {
      logError('Error getting current camera');
      return null;
    }
  }

  function snapToNorth(options?: AnimationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const map = mapInstance.value;
      if (!map) {
        reject(new Error('Map instance not available'));
        return;
      }

      try {
        rotationStatus.value = RotationStatus.Rotating;
        const finalOptions = options || animationOptions.value;

        if (finalOptions) {
          const onComplete = () => {
            rotationStatus.value = RotationStatus.Completed;
            resolve();
          };
          map.once('moveend', onComplete);
          map.snapToNorth(finalOptions);
        } else {
          map.snapToNorth();
          rotationStatus.value = RotationStatus.Completed;
          resolve();
        }
      } catch (error) {
        rotationStatus.value = RotationStatus.Error;
        logError('Error performing snap-to-north operation:', error);
        reject(error);
      }
    });
  }

  function stopRotating(): void {
    try {
      mapInstance.value?.stop();
      rotationStatus.value = RotationStatus.Completed;
    } catch {
      logError('Error stopping rotation animation');
    }
  }

  onUnmounted(() => {
    rotationStatus.value = RotationStatus.Completed;
  });

  if (isLegacyAPI) {
    return {
      snapToNorth: (options?: AnimationOptions) => {
        snapToNorth(options).catch(() => {
          logError('Error in legacy snapToNorth');
        });
      },
    };
  }

  return {
    snapToNorth,
    stopRotating,
    getCurrentBearing,
    getCurrentCamera,
    rotationStatus: rotationStatus.value as Readonly<RotationStatus>,
    isRotating: isRotating.value,
  };
}
