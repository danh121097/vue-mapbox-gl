import { watch, ref, computed, unref } from 'vue';
import { useLogger } from '@libs/composables';
import { createCameraAnimation } from './createCameraAnimation';
import type { Nullable, Undefinedable } from '@libs/types';
import type { ComputedRef, MaybeRef } from 'vue';
import type {
  Map,
  EaseToOptions,
  LngLatLike,
  CameraOptions,
} from 'maplibre-gl';

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
  easeStatus: ComputedRef<EaseStatus>;
  isEasing: ComputedRef<boolean>;
}

/**
 * Composable for managing smooth map camera transitions
 */
export function useEaseTo(props: EaseToProps): EaseToActions {
  const { logError, logWarn } = useLogger(props.debug ?? false);
  const easeOptions = ref<Undefinedable<EaseToOptions>>(props.options);
  const easeStatus = ref<EaseStatus>(EaseStatus.NotStarted);

  const mapInstance = computed(() => unref(props.map));
  const isEasing = computed(() => easeStatus.value === EaseStatus.Easing);

  const { executeAnimation, getCurrentCamera, stopAnimation } =
    createCameraAnimation({ map: props.map, debug: props.debug });

  function validateEaseOptions(options: EaseToOptions): boolean {
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
    return true;
  }

  function easeTo(options?: EaseToOptions): Promise<void> {
    const finalOptions = options || easeOptions.value;
    if (!finalOptions)
      return Promise.reject(new Error('No ease options provided'));
    if (!validateEaseOptions(finalOptions)) {
      easeStatus.value = EaseStatus.Error;
      return Promise.reject(new Error('Invalid ease options'));
    }

    if (options) easeOptions.value = options;
    easeStatus.value = EaseStatus.Easing;

    return executeAnimation('easeTo', [finalOptions], 'moveend')
      .then(() => {
        easeStatus.value = EaseStatus.Completed;
      })
      .catch((error) => {
        easeStatus.value = EaseStatus.Error;
        throw error;
      });
  }

  function easeToCenter(
    center: LngLatLike,
    options?: Omit<EaseToOptions, 'center'>,
  ): Promise<void> {
    return easeTo({ ...options, center });
  }

  function easeToZoom(
    zoom: number,
    options?: Omit<EaseToOptions, 'zoom'>,
  ): Promise<void> {
    return easeTo({ ...options, zoom });
  }

  function easeToBearing(
    bearing: number,
    options?: Omit<EaseToOptions, 'bearing'>,
  ): Promise<void> {
    return easeTo({ ...options, bearing });
  }

  function easeToPitch(
    pitch: number,
    options?: Omit<EaseToOptions, 'pitch'>,
  ): Promise<void> {
    return easeTo({ ...options, pitch });
  }

  function stopEasing(): void {
    stopAnimation();
    easeStatus.value = EaseStatus.Completed;
  }

  // Auto-ease once a map arrives. Watching the map instance rather than
  // running an effect keeps `easeStatus` — which `easeTo` writes — out of the
  // dependency set.
  watch(
    mapInstance,
    (map) => {
      if (
        map &&
        easeOptions.value &&
        easeStatus.value === EaseStatus.NotStarted
      ) {
        easeTo(easeOptions.value).catch((error) => {
          logError('Error in auto easeTo:', error);
        });
      }
    },
    { immediate: true },
  );

  return {
    easeTo,
    easeToCenter,
    easeToZoom,
    easeToBearing,
    easeToPitch,
    stopEasing,
    getCurrentCamera,
    easeStatus: computed(() => easeStatus.value),
    isEasing,
  };
}
