import { watchEffect, ref, computed, unref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, Undefinedable } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { Map, AnimationOptions, CameraOptions } from 'maplibre-gl';

/**
 * Zoom animation status enum for better state management
 */
export enum ZoomStatus {
  NotStarted = 'not-started',
  Zooming = 'zooming',
  Completed = 'completed',
  Error = 'error',
}

interface ZoomToProps {
  map: MaybeRef<Nullable<Map>>;
  zoom?: number;
  options?: AnimationOptions;
  debug?: boolean;
  autoZoom?: boolean;
}

interface ZoomToActions {
  zoomTo: (zoom: number, options?: AnimationOptions) => Promise<void>;
  stopZooming: () => void;
  getCurrentZoom: () => number | null;
  getCurrentCamera: () => CameraOptions | null;
  validateZoomLevel: (zoom: number) => boolean;
  zoomStatus: Readonly<ZoomStatus>;
  isZooming: boolean;
}

interface ZoomInProps {
  map: MaybeRef<Nullable<Map>>;
  options?: AnimationOptions;
  debug?: boolean;
  autoZoom?: boolean;
}

interface ZoomInActions {
  zoomIn: (options?: AnimationOptions) => Promise<void>;
  stopZooming: () => void;
  getCurrentZoom: () => number | null;
  getCurrentCamera: () => CameraOptions | null;
  zoomStatus: Readonly<ZoomStatus>;
  isZooming: boolean;
}

interface ZoomOutProps {
  map: MaybeRef<Nullable<Map>>;
  options?: AnimationOptions;
  debug?: boolean;
  autoZoom?: boolean;
}

interface ZoomOutActions {
  zoomOut: (options?: AnimationOptions) => Promise<void>;
  stopZooming: () => void;
  getCurrentZoom: () => number | null;
  getCurrentCamera: () => CameraOptions | null;
  zoomStatus: Readonly<ZoomStatus>;
  isZooming: boolean;
}

/**
 * Composable for managing map zoom-to operations with enhanced error handling
 * Provides reactive zoom-to functionality with validation and debugging capabilities
 *
 * @param props - Configuration options for zoom-to functionality
 * @returns Enhanced actions and state for zoom-to operations
 */
export function useZoomTo(props: ZoomToProps): ZoomToActions;

/**
 * Legacy overload for backward compatibility
 * @deprecated Use the new props-based interface for better type safety and features
 */
export function useZoomTo(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions & { zoom: number },
): { zoomTo: (zoomVal: number, options?: AnimationOptions) => void };

export function useZoomTo(
  mapOrProps: MaybeRef<Nullable<Map>> | ZoomToProps,
  legacyOptions?: AnimationOptions & { zoom: number },
):
  | ZoomToActions
  | { zoomTo: (zoomVal: number, options?: AnimationOptions) => void } {
  // Handle legacy API for backward compatibility
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  const props: ZoomToProps = isLegacyAPI
    ? {
        map: mapOrProps as MaybeRef<Nullable<Map>>,
        zoom: legacyOptions?.zoom,
        options: legacyOptions,
        debug: false,
        autoZoom: true,
      }
    : (mapOrProps as ZoomToProps);

  const { logError } = useLogger(props.debug ?? false);
  const zoom = ref<number | undefined>(props.zoom);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const zoomStatus = ref<ZoomStatus>(ZoomStatus.NotStarted);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isZooming = computed(() => zoomStatus.value === ZoomStatus.Zooming);

  /**
   * Validates if zoom operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateZoomOperation(): boolean {
    const map = mapInstance.value;
    if (!map) {
      return false;
    }
    return true;
  }

  /**
   * Validates zoom level for correctness
   * @param zoom - Zoom level to validate
   * @returns boolean indicating if zoom level is valid
   */
  function validateZoomLevel(zoom: number): boolean {
    if (typeof zoom !== 'number' || isNaN(zoom)) {
      return false;
    }

    if (zoom < 0 || zoom > 24) {
      return false;
    }

    return true;
  }

  /**
   * Gets the current zoom level
   * @returns Current zoom level or null
   */
  function getCurrentZoom(): number | null {
    const map = mapInstance.value;
    if (!map) {
      return null;
    }

    try {
      return map.getZoom();
    } catch (error) {
      logError('Error getting current zoom:', error);
      return null;
    }
  }

  /**
   * Gets the current camera position
   * @returns Current camera options or null
   */
  function getCurrentCamera(): CameraOptions | null {
    const map = mapInstance.value;
    if (!map) {
      return null;
    }

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
   * Performs zoom-to operation with enhanced error handling and validation
   * @param zoomVal - Target zoom level
   * @param options - Animation options
   * @returns Promise that resolves when animation completes
   */
  function zoomTo(zoomVal: number, options?: AnimationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!validateZoomOperation()) {
        reject(new Error('Map instance not available'));
        return;
      }

      if (!validateZoomLevel(zoomVal)) {
        zoomStatus.value = ZoomStatus.Error;
        reject(new Error('Invalid zoom level'));
        return;
      }

      const map = mapInstance.value!;
      const finalOptions = options || animationOptions.value;
      zoomStatus.value = ZoomStatus.Zooming;

      try {
        // Store values for future use
        zoom.value = zoomVal;
        if (options) animationOptions.value = options;

        if (finalOptions) {
          // Add event listeners for animation completion
          const onZoomEnd = () => {
            map.off('zoomend', onZoomEnd);
            map.off('error', onError);
            zoomStatus.value = ZoomStatus.Completed;
            resolve();
          };

          const onError = (error: any) => {
            map.off('zoomend', onZoomEnd);
            map.off('error', onError);
            zoomStatus.value = ZoomStatus.Error;
            reject(error);
          };

          map.once('zoomend', onZoomEnd);
          map.once('error', onError);

          // Start the animation
          map.zoomTo(zoomVal, finalOptions);
        } else {
          // Immediate zoom without animation
          map.zoomTo(zoomVal);
          zoomStatus.value = ZoomStatus.Completed;
          resolve();
        }
      } catch (error) {
        zoomStatus.value = ZoomStatus.Error;
        logError('Error performing zoom-to operation:', error);
        reject(error);
      }
    });
  }

  /**
   * Stops any ongoing zoom animation
   */
  function stopZooming(): void {
    const map = mapInstance.value;
    if (!map) {
      return;
    }

    try {
      map.stop();
      zoomStatus.value = ZoomStatus.Completed;
    } catch (error) {
      logError('Error stopping zoom animation:', error);
    }
  }

  // Legacy function for backward compatibility
  function legacyZoomTo(zoomVal: number, options?: AnimationOptions): void {
    zoomTo(zoomVal, options).catch((error) => {
      logError('Error in legacy zoomTo:', error);
    });
  }

  // Watch for map and options changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (
      map &&
      zoom.value !== undefined &&
      props.autoZoom !== false &&
      zoomStatus.value === ZoomStatus.NotStarted
    ) {
      zoomTo(zoom.value, animationOptions.value).catch((error) => {
        logError('Error in watchEffect zoomTo:', error);
      });
    }
  });

  // Cleanup function
  function cleanup(): void {
    zoomStatus.value = ZoomStatus.Completed;
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  // Return appropriate interface based on API version
  if (isLegacyAPI) {
    return { zoomTo: legacyZoomTo };
  }

  return {
    zoomTo,
    stopZooming,
    getCurrentZoom,
    getCurrentCamera,
    validateZoomLevel,
    zoomStatus: zoomStatus.value as Readonly<ZoomStatus>,
    isZooming: isZooming.value,
  };
}

/**
 * Composable for managing map zoom-in operations with enhanced error handling
 * Provides reactive zoom-in functionality with validation and debugging capabilities
 *
 * @param props - Configuration options for zoom-in functionality
 * @returns Enhanced actions and state for zoom-in operations
 */
export function useZoomIn(props: ZoomInProps): ZoomInActions;

/**
 * Legacy overload for backward compatibility
 * @deprecated Use the new props-based interface for better type safety and features
 */
export function useZoomIn(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions,
): { zoomIn: (options?: AnimationOptions) => void };

export function useZoomIn(
  mapOrProps: MaybeRef<Nullable<Map>> | ZoomInProps,
  legacyOptions?: AnimationOptions,
): ZoomInActions | { zoomIn: (options?: AnimationOptions) => void } {
  // Handle legacy API for backward compatibility
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  const props: ZoomInProps = isLegacyAPI
    ? {
        map: mapOrProps as MaybeRef<Nullable<Map>>,
        options: legacyOptions,
        debug: false,
        autoZoom: true,
      }
    : (mapOrProps as ZoomInProps);

  const { logError } = useLogger(props.debug ?? false);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const zoomStatus = ref<ZoomStatus>(ZoomStatus.NotStarted);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isZooming = computed(() => zoomStatus.value === ZoomStatus.Zooming);

  /**
   * Validates if zoom operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateZoomOperation(): boolean {
    const map = mapInstance.value;
    if (!map) {
      return false;
    }
    return true;
  }

  /**
   * Gets the current zoom level
   * @returns Current zoom level or null
   */
  function getCurrentZoom(): number | null {
    const map = mapInstance.value;
    if (!map) {
      return null;
    }

    try {
      return map.getZoom();
    } catch (error) {
      logError('Error getting current zoom:', error);
      return null;
    }
  }

  /**
   * Gets the current camera position
   * @returns Current camera options or null
   */
  function getCurrentCamera(): CameraOptions | null {
    const map = mapInstance.value;
    if (!map) {
      return null;
    }

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
   * Performs zoom-in operation with enhanced error handling and validation
   * @param options - Animation options
   * @returns Promise that resolves when animation completes
   */
  function zoomIn(options?: AnimationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!validateZoomOperation()) {
        reject(new Error('Map instance not available'));
        return;
      }

      const map = mapInstance.value!;
      const finalOptions = options || animationOptions.value;
      zoomStatus.value = ZoomStatus.Zooming;

      try {
        // Store options for future use
        if (options) animationOptions.value = options;

        if (finalOptions) {
          // Add event listeners for animation completion
          const onZoomEnd = () => {
            map.off('zoomend', onZoomEnd);
            map.off('error', onError);
            zoomStatus.value = ZoomStatus.Completed;
            resolve();
          };

          const onError = (error: any) => {
            map.off('zoomend', onZoomEnd);
            map.off('error', onError);
            zoomStatus.value = ZoomStatus.Error;
            reject(error);
          };

          map.once('zoomend', onZoomEnd);
          map.once('error', onError);

          // Start the animation
          map.zoomIn(finalOptions);
        } else {
          // Immediate zoom without animation
          map.zoomIn();
          zoomStatus.value = ZoomStatus.Completed;
          resolve();
        }
      } catch (error) {
        zoomStatus.value = ZoomStatus.Error;
        logError('Error performing zoom-in operation:', error);
        reject(error);
      }
    });
  }

  /**
   * Stops any ongoing zoom animation
   */
  function stopZooming(): void {
    const map = mapInstance.value;
    if (!map) {
      return;
    }

    try {
      map.stop();
      zoomStatus.value = ZoomStatus.Completed;
    } catch (error) {
      logError('Error stopping zoom animation:', error);
    }
  }

  // Legacy function for backward compatibility
  function legacyZoomIn(options?: AnimationOptions): void {
    zoomIn(options).catch((error) => {
      logError('Error in legacy zoomIn:', error);
    });
  }

  // Watch for map and options changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (
      map &&
      props.autoZoom !== false &&
      zoomStatus.value === ZoomStatus.NotStarted
    ) {
      zoomIn(animationOptions.value).catch((error) => {
        logError('Error in watchEffect zoomIn:', error);
      });
    }
  });

  // Cleanup function
  function cleanup(): void {
    zoomStatus.value = ZoomStatus.Completed;
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  // Return appropriate interface based on API version
  if (isLegacyAPI) {
    return { zoomIn: legacyZoomIn };
  }

  return {
    zoomIn,
    stopZooming,
    getCurrentZoom,
    getCurrentCamera,
    zoomStatus: zoomStatus.value as Readonly<ZoomStatus>,
    isZooming: isZooming.value,
  };
}

/**
 * Composable for managing map zoom-out operations with enhanced error handling
 * Provides reactive zoom-out functionality with validation and debugging capabilities
 *
 * @param props - Configuration options for zoom-out functionality
 * @returns Enhanced actions and state for zoom-out operations
 */
export function useZoomOut(props: ZoomOutProps): ZoomOutActions;

/**
 * Legacy overload for backward compatibility
 * @deprecated Use the new props-based interface for better type safety and features
 */
export function useZoomOut(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions,
): { zoomOut: (options?: AnimationOptions) => void };

export function useZoomOut(
  mapOrProps: MaybeRef<Nullable<Map>> | ZoomOutProps,
  legacyOptions?: AnimationOptions,
): ZoomOutActions | { zoomOut: (options?: AnimationOptions) => void } {
  // Handle legacy API for backward compatibility
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  const props: ZoomOutProps = isLegacyAPI
    ? {
        map: mapOrProps as MaybeRef<Nullable<Map>>,
        options: legacyOptions,
        debug: false,
        autoZoom: true,
      }
    : (mapOrProps as ZoomOutProps);

  const { logError } = useLogger(props.debug ?? false);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const zoomStatus = ref<ZoomStatus>(ZoomStatus.NotStarted);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isZooming = computed(() => zoomStatus.value === ZoomStatus.Zooming);

  /**
   * Validates if zoom operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateZoomOperation(): boolean {
    const map = mapInstance.value;
    if (!map) {
      return false;
    }
    return true;
  }

  /**
   * Gets the current zoom level
   * @returns Current zoom level or null
   */
  function getCurrentZoom(): number | null {
    const map = mapInstance.value;
    if (!map) {
      return null;
    }

    try {
      return map.getZoom();
    } catch (error) {
      logError('Error getting current zoom:', error);
      return null;
    }
  }

  /**
   * Gets the current camera position
   * @returns Current camera options or null
   */
  function getCurrentCamera(): CameraOptions | null {
    const map = mapInstance.value;
    if (!map) {
      return null;
    }

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
   * Performs zoom-out operation with enhanced error handling and validation
   * @param options - Animation options
   * @returns Promise that resolves when animation completes
   */
  function zoomOut(options?: AnimationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!validateZoomOperation()) {
        reject(new Error('Map instance not available'));
        return;
      }

      const map = mapInstance.value!;
      const finalOptions = options || animationOptions.value;
      zoomStatus.value = ZoomStatus.Zooming;

      try {
        // Store options for future use
        if (options) animationOptions.value = options;

        if (finalOptions) {
          // Add event listeners for animation completion
          const onZoomEnd = () => {
            map.off('zoomend', onZoomEnd);
            map.off('error', onError);
            zoomStatus.value = ZoomStatus.Completed;
            resolve();
          };

          const onError = (error: any) => {
            map.off('zoomend', onZoomEnd);
            map.off('error', onError);
            zoomStatus.value = ZoomStatus.Error;
            reject(error);
          };

          map.once('zoomend', onZoomEnd);
          map.once('error', onError);

          // Start the animation
          map.zoomOut(finalOptions);
        } else {
          // Immediate zoom without animation
          map.zoomOut();
          zoomStatus.value = ZoomStatus.Completed;
          resolve();
        }
      } catch (error) {
        zoomStatus.value = ZoomStatus.Error;
        logError('Error performing zoom-out operation:', error);
        reject(error);
      }
    });
  }

  /**
   * Stops any ongoing zoom animation
   */
  function stopZooming(): void {
    const map = mapInstance.value;
    if (!map) {
      return;
    }

    try {
      map.stop();
      zoomStatus.value = ZoomStatus.Completed;
    } catch (error) {
      logError('Error stopping zoom animation:', error);
    }
  }

  // Legacy function for backward compatibility
  function legacyZoomOut(options?: AnimationOptions): void {
    zoomOut(options).catch((error) => {
      logError('Error in legacy zoomOut:', error);
    });
  }

  // Watch for map and options changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (
      map &&
      props.autoZoom !== false &&
      zoomStatus.value === ZoomStatus.NotStarted
    ) {
      zoomOut(animationOptions.value).catch((error) => {
        logError('Error in watchEffect zoomOut:', error);
      });
    }
  });

  // Cleanup function
  function cleanup(): void {
    zoomStatus.value = ZoomStatus.Completed;
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  // Return appropriate interface based on API version
  if (isLegacyAPI) {
    return { zoomOut: legacyZoomOut };
  }

  return {
    zoomOut,
    stopZooming,
    getCurrentZoom,
    getCurrentCamera,
    zoomStatus: zoomStatus.value as Readonly<ZoomStatus>,
    isZooming: isZooming.value,
  };
}
