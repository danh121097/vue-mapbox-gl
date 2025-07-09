import { watchEffect, ref, computed, unref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, Undefinedable } from '@libs/types';
import type { MaybeRef } from 'vue';
import type {
  Map,
  AnimationOptions,
  PointLike,
  LngLatLike,
  CameraOptions,
} from 'maplibre-gl';

/**
 * Pan animation status enum for better state management
 */
export enum PanStatus {
  NotStarted = 'not-started',
  Panning = 'panning',
  Completed = 'completed',
  Error = 'error',
}

interface PanByProps {
  map: MaybeRef<Nullable<Map>>;
  offset?: PointLike;
  options?: AnimationOptions;
  debug?: boolean;
  autoPan?: boolean;
}

interface PanByActions {
  panBy: (offset: PointLike, options?: AnimationOptions) => Promise<void>;
  stopPanning: () => void;
  getCurrentCamera: () => CameraOptions | null;
  validatePanOffset: (offset: PointLike) => boolean;
  panStatus: Readonly<PanStatus>;
  isPanning: boolean;
  panCount: number;
}

interface PanToProps {
  map: MaybeRef<Nullable<Map>>;
  lnglat?: LngLatLike;
  options?: AnimationOptions;
  debug?: boolean;
  autoPan?: boolean;
}

interface PanToActions {
  panTo: (lnglat: LngLatLike, options?: AnimationOptions) => Promise<void>;
  stopPanning: () => void;
  getCurrentCamera: () => CameraOptions | null;
  validatePanTarget: (lnglat: LngLatLike) => boolean;
  panStatus: Readonly<PanStatus>;
  isPanning: boolean;
}

/**
 * Composable for managing map panning by offset with enhanced error handling
 * Provides reactive pan-by functionality with validation and debugging capabilities
 *
 * @param props - Configuration options for pan-by functionality
 * @returns Enhanced actions and state for pan-by operations
 */
export function usePanBy(props: PanByProps): PanByActions;

/**
 * Legacy overload for backward compatibility
 * @deprecated Use the new props-based interface for better type safety and features
 */
export function usePanBy(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions & { offset: PointLike },
): { panBy: (offsetVal: PointLike, options?: AnimationOptions) => void };

export function usePanBy(
  mapOrProps: MaybeRef<Nullable<Map>> | PanByProps,
  legacyOptions?: AnimationOptions & { offset: PointLike },
):
  | PanByActions
  | { panBy: (offsetVal: PointLike, options?: AnimationOptions) => void } {
  // Handle legacy API for backward compatibility
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  const props: PanByProps = isLegacyAPI
    ? {
        map: mapOrProps as MaybeRef<Nullable<Map>>,
        offset: legacyOptions?.offset,
        options: legacyOptions,
        debug: false,
        autoPan: true,
      }
    : (mapOrProps as PanByProps);

  const { logError } = useLogger(props.debug ?? false);
  const offset = ref<PointLike | undefined>(props.offset);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const panStatus = ref<PanStatus>(PanStatus.NotStarted);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isPanning = computed(() => panStatus.value === PanStatus.Panning);

  /**
   * Validates if pan operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validatePanOperation(): boolean {
    const map = mapInstance.value;
    if (!map) return false;
    return true;
  }

  /**
   * Validates pan offset for correctness
   * @param offset - Pan offset to validate
   * @returns boolean indicating if offset is valid
   */
  function validatePanOffset(offset: PointLike): boolean {
    if (!offset) return false;

    if (Array.isArray(offset)) {
      if (offset.length !== 2) {
        return false;
      }
      const [x, y] = offset;
      if (typeof x !== 'number' || typeof y !== 'number') {
        return false;
      }
    } else if (typeof offset === 'object') {
      if (typeof offset.x !== 'number' || typeof offset.y !== 'number') {
        return false;
      }
    } else {
      return false;
    }

    return true;
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
   * Performs pan-by operation with enhanced error handling and validation
   * @param offsetVal - Pan offset value
   * @param options - Animation options
   * @returns Promise that resolves when animation completes
   */
  function panBy(
    offsetVal: PointLike,
    options?: AnimationOptions,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!validatePanOperation()) {
        reject(new Error('Map instance not available'));
        return;
      }

      if (!validatePanOffset(offsetVal)) {
        panStatus.value = PanStatus.Error;
        reject(new Error('Invalid pan offset'));
        return;
      }

      const map = mapInstance.value!;
      const finalOptions = options || animationOptions.value;
      panStatus.value = PanStatus.Panning;

      try {
        // Store values for future use
        offset.value = offsetVal;
        if (options) animationOptions.value = options;

        if (finalOptions) {
          // Add event listeners for animation completion
          const onMoveEnd = () => {
            map.off('moveend', onMoveEnd);
            map.off('error', onError);
            panStatus.value = PanStatus.Completed;
            resolve();
          };

          const onError = (error: any) => {
            map.off('moveend', onMoveEnd);
            map.off('error', onError);
            panStatus.value = PanStatus.Error;
            reject(error);
          };

          map.once('moveend', onMoveEnd);
          map.once('error', onError);

          // Start the animation
          map.panBy(offsetVal, finalOptions);
        } else {
          // Immediate pan without animation
          map.panBy(offsetVal);
          panStatus.value = PanStatus.Completed;
          resolve();
        }
      } catch (error) {
        panStatus.value = PanStatus.Error;
        logError('Error performing pan-by operation:', error);
        reject(error);
      }
    });
  }

  /**
   * Stops any ongoing panning animation
   */
  function stopPanning(): void {
    const map = mapInstance.value;
    if (!map) return;

    try {
      map.stop();
      panStatus.value = PanStatus.Completed;
    } catch (error) {
      logError('Error stopping panning animation:', error);
    }
  }

  // Legacy function for backward compatibility
  function legacyPanBy(offsetVal: PointLike, options?: AnimationOptions): void {
    panBy(offsetVal, options).catch((error) => {
      logError('Error in legacy panBy:', error);
    });
  }

  // Watch for map and options changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (
      map &&
      offset.value &&
      props.autoPan !== false &&
      panStatus.value === PanStatus.NotStarted
    ) {
      panBy(offset.value, animationOptions.value).catch((error) => {
        logError('Error in watchEffect panBy:', error);
      });
    }
  });

  // Cleanup function
  function cleanup(): void {
    panStatus.value = PanStatus.Completed;
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  // Return appropriate interface based on API version
  if (isLegacyAPI) {
    return { panBy: legacyPanBy };
  }

  return {
    panBy,
    stopPanning,
    getCurrentCamera,
    validatePanOffset,
    panStatus: panStatus.value as Readonly<PanStatus>,
    isPanning: isPanning.value,
  };
}

/**
 * Composable for managing map panning to coordinates with enhanced error handling
 * Provides reactive pan-to functionality with validation and debugging capabilities
 *
 * @param props - Configuration options for pan-to functionality
 * @returns Enhanced actions and state for pan-to operations
 */
export function usePanTo(props: PanToProps): PanToActions;

/**
 * Legacy overload for backward compatibility
 * @deprecated Use the new props-based interface for better type safety and features
 */
export function usePanTo(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions & { lnglat: LngLatLike },
): { panTo: (offsetVal: LngLatLike, options?: AnimationOptions) => void };

export function usePanTo(
  mapOrProps: MaybeRef<Nullable<Map>> | PanToProps,
  legacyOptions?: AnimationOptions & { lnglat: LngLatLike },
):
  | PanToActions
  | { panTo: (offsetVal: LngLatLike, options?: AnimationOptions) => void } {
  // Handle legacy API for backward compatibility
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  const props: PanToProps = isLegacyAPI
    ? {
        map: mapOrProps as MaybeRef<Nullable<Map>>,
        lnglat: legacyOptions?.lnglat,
        options: legacyOptions,
        debug: false,
        autoPan: true,
      }
    : (mapOrProps as PanToProps);

  const { log } = useLogger(props.debug ?? false);
  const lnglat = ref<LngLatLike | undefined>(props.lnglat);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const panStatus = ref<PanStatus>(PanStatus.NotStarted);
  const panCount = ref<number>(0);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isPanning = computed(() => panStatus.value === PanStatus.Panning);

  /**
   * Validates if pan operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validatePanOperation(): boolean {
    const map = mapInstance.value;
    if (!map) {
      log('Cannot perform pan operation: map instance not available');
      return false;
    }
    return true;
  }

  /**
   * Validates pan target coordinates for correctness
   * @param lnglat - Pan target coordinates to validate
   * @returns boolean indicating if coordinates are valid
   */
  function validatePanTarget(lnglat: LngLatLike): boolean {
    if (!lnglat) {
      log('Invalid pan target: coordinates are null or undefined');
      return false;
    }

    if (Array.isArray(lnglat)) {
      if (lnglat.length !== 2) {
        log('Invalid pan target: array must have exactly 2 elements', {
          lnglat,
        });
        return false;
      }
      const [lng, lat] = lnglat;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        log('Invalid pan target: coordinates must be numbers', { lnglat });
        return false;
      }
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        log('Invalid pan target: coordinates out of valid range', { lnglat });
        return false;
      }
    } else if (typeof lnglat === 'object') {
      // Handle different LngLatLike object formats
      const hasLngLat = 'lng' in lnglat && 'lat' in lnglat;
      const hasLonLat = 'lon' in lnglat && 'lat' in lnglat;

      if (hasLngLat) {
        const obj = lnglat as { lng: number; lat: number };
        if (typeof obj.lng !== 'number' || typeof obj.lat !== 'number') {
          log('Invalid pan target: lng and lat must be numbers', { lnglat });
          return false;
        }
        if (obj.lng < -180 || obj.lng > 180 || obj.lat < -90 || obj.lat > 90) {
          log('Invalid pan target: coordinates out of valid range', { lnglat });
          return false;
        }
      } else if (hasLonLat) {
        const obj = lnglat as { lon: number; lat: number };
        if (typeof obj.lon !== 'number' || typeof obj.lat !== 'number') {
          log('Invalid pan target: lon and lat must be numbers', { lnglat });
          return false;
        }
        if (obj.lon < -180 || obj.lon > 180 || obj.lat < -90 || obj.lat > 90) {
          log('Invalid pan target: coordinates out of valid range', { lnglat });
          return false;
        }
      } else {
        log(
          'Invalid pan target: object must have lng,lat or lon,lat properties',
          { lnglat },
        );
        return false;
      }
    } else {
      log(
        'Invalid pan target: must be array or object with lng,lat properties',
        { lnglat },
      );
      return false;
    }

    return true;
  }

  /**
   * Gets the current camera position
   * @returns Current camera options or null
   */
  function getCurrentCamera(): CameraOptions | null {
    const map = mapInstance.value;
    if (!map) {
      log('Cannot get camera: map instance not available');
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
      log('Error getting current camera:', error);
      return null;
    }
  }

  /**
   * Performs pan-to operation with enhanced error handling and validation
   * @param lnglatVal - Pan target coordinates
   * @param options - Animation options
   * @returns Promise that resolves when animation completes
   */
  function panTo(
    lnglatVal: LngLatLike,
    options?: AnimationOptions,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!validatePanOperation()) {
        reject(new Error('Map instance not available'));
        return;
      }

      if (!validatePanTarget(lnglatVal)) {
        panStatus.value = PanStatus.Error;
        reject(new Error('Invalid pan target coordinates'));
        return;
      }

      const map = mapInstance.value!;
      const finalOptions = options || animationOptions.value;
      panStatus.value = PanStatus.Panning;

      try {
        // Store values for future use
        lnglat.value = lnglatVal;
        if (options) animationOptions.value = options;

        panCount.value++;
        log('Performing pan-to operation', {
          lnglat: lnglatVal,
          options: finalOptions,
          panCount: panCount.value,
        });

        if (finalOptions) {
          // Add event listeners for animation completion
          const onMoveEnd = () => {
            map.off('moveend', onMoveEnd);
            map.off('error', onError);
            panStatus.value = PanStatus.Completed;
            log('Pan-to animation completed successfully');
            resolve();
          };

          const onError = (error: any) => {
            map.off('moveend', onMoveEnd);
            map.off('error', onError);
            panStatus.value = PanStatus.Error;
            log('Error during pan-to animation:', error);
            reject(error);
          };

          map.once('moveend', onMoveEnd);
          map.once('error', onError);

          // Start the animation
          map.panTo(lnglatVal, finalOptions);
        } else {
          // Immediate pan without animation
          map.panTo(lnglatVal);
          panStatus.value = PanStatus.Completed;
          log('Pan-to operation completed immediately');
          resolve();
        }
      } catch (error) {
        panStatus.value = PanStatus.Error;
        log('Error performing pan-to operation:', error);
        reject(error);
      }
    });
  }

  /**
   * Stops any ongoing panning animation
   */
  function stopPanning(): void {
    const map = mapInstance.value;
    if (!map) {
      log('Cannot stop panning: map instance not available');
      return;
    }

    try {
      map.stop();
      panStatus.value = PanStatus.Completed;
      log('Panning animation stopped');
    } catch (error) {
      log('Error stopping panning animation:', error);
    }
  }

  // Legacy function for backward compatibility
  function legacyPanTo(
    lnglatVal: LngLatLike,
    options?: AnimationOptions,
  ): void {
    panTo(lnglatVal, options).catch((error) => {
      log('Error in legacy panTo:', error);
    });
  }

  // Watch for map and options changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (
      map &&
      lnglat.value &&
      props.autoPan !== false &&
      panStatus.value === PanStatus.NotStarted
    ) {
      panTo(lnglat.value, animationOptions.value).catch((error) => {
        log('Error in watchEffect panTo:', error);
      });
    }
  });

  // Cleanup function
  function cleanup(): void {
    log('Cleaning up pan-to composable');
    panStatus.value = PanStatus.Completed;
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  // Return appropriate interface based on API version
  if (isLegacyAPI) {
    return { panTo: legacyPanTo };
  }

  return {
    panTo,
    stopPanning,
    getCurrentCamera,
    validatePanTarget,
    panStatus: panStatus.value as Readonly<PanStatus>,
    isPanning: isPanning.value,
  };
}
