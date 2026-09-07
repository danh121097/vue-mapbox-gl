import { watch, ref, computed, unref } from 'vue';
import { useLogger } from '@libs/composables';
import { createCameraAnimation } from './createCameraAnimation';
import type { Nullable, Undefinedable } from '@libs/types';
import type { ComputedRef, MaybeRef } from 'vue';
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
  flyStatus: ComputedRef<FlyStatus>;
  isFlying: ComputedRef<boolean>;
  cleanup: () => void;
}

/**
 * Composable for managing smooth map camera fly animations
 */
export function useFlyTo(props: FlyToProps): FlyToActions {
  const { logWarn, logError } = useLogger(props.debug ?? false);
  const flyOptions = ref<Undefinedable<FlyToOptions>>(props.options);
  const flyStatus = ref<FlyStatus>(FlyStatus.NotStarted);

  const mapInstance = computed(() => unref(props.map));
  const isFlying = computed(() => flyStatus.value === FlyStatus.Flying);

  const { executeAnimation, getCurrentCamera, stopAnimation } =
    createCameraAnimation({ map: props.map, debug: props.debug });

  function validateFlyOptions(options: FlyToOptions): boolean {
    if (!options || typeof options !== 'object') return false;
    if (options.zoom !== undefined && (options.zoom < 0 || options.zoom > 24))
      logWarn('Warning: Zoom level should be between 0 and 24', {
        zoom: options.zoom,
      });
    if (
      options.bearing !== undefined &&
      (options.bearing < -180 || options.bearing > 180)
    )
      logWarn('Warning: Bearing should be between -180 and 180 degrees', {
        bearing: options.bearing,
      });
    if (
      options.pitch !== undefined &&
      (options.pitch < 0 || options.pitch > 60)
    )
      logWarn('Warning: Pitch should be between 0 and 60 degrees', {
        pitch: options.pitch,
      });
    if (options.speed !== undefined && options.speed <= 0)
      logWarn('Warning: Speed should be greater than 0', {
        speed: options.speed,
      });
    if (options.curve !== undefined && options.curve < 0)
      logWarn('Warning: Curve should be non-negative', {
        curve: options.curve,
      });
    return true;
  }

  function flyTo(options?: FlyToOptions): Promise<void> {
    const finalOptions = options || flyOptions.value;
    if (!finalOptions)
      return Promise.reject(new Error('No fly options provided'));
    if (!validateFlyOptions(finalOptions)) {
      flyStatus.value = FlyStatus.Error;
      return Promise.reject(new Error('Invalid fly options'));
    }

    if (options) flyOptions.value = options;
    flyStatus.value = FlyStatus.Flying;

    return executeAnimation('flyTo', [finalOptions], 'moveend')
      .then(() => {
        flyStatus.value = FlyStatus.Completed;
      })
      .catch((error) => {
        flyStatus.value = FlyStatus.Error;
        throw error;
      });
  }

  function flyToCenter(
    center: LngLatLike,
    options?: Omit<FlyToOptions, 'center'>,
  ): Promise<void> {
    return flyTo({ ...options, center });
  }

  function flyToZoom(
    zoom: number,
    options?: Omit<FlyToOptions, 'zoom'>,
  ): Promise<void> {
    return flyTo({ ...options, zoom });
  }

  function flyToBearing(
    bearing: number,
    options?: Omit<FlyToOptions, 'bearing'>,
  ): Promise<void> {
    return flyTo({ ...options, bearing });
  }

  function flyToPitch(
    pitch: number,
    options?: Omit<FlyToOptions, 'pitch'>,
  ): Promise<void> {
    return flyTo({ ...options, pitch });
  }

  function stopFlying(): void {
    stopAnimation();
    flyStatus.value = FlyStatus.Completed;
  }

  // Auto-fly once a map arrives. Watching the map instance rather than
  // running an effect keeps `flyStatus` — which `flyTo` writes — out of the
  // dependency set.
  const stopAutoFly = watch(
    mapInstance,
    (map) => {
      if (map && flyOptions.value && flyStatus.value === FlyStatus.NotStarted) {
        flyTo(flyOptions.value).catch((error) => {
          logError('Error in auto flyTo:', error);
        });
      }
    },
    { immediate: true },
  );

  function cleanup(): void {
    try {
      stopFlying();
      stopAutoFly();
      flyOptions.value = undefined;
      flyStatus.value = FlyStatus.NotStarted;
    } catch (error) {
      logError('Error during useFlyTo cleanup:', error);
    }
  }

  return {
    flyTo,
    flyToCenter,
    flyToZoom,
    flyToBearing,
    flyToPitch,
    stopFlying,
    getCurrentCamera,
    flyStatus: computed(() => flyStatus.value),
    isFlying,
    cleanup,
  };
}
