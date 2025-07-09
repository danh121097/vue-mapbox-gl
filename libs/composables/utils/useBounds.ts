import { watchEffect, ref, computed, unref } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, Undefinedable } from '@libs/types';
import type { MaybeRef } from 'vue';
import type {
  Map,
  LngLatBoundsLike,
  FitBoundsOptions,
  CameraForBoundsOptions,
  LngLatBounds,
} from 'maplibre-gl';

/**
 * Bounds operation status enum for better state management
 */
export enum BoundsStatus {
  NotSet = 'not-set',
  Setting = 'setting',
  Set = 'set',
  Error = 'error',
}

interface FitBoundsProps {
  map: MaybeRef<Nullable<Map>>;
  options?: FitBoundsOptions;
  debug?: boolean;
}

interface FitBoundsActions {
  setFitBounds: (
    boundsVal: LngLatBoundsLike,
    options?: FitBoundsOptions,
  ) => void;
  clearBounds: () => void;
  getCurrentBounds: () => LngLatBounds | null;
  bounds: LngLatBoundsLike | undefined;
  boundsStatus: Readonly<BoundsStatus>;
  isBoundsSet: boolean;
}

interface CameraForBoundsProps {
  map: MaybeRef<Nullable<Map>>;
  options?: CameraForBoundsOptions & { bounds?: LngLatBoundsLike };
  debug?: boolean;
}

interface CameraForBoundsActions {
  cameraForBounds: (
    boundsVal: LngLatBoundsLike,
    options?: CameraForBoundsOptions,
  ) => void;
  clearCamera: () => void;
  getCurrentBounds: () => LngLatBounds | null;
  bbox: LngLatBoundsLike | undefined;
  cameraStatus: Readonly<BoundsStatus>;
  isCameraSet: boolean;
}

/**
 * Composable for managing map bounds fitting with enhanced error handling and performance
 * Provides reactive bounds management with validation and debugging capabilities
 *
 * @param props - Configuration options for bounds fitting
 * @returns Enhanced actions and state for bounds management
 */
export function useFitBounds(props: FitBoundsProps): FitBoundsActions {
  const { logError } = useLogger(props.debug ?? false);
  const bounds = ref<LngLatBoundsLike>();
  const boundsOptions = ref<Undefinedable<FitBoundsOptions>>(props.options);
  const boundsStatus = ref<BoundsStatus>(BoundsStatus.NotSet);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isBoundsSet = computed(() => boundsStatus.value === BoundsStatus.Set);

  /**
   * Validates if bounds operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateBoundsOperation(): boolean {
    const map = mapInstance.value;
    if (!map) return false;
    return true;
  }

  /**
   * Validates bounds data structure
   * @param boundsVal - Bounds to validate
   * @returns boolean indicating if bounds are valid
   */
  function validateBounds(boundsVal: LngLatBoundsLike): boolean {
    if (!boundsVal) return false;
    // Additional validation for array format
    if (Array.isArray(boundsVal)) {
      if (boundsVal.length !== 4 && boundsVal.length !== 2) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets the current map bounds
   * @returns Current map bounds or null if not available
   */
  function getCurrentBounds(): LngLatBounds | null {
    const map = mapInstance.value;
    if (!map) return null;

    try {
      return map.getBounds();
    } catch (error) {
      logError('Error getting current bounds:', error);
      return null;
    }
  }

  /**
   * Sets bounds for the map to fit with enhanced error handling and validation
   * @param boundsVal - Bounds to fit
   * @param options - Optional fit bounds options
   */
  function setFitBounds(
    boundsVal: LngLatBoundsLike,
    options?: FitBoundsOptions,
  ): void {
    if (!validateBoundsOperation() || !validateBounds(boundsVal)) {
      boundsStatus.value = BoundsStatus.Error;
      return;
    }

    const map = mapInstance.value!;
    boundsStatus.value = BoundsStatus.Setting;

    try {
      bounds.value = boundsVal;
      if (options) boundsOptions.value = options;

      map.fitBounds(boundsVal, boundsOptions.value);
      boundsStatus.value = BoundsStatus.Set;
    } catch (error) {
      boundsStatus.value = BoundsStatus.Error;
      logError('Error setting map bounds:', error, { bounds: boundsVal });
    }
  }

  /**
   * Clears the current bounds
   */
  function clearBounds(): void {
    bounds.value = undefined;
    boundsStatus.value = BoundsStatus.NotSet;
  }

  // Watch for map and bounds changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (map && bounds.value && boundsStatus.value !== BoundsStatus.Setting) {
      setFitBounds(bounds.value, boundsOptions.value);
    }
  });

  return {
    setFitBounds,
    clearBounds,
    getCurrentBounds,
    bounds: bounds.value,
    boundsStatus: boundsStatus.value as Readonly<BoundsStatus>,
    isBoundsSet: isBoundsSet.value,
  };
}

/**
 * Composable for managing camera positioning for bounds with enhanced error handling
 * Provides reactive camera management with validation and debugging capabilities
 *
 * @param props - Configuration options for camera bounds
 * @returns Enhanced actions and state for camera management
 */
export function useCameraForBounds(
  props: CameraForBoundsProps,
): CameraForBoundsActions {
  const { log } = useLogger(props.debug ?? false);
  const bbox = ref<LngLatBoundsLike | undefined>(props.options?.bounds);
  const cameraOptions = ref<Undefinedable<CameraForBoundsOptions>>(
    props.options,
  );
  const cameraStatus = ref<BoundsStatus>(BoundsStatus.NotSet);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isCameraSet = computed(() => cameraStatus.value === BoundsStatus.Set);

  /**
   * Validates if camera operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateCameraOperation(): boolean {
    const map = mapInstance.value;
    if (!map) {
      log('Cannot perform camera operation: map instance not available');
      return false;
    }
    return true;
  }

  /**
   * Gets the current map bounds
   * @returns Current map bounds or null if not available
   */
  function getCurrentBounds(): LngLatBounds | null {
    const map = mapInstance.value;
    if (!map) {
      log('Cannot get current bounds: map instance not available');
      return null;
    }

    try {
      return map.getBounds();
    } catch (error) {
      log('Error getting current bounds:', error);
      return null;
    }
  }

  /**
   * Sets camera position for bounds with enhanced error handling and validation
   * @param boundsVal - Bounds for camera positioning
   * @param options - Optional camera options
   */
  function cameraForBounds(
    boundsVal: LngLatBoundsLike,
    options?: CameraForBoundsOptions,
  ): void {
    if (!validateCameraOperation()) {
      cameraStatus.value = BoundsStatus.Error;
      return;
    }

    if (!boundsVal) {
      log('Invalid bounds for camera: bounds value is null or undefined');
      cameraStatus.value = BoundsStatus.Error;
      return;
    }

    const map = mapInstance.value!;
    cameraStatus.value = BoundsStatus.Setting;

    try {
      bbox.value = boundsVal;
      if (options) cameraOptions.value = options;

      log('Setting camera for bounds', { bounds: boundsVal, options });

      map.cameraForBounds(boundsVal, cameraOptions.value);
      cameraStatus.value = BoundsStatus.Set;

      log('Camera for bounds set successfully');
    } catch (error) {
      cameraStatus.value = BoundsStatus.Error;
      log('Error setting camera for bounds:', error, { bounds: boundsVal });
    }
  }

  /**
   * Clears the current camera bounds
   */
  function clearCamera(): void {
    bbox.value = undefined;
    cameraStatus.value = BoundsStatus.NotSet;
    log('Camera bounds cleared');
  }

  // Watch for map and bounds changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (map && bbox.value && cameraStatus.value !== BoundsStatus.Setting) {
      cameraForBounds(bbox.value, cameraOptions.value);
    }
  });

  return {
    cameraForBounds,
    clearCamera,
    getCurrentBounds,
    bbox: bbox.value,
    cameraStatus: cameraStatus.value as Readonly<BoundsStatus>,
    isCameraSet: isCameraSet.value,
  };
}
