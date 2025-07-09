import { watchEffect, ref, computed, unref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, Undefinedable } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { Map, FitBoundsOptions, PointLike } from 'maplibre-gl';

/**
 * Screen coordinates fitting status enum for better state management
 */
export enum FitScreenCoordinatesStatus {
  NotSet = 'not-set',
  Setting = 'setting',
  Set = 'set',
  Error = 'error',
}

/**
 * Configuration options for screen coordinates fitting
 */
interface FitScreenCoordinatesProps {
  map: MaybeRef<Nullable<Map>>;
  /** Enable debug logging */
  debug?: boolean;
  /** Automatically cleanup resources on unmount */
  autoCleanup?: boolean;
  /** Default options for fitting screen coordinates */
  defaultOptions?: Omit<FitBoundsOptions, 'bearing'>;
  /** Default bearing value */
  defaultBearing?: number;
}

/**
 * Actions and state for screen coordinates fitting
 */
interface FitScreenCoordinatesActions {
  /** Fit the map to screen coordinates */
  fitScreenCoordinates: (
    p0: PointLike,
    p1: PointLike,
    options?: Omit<FitBoundsOptions, 'bearing'>,
    bearing?: number,
  ) => void;
  /** Clear current screen coordinates */
  clearCoordinates: () => void;
  /** Current status */
  readonly status: Readonly<FitScreenCoordinatesStatus>;
  /** Computed state flags */
  readonly isCoordinatesSet: boolean;
  readonly isFitting: boolean;
  readonly hasError: boolean;
}

/**
 * Composable for managing screen coordinates fitting with enhanced error handling
 * Provides reactive screen coordinates management with validation and debugging capabilities
 *
 * @param props - Configuration options for screen coordinates fitting
 * @returns Enhanced actions and state for screen coordinates management
 */
export function useFitScreenCoordinates(
  props: FitScreenCoordinatesProps,
): FitScreenCoordinatesActions;

/**
 * Backward-compatible overload for existing API
 * @deprecated Use the props-based API for better type safety and features
 */
export function useFitScreenCoordinates(
  map: MaybeRef<Nullable<Map>>,
): FitScreenCoordinatesActions;

export function useFitScreenCoordinates(
  propsOrMap: FitScreenCoordinatesProps | MaybeRef<Nullable<Map>>,
): FitScreenCoordinatesActions | FitScreenCoordinatesActions {
  // Handle backward compatibility
  const props: FitScreenCoordinatesProps =
    'map' in (propsOrMap as any) ||
    (typeof propsOrMap === 'object' &&
      propsOrMap !== null &&
      !('value' in propsOrMap))
      ? (propsOrMap as FitScreenCoordinatesProps)
      : { map: propsOrMap as MaybeRef<Nullable<Map>> };
  const {
    debug = false,
    autoCleanup = true,
    defaultOptions,
    defaultBearing,
  } = props;
  const { logError, logWarn } = useLogger(debug);

  // Reactive state
  const p0 = ref<PointLike>();
  const p1 = ref<PointLike>();
  const options =
    ref<Undefinedable<Omit<FitBoundsOptions, 'bearing'>>>(defaultOptions);
  const bearing = ref<Undefinedable<number>>(defaultBearing);
  const status = ref<FitScreenCoordinatesStatus>(
    FitScreenCoordinatesStatus.NotSet,
  );

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isCoordinatesSet = computed(() => !!(p0.value && p1.value));
  const isFitting = computed(
    () => status.value === FitScreenCoordinatesStatus.Setting,
  );
  const hasError = computed(
    () => status.value === FitScreenCoordinatesStatus.Error,
  );

  /**
   * Validates if screen coordinates operation can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateOperation(): boolean {
    const map = mapInstance.value;
    if (!map) {
      logWarn('Map instance not available for screen coordinates operation');
      return false;
    }

    if (!map.isStyleLoaded()) {
      logWarn('Map style not loaded, deferring screen coordinates operation');
      return false;
    }

    return true;
  }

  /**
   * Validates screen coordinates data
   * @param p0Val - First point to validate
   * @param p1Val - Second point to validate
   * @returns boolean indicating if coordinates are valid
   */
  function validateCoordinates(p0Val: PointLike, p1Val: PointLike): boolean {
    if (!p0Val || !p1Val) {
      logError('Invalid screen coordinates: both p0 and p1 are required');
      return false;
    }

    // Validate point structure
    const validatePoint = (point: PointLike): boolean => {
      if (Array.isArray(point)) {
        return (
          point.length === 2 &&
          typeof point[0] === 'number' &&
          typeof point[1] === 'number'
        );
      }
      if (typeof point === 'object' && point !== null) {
        return (
          'x' in point &&
          'y' in point &&
          typeof (point as any).x === 'number' &&
          typeof (point as any).y === 'number'
        );
      }
      return false;
    };

    if (!validatePoint(p0Val) || !validatePoint(p1Val)) {
      logError(
        'Invalid point format: points must be [x, y] arrays or {x, y} objects',
      );
      return false;
    }

    return true;
  }

  /**
   * Gets the current bearing from the map
   * @returns Current bearing or null if not available
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
   * Fits the map to screen coordinates with enhanced error handling and validation
   * @param p0Val - First screen coordinate point
   * @param p1Val - Second screen coordinate point
   * @param optionsVal - Optional fit bounds options
   * @param bearingVal - Optional bearing value
   */
  function fitScreenCoordinates(
    p0Val: PointLike,
    p1Val: PointLike,
    optionsVal?: Omit<FitBoundsOptions, 'bearing'>,
    bearingVal?: number,
  ): void {
    if (!validateOperation() || !validateCoordinates(p0Val, p1Val)) {
      status.value = FitScreenCoordinatesStatus.Error;
      return;
    }

    const map = mapInstance.value!;
    status.value = FitScreenCoordinatesStatus.Setting;

    try {
      // Update reactive state
      p0.value = p0Val;
      p1.value = p1Val;
      if (optionsVal !== undefined) options.value = optionsVal;
      if (bearingVal !== undefined) bearing.value = bearingVal;

      // Use current bearing if none provided
      const finalBearing = bearing.value ?? getCurrentBearing() ?? 0;

      // Perform the screen coordinates fitting
      map.fitScreenCoordinates(p0Val, p1Val, finalBearing, options.value);

      status.value = FitScreenCoordinatesStatus.Set;
    } catch (error) {
      status.value = FitScreenCoordinatesStatus.Error;
      logError('Error fitting screen coordinates:', error, {
        p0: p0Val,
        p1: p1Val,
        bearing: bearingVal,
        options: optionsVal,
      });
    }
  }

  /**
   * Clears the current screen coordinates
   */
  function clearCoordinates(): void {
    p0.value = undefined;
    p1.value = undefined;
    options.value = defaultOptions;
    bearing.value = defaultBearing;
    status.value = FitScreenCoordinatesStatus.NotSet;
  }

  // Watch for map and coordinates changes with enhanced error handling
  watchEffect(() => {
    const map = mapInstance.value;
    if (
      map &&
      p0.value &&
      p1.value &&
      status.value !== FitScreenCoordinatesStatus.Setting
    ) {
      try {
        if (!map.isStyleLoaded()) {
          // Wait for style to load before fitting
          const onStyleLoad = () => {
            map.off('styledata', onStyleLoad);
            fitScreenCoordinates(
              p0.value!,
              p1.value!,
              options.value,
              bearing.value,
            );
          };
          map.on('styledata', onStyleLoad);
          return;
        }

        // Use current bearing if none set
        const finalBearing = bearing.value ?? getCurrentBearing() ?? 0;

        map.fitScreenCoordinates(
          p0.value,
          p1.value,
          finalBearing,
          options.value,
        );
        status.value = FitScreenCoordinatesStatus.Set;
      } catch (error) {
        status.value = FitScreenCoordinatesStatus.Error;
        logError('Error in watchEffect for screen coordinates:', error);
      }
    }
  });

  // Cleanup function for disposing resources
  function cleanup(): void {
    if (autoCleanup) {
      clearCoordinates();
    }
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  return {
    fitScreenCoordinates,
    clearCoordinates,
    status: status.value as Readonly<FitScreenCoordinatesStatus>,
    isCoordinatesSet: isCoordinatesSet.value,
    isFitting: isFitting.value,
    hasError: hasError.value,
  };
}
