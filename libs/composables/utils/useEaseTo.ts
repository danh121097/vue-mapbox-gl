import { watchEffect, ref, computed, unref } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, Undefinedable } from '@libs/types';
import type { MaybeRef } from 'vue';
import type {
  Map,
  EaseToOptions,
  LngLatLike,
  CameraOptions,
} from 'maplibre-gl';

/**
 * Ease animation status enum for better state management
 */
export enum EaseStatus {
  NotStarted = 'not-started',
  Easing = 'easing',
  Completed = 'completed',
  Error = 'error',
}

interface EaseToProps {
  map: MaybeRef<Nullable<Map>>;
  options?: EaseToOptions;
  debug?: boolean;
}

interface EaseToActions {
  easeTo: (options?: EaseToOptions) => Promise<void>;
  easeToCenter: (
    center: LngLatLike,
    options?: Omit<EaseToOptions, 'center'>,
  ) => Promise<void>;
  easeToZoom: (
    zoom: number,
    options?: Omit<EaseToOptions, 'zoom'>,
  ) => Promise<void>;
  easeToBearing: (
    bearing: number,
    options?: Omit<EaseToOptions, 'bearing'>,
  ) => Promise<void>;
  easeToPitch: (
    pitch: number,
    options?: Omit<EaseToOptions, 'pitch'>,
  ) => Promise<void>;
  stopEasing: () => void;
  getCurrentCamera: () => CameraOptions | null;
  easeStatus: Readonly<EaseStatus>;
  isEasing: boolean;
}

/**
 * Composable for managing smooth map camera transitions with enhanced error handling
 * Provides reactive ease-to animations with validation and debugging capabilities
 *
 * @param props - Configuration options for ease-to animations
 * @returns Enhanced actions and state for camera animations
 */
export function useEaseTo(props: EaseToProps): EaseToActions {
  const { logError, logWarn } = useLogger(props.debug ?? false);
  const easeOptions = ref<Undefinedable<EaseToOptions>>(props.options);
  const easeStatus = ref<EaseStatus>(EaseStatus.NotStarted);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isEasing = computed(() => easeStatus.value === EaseStatus.Easing);

  /**
   * Validates if ease operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateEaseOperation(): boolean {
    const map = mapInstance.value;
    if (!map) return false;
    return true;
  }

  /**
   * Validates ease-to options
   * @param options - Options to validate
   * @returns boolean indicating if options are valid
   */
  function validateEaseOptions(options: EaseToOptions): boolean {
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
   * Performs ease-to animation with enhanced error handling and validation
   * @param options - Ease-to options
   * @returns Promise that resolves when animation completes
   */
  function easeTo(options?: EaseToOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!validateEaseOperation()) {
        reject(new Error('Map instance not available'));
        return;
      }

      const finalOptions = options || easeOptions.value;
      if (!finalOptions) {
        reject(new Error('No ease options provided'));
        return;
      }

      if (!validateEaseOptions(finalOptions)) {
        easeStatus.value = EaseStatus.Error;
        reject(new Error('Invalid ease options'));
        return;
      }

      const map = mapInstance.value!;
      easeStatus.value = EaseStatus.Easing;

      try {
        // Store options for future use
        if (options) easeOptions.value = options;

        // Add event listeners for animation completion
        const onMoveEnd = () => {
          map.off('moveend', onMoveEnd);
          map.off('error', onError);
          easeStatus.value = EaseStatus.Completed;
          resolve();
        };

        const onError = (error: any) => {
          map.off('moveend', onMoveEnd);
          map.off('error', onError);
          easeStatus.value = EaseStatus.Error;
          reject(error);
        };

        map.once('moveend', onMoveEnd);
        map.once('error', onError);

        // Start the animation
        map.easeTo(finalOptions);
      } catch (error) {
        easeStatus.value = EaseStatus.Error;
        logError('Error starting ease-to animation:', error);
        reject(error);
      }
    });
  }

  /**
   * Eases to a specific center coordinate
   * @param center - Target center coordinate
   * @param options - Additional ease options (excluding center)
   * @returns Promise that resolves when animation completes
   */
  function easeToCenter(
    center: LngLatLike,
    options?: Omit<EaseToOptions, 'center'>,
  ): Promise<void> {
    return easeTo({ ...options, center });
  }

  /**
   * Eases to a specific zoom level
   * @param zoom - Target zoom level
   * @param options - Additional ease options (excluding zoom)
   * @returns Promise that resolves when animation completes
   */
  function easeToZoom(
    zoom: number,
    options?: Omit<EaseToOptions, 'zoom'>,
  ): Promise<void> {
    return easeTo({ ...options, zoom });
  }

  /**
   * Eases to a specific bearing
   * @param bearing - Target bearing in degrees
   * @param options - Additional ease options (excluding bearing)
   * @returns Promise that resolves when animation completes
   */
  function easeToBearing(
    bearing: number,
    options?: Omit<EaseToOptions, 'bearing'>,
  ): Promise<void> {
    return easeTo({ ...options, bearing });
  }

  /**
   * Eases to a specific pitch
   * @param pitch - Target pitch in degrees
   * @param options - Additional ease options (excluding pitch)
   * @returns Promise that resolves when animation completes
   */
  function easeToPitch(
    pitch: number,
    options?: Omit<EaseToOptions, 'pitch'>,
  ): Promise<void> {
    return easeTo({ ...options, pitch });
  }

  /**
   * Stops any ongoing easing animation
   */
  function stopEasing(): void {
    const map = mapInstance.value;
    if (!map) return;

    try {
      map.stop();
      easeStatus.value = EaseStatus.Completed;
    } catch (error) {
      logError('Error stopping easing animation:', error);
    }
  }

  // Watch for map and options changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (
      map &&
      easeOptions.value &&
      easeStatus.value === EaseStatus.NotStarted
    ) {
      easeTo(easeOptions.value).catch((error) => {
        logError('Error in watchEffect easeTo:', error);
      });
    }
  });

  return {
    easeTo,
    easeToCenter,
    easeToZoom,
    easeToBearing,
    easeToPitch,
    stopEasing,
    getCurrentCamera,
    easeStatus: easeStatus.value as Readonly<EaseStatus>,
    isEasing: isEasing.value,
  };
}
