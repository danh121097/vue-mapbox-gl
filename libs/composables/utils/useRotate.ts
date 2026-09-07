import { watch, ref, computed, unref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import { createCameraAnimation } from './createCameraAnimation';
import type { Nullable, Undefinedable } from '@libs/types';
import type { ComputedRef, MaybeRef } from 'vue';
import type { Map, AnimationOptions, CameraOptions } from 'maplibre-gl';

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
  rotationStatus: ComputedRef<RotationStatus>;
  isRotating: ComputedRef<boolean>;
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
  rotationStatus: ComputedRef<RotationStatus>;
  isRotating: ComputedRef<boolean>;
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
  rotationStatus: ComputedRef<RotationStatus>;
  isRotating: ComputedRef<boolean>;
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
  rotationStatus: ComputedRef<RotationStatus>;
  isRotating: ComputedRef<boolean>;
}

// --- Shared helpers ---

function validateBearing(bearing: number): boolean {
  return typeof bearing === 'number' && !isNaN(bearing);
}

function makeGetBearing(
  mapInstance: { value: Map | null },
  logError: (...a: any[]) => void,
) {
  return (): number | null => {
    try {
      return mapInstance.value?.getBearing() ?? null;
    } catch {
      logError('Error getting current bearing');
      return null;
    }
  };
}

function makeGetPitch(
  mapInstance: { value: Map | null },
  logError: (...a: any[]) => void,
) {
  return (): number | null => {
    try {
      return mapInstance.value?.getPitch() ?? null;
    } catch {
      logError('Error getting current pitch');
      return null;
    }
  };
}

/**
 * Helper to create a simple rotation composable that calls a single map method.
 * Used by useResetNorth, useResetNorthPitch, useSnapToNorth.
 */
function createSimpleRotation(
  props: {
    map: MaybeRef<Nullable<Map>>;
    options?: AnimationOptions;
    debug?: boolean;
  },
  method: string,
  autoFlag: boolean,
) {
  const { logError } = useLogger(props.debug ?? false);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const rotationStatus = ref<RotationStatus>(RotationStatus.NotStarted);
  const mapInstance = computed(() => unref(props.map));
  const isRotating = computed(
    () => rotationStatus.value === RotationStatus.Rotating,
  );

  const { executeAnimation, getCurrentCamera, stopAnimation } =
    createCameraAnimation({ map: props.map, debug: props.debug });
  const getCurrentBearing = makeGetBearing(mapInstance, logError);

  function execute(options?: AnimationOptions): Promise<void> {
    if (options) animationOptions.value = options;
    const finalOptions = options || animationOptions.value;
    rotationStatus.value = RotationStatus.Rotating;

    // Without options MapLibre still eases over its default duration, so the
    // call is awaited either way. `finalOptions` may be undefined: it must
    // still occupy the options slot so the completion token lands in `eventData`.
    return executeAnimation(method, [finalOptions], 'moveend')
      .then(() => {
        rotationStatus.value = RotationStatus.Completed;
      })
      .catch((error) => {
        rotationStatus.value = RotationStatus.Error;
        throw error;
      });
  }

  function stopRotating(): void {
    stopAnimation();
    rotationStatus.value = RotationStatus.Completed;
  }

  // Auto-run once a map arrives. Watching the map instance rather than running
  // an effect keeps `rotationStatus` — which `execute` writes — out of the
  // dependency set.
  watch(
    mapInstance,
    (map) => {
      if (
        map &&
        autoFlag &&
        rotationStatus.value === RotationStatus.NotStarted
      ) {
        execute(animationOptions.value).catch((e) =>
          logError(`Error in auto ${method}:`, e),
        );
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    rotationStatus.value = RotationStatus.Completed;
  });

  return {
    execute,
    stopRotating,
    getCurrentBearing,
    getCurrentCamera,
    rotationStatus,
    isRotating,
    logError,
    mapInstance,
  };
}

// --- useRotateTo ---

export function useRotateTo(props: RotateToProps): RotateToActions;
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

  const { logError } = useLogger(props.debug ?? false);
  const bearing = ref<number | undefined>(props.bearing);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const rotationStatus = ref<RotationStatus>(RotationStatus.NotStarted);
  const mapInstance = computed(() => unref(props.map));
  const isRotating = computed(
    () => rotationStatus.value === RotationStatus.Rotating,
  );

  const { executeAnimation, getCurrentCamera, stopAnimation } =
    createCameraAnimation({ map: props.map, debug: props.debug });
  const getCurrentBearing = makeGetBearing(mapInstance, logError);

  function rotateTo(
    bearingVal: number,
    options?: AnimationOptions,
  ): Promise<void> {
    if (!validateBearing(bearingVal)) {
      rotationStatus.value = RotationStatus.Error;
      return Promise.reject(new Error('Invalid bearing value'));
    }
    bearing.value = bearingVal;
    if (options) animationOptions.value = options;
    const finalOptions = options || animationOptions.value;
    rotationStatus.value = RotationStatus.Rotating;

    // Settle on `moveend`, which every ease fires; `rotateend` only fires when
    // the bearing actually changed, so rotating to the current bearing would
    // never resolve. Without options MapLibre still eases over its default
    // duration, so that path is awaited too — see `createSimpleRotation`.
    return executeAnimation('rotateTo', [bearingVal, finalOptions], 'moveend')
      .then(() => {
        rotationStatus.value = RotationStatus.Completed;
      })
      .catch((error) => {
        rotationStatus.value = RotationStatus.Error;
        throw error;
      });
  }

  function stopRotating(): void {
    stopAnimation();
    rotationStatus.value = RotationStatus.Completed;
  }

  // Auto-rotate once a map arrives — see the note in `createSimpleRotation`.
  watch(
    mapInstance,
    (map) => {
      if (
        map &&
        bearing.value !== undefined &&
        props.autoRotate !== false &&
        rotationStatus.value === RotationStatus.NotStarted
      ) {
        rotateTo(bearing.value, animationOptions.value).catch((e) =>
          logError('Error in auto rotateTo:', e),
        );
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    rotationStatus.value = RotationStatus.Completed;
  });

  if (isLegacyAPI) {
    return {
      rotateTo: (bearingVal: number, options?: AnimationOptions) => {
        rotateTo(bearingVal, options).catch((e) =>
          logError('Error in legacy rotateTo:', e),
        );
      },
    };
  }

  return {
    rotateTo,
    stopRotating,
    getCurrentBearing,
    getCurrentCamera,
    validateBearing,
    rotationStatus: computed(() => rotationStatus.value),
    isRotating,
  };
}

// --- useResetNorth ---

export function useResetNorth(props: ResetNorthProps): ResetNorthActions;
export function useResetNorth(
  map: MaybeRef<Nullable<Map>>,
  options?: AnimationOptions,
): { resetNorth: (options?: AnimationOptions) => void };
export function useResetNorth(
  mapOrProps: MaybeRef<Nullable<Map>> | ResetNorthProps,
  legacyOptions?: AnimationOptions,
): ResetNorthActions | { resetNorth: (options?: AnimationOptions) => void } {
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

  const {
    execute,
    stopRotating,
    getCurrentBearing,
    getCurrentCamera,
    rotationStatus,
    isRotating,
    logError,
  } = createSimpleRotation(props, 'resetNorth', props.autoReset !== false);

  if (isLegacyAPI) {
    return {
      resetNorth: (options?: AnimationOptions) => {
        execute(options).catch((e) =>
          logError('Error in legacy resetNorth:', e),
        );
      },
    };
  }

  return {
    resetNorth: execute,
    stopRotating,
    getCurrentBearing,
    getCurrentCamera,
    rotationStatus: computed(() => rotationStatus.value),
    isRotating,
  };
}

// --- useResetNorthPitch ---

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

  const {
    execute,
    stopRotating,
    getCurrentBearing,
    getCurrentCamera,
    rotationStatus,
    isRotating,
    logError,
    mapInstance,
  } = createSimpleRotation(props, 'resetNorthPitch', props.autoReset !== false);

  const getCurrentPitch = makeGetPitch(mapInstance, logError);

  if (isLegacyAPI) {
    return {
      resetNorthPitch: (options?: AnimationOptions) => {
        execute(options).catch((e) =>
          logError('Error in legacy resetNorthPitch:', e),
        );
      },
    };
  }

  return {
    resetNorthPitch: execute,
    stopRotating,
    getCurrentBearing,
    getCurrentPitch,
    getCurrentCamera,
    rotationStatus: computed(() => rotationStatus.value),
    isRotating,
  };
}

// --- useSnapToNorth ---

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

  const {
    execute,
    stopRotating,
    getCurrentBearing,
    getCurrentCamera,
    rotationStatus,
    isRotating,
    logError,
  } = createSimpleRotation(props, 'snapToNorth', props.autoSnap !== false);

  if (isLegacyAPI) {
    return {
      snapToNorth: (options?: AnimationOptions) => {
        execute(options).catch((e) =>
          logError('Error in legacy snapToNorth:', e),
        );
      },
    };
  }

  return {
    snapToNorth: execute,
    stopRotating,
    getCurrentBearing,
    getCurrentCamera,
    rotationStatus: computed(() => rotationStatus.value),
    isRotating,
  };
}
