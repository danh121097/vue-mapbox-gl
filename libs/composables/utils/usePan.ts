import { watch, ref, computed, unref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import { createCameraAnimation } from './createCameraAnimation';
import type { Nullable, Undefinedable } from '@libs/types';
import type { ComputedRef, MaybeRef } from 'vue';
import type {
  Map,
  AnimationOptions,
  PointLike,
  LngLatLike,
  CameraOptions,
} from 'maplibre-gl';

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
  panStatus: ComputedRef<PanStatus>;
  isPanning: ComputedRef<boolean>;
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
  panStatus: ComputedRef<PanStatus>;
  isPanning: ComputedRef<boolean>;
}

function validatePanOffset(offset: PointLike): boolean {
  if (!offset) return false;
  if (Array.isArray(offset)) {
    return (
      offset.length === 2 &&
      typeof offset[0] === 'number' &&
      typeof offset[1] === 'number'
    );
  }
  if (typeof offset === 'object') {
    return typeof offset.x === 'number' && typeof offset.y === 'number';
  }
  return false;
}

function validatePanTarget(lnglat: LngLatLike): boolean {
  if (!lnglat) return false;
  if (Array.isArray(lnglat)) {
    if (lnglat.length !== 2) return false;
    const [lng, lat] = lnglat;
    return (
      typeof lng === 'number' &&
      typeof lat === 'number' &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90
    );
  }
  if (typeof lnglat === 'object') {
    const hasLngLat = 'lng' in lnglat && 'lat' in lnglat;
    const hasLonLat = 'lon' in lnglat && 'lat' in lnglat;
    return hasLngLat || hasLonLat;
  }
  return false;
}

// --- usePanBy ---

export function usePanBy(props: PanByProps): PanByActions;
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
  const mapInstance = computed(() => unref(props.map));
  const isPanning = computed(() => panStatus.value === PanStatus.Panning);

  const { executeAnimation, getCurrentCamera, stopAnimation } =
    createCameraAnimation({ map: props.map, debug: props.debug });

  function panBy(
    offsetVal: PointLike,
    options?: AnimationOptions,
  ): Promise<void> {
    if (!validatePanOffset(offsetVal)) {
      panStatus.value = PanStatus.Error;
      return Promise.reject(new Error('Invalid pan offset'));
    }
    offset.value = offsetVal;
    if (options) animationOptions.value = options;
    const finalOptions = options || animationOptions.value;
    panStatus.value = PanStatus.Panning;

    // Without options MapLibre still eases over its default duration, so the
    // call is awaited either way. `finalOptions` may be undefined: it must
    // still occupy the options slot so the completion token lands in `eventData`.
    return executeAnimation('panBy', [offsetVal, finalOptions], 'moveend')
      .then(() => {
        panStatus.value = PanStatus.Completed;
      })
      .catch((error) => {
        panStatus.value = PanStatus.Error;
        throw error;
      });
  }

  function stopPanning(): void {
    stopAnimation();
    panStatus.value = PanStatus.Completed;
  }

  // Auto-pan once a map arrives. Watching the map instance rather than
  // running an effect keeps `panStatus` — which `panBy` writes — out of the
  // dependency set.
  watch(
    mapInstance,
    (map) => {
      if (
        map &&
        offset.value &&
        props.autoPan !== false &&
        panStatus.value === PanStatus.NotStarted
      ) {
        panBy(offset.value, animationOptions.value).catch((e) =>
          logError('Error in auto panBy:', e),
        );
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    panStatus.value = PanStatus.Completed;
  });

  if (isLegacyAPI) {
    return {
      panBy: (offsetVal: PointLike, options?: AnimationOptions) => {
        panBy(offsetVal, options).catch((e) =>
          logError('Error in legacy panBy:', e),
        );
      },
    };
  }

  return {
    panBy,
    stopPanning,
    getCurrentCamera,
    validatePanOffset,
    panStatus: computed(() => panStatus.value),
    isPanning,
  };
}

// --- usePanTo ---

export function usePanTo(props: PanToProps): PanToActions;
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

  const { logError } = useLogger(props.debug ?? false);
  const lnglat = ref<LngLatLike | undefined>(props.lnglat);
  const animationOptions = ref<Undefinedable<AnimationOptions>>(props.options);
  const panStatus = ref<PanStatus>(PanStatus.NotStarted);
  const mapInstance = computed(() => unref(props.map));
  const isPanning = computed(() => panStatus.value === PanStatus.Panning);

  const { executeAnimation, getCurrentCamera, stopAnimation } =
    createCameraAnimation({ map: props.map, debug: props.debug });

  function panTo(
    lnglatVal: LngLatLike,
    options?: AnimationOptions,
  ): Promise<void> {
    if (!validatePanTarget(lnglatVal)) {
      panStatus.value = PanStatus.Error;
      return Promise.reject(new Error('Invalid pan target coordinates'));
    }
    lnglat.value = lnglatVal;
    if (options) animationOptions.value = options;
    const finalOptions = options || animationOptions.value;
    panStatus.value = PanStatus.Panning;

    // Without options MapLibre still eases over its default duration, so the
    // call is awaited either way. `finalOptions` may be undefined: it must
    // still occupy the options slot so the completion token lands in `eventData`.
    return executeAnimation('panTo', [lnglatVal, finalOptions], 'moveend')
      .then(() => {
        panStatus.value = PanStatus.Completed;
      })
      .catch((error) => {
        panStatus.value = PanStatus.Error;
        throw error;
      });
  }

  function stopPanning(): void {
    stopAnimation();
    panStatus.value = PanStatus.Completed;
  }

  // Auto-pan once a map arrives — see the note in `usePanBy`.
  watch(
    mapInstance,
    (map) => {
      if (
        map &&
        lnglat.value &&
        props.autoPan !== false &&
        panStatus.value === PanStatus.NotStarted
      ) {
        panTo(lnglat.value, animationOptions.value).catch((e) =>
          logError('Error in auto panTo:', e),
        );
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    panStatus.value = PanStatus.Completed;
  });

  if (isLegacyAPI) {
    return {
      panTo: (lnglatVal: LngLatLike, options?: AnimationOptions) => {
        panTo(lnglatVal, options).catch((e) =>
          logError('Error in legacy panTo:', e),
        );
      },
    };
  }

  return {
    panTo,
    stopPanning,
    getCurrentCamera,
    validatePanTarget,
    panStatus: computed(() => panStatus.value),
    isPanning,
  };
}
