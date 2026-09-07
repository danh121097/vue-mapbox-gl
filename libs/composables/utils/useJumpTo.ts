import { watch, ref, computed, unref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import { createCameraAnimation } from './createCameraAnimation';
import type { Nullable, Undefinedable } from '@libs/types';
import type { ComputedRef, MaybeRef } from 'vue';
import type {
  Map,
  JumpToOptions,
  LngLatLike,
  CameraOptions,
} from 'maplibre-gl';

export enum JumpStatus {
  NotStarted = 'not-started',
  Jumping = 'jumping',
  Completed = 'completed',
  Error = 'error',
}

interface JumpToProps {
  map: MaybeRef<Nullable<Map>>;
  options?: JumpToOptions;
  debug?: boolean;
  autoJump?: boolean;
}

interface JumpToActions {
  jumpTo: (options?: JumpToOptions) => void;
  jumpToCenter: (
    center: LngLatLike,
    options?: Omit<JumpToOptions, 'center'>,
  ) => void;
  jumpToZoom: (zoom: number, options?: Omit<JumpToOptions, 'zoom'>) => void;
  jumpToBearing: (
    bearing: number,
    options?: Omit<JumpToOptions, 'bearing'>,
  ) => void;
  jumpToPitch: (pitch: number, options?: Omit<JumpToOptions, 'pitch'>) => void;
  getCurrentCamera: () => CameraOptions | null;
  validateJumpOptions: (options: JumpToOptions) => boolean;
  jumpStatus: ComputedRef<JumpStatus>;
  isJumping: ComputedRef<boolean>;
}

/**
 * Composable for managing instant map camera jumps
 */
export function useJumpTo(props: JumpToProps): JumpToActions;

/** Legacy overload for backward compatibility */
export function useJumpTo(
  map: MaybeRef<Nullable<Map>>,
  options?: JumpToOptions,
): { jumpTo: (options?: JumpToOptions) => void };

export function useJumpTo(
  mapOrProps: MaybeRef<Nullable<Map>> | JumpToProps,
  legacyOptions?: JumpToOptions,
): JumpToActions | { jumpTo: (options?: JumpToOptions) => void } {
  const isLegacyAPI =
    legacyOptions !== undefined || !('map' in (mapOrProps as any));
  const props: JumpToProps = isLegacyAPI
    ? {
        map: mapOrProps as MaybeRef<Nullable<Map>>,
        options: legacyOptions,
        debug: false,
        autoJump: true,
      }
    : (mapOrProps as JumpToProps);

  const { logError } = useLogger(props.debug ?? false);
  const jumpOptions = ref<Undefinedable<JumpToOptions>>(props.options);
  const jumpStatus = ref<JumpStatus>(JumpStatus.NotStarted);

  const mapInstance = computed(() => unref(props.map));
  const isJumping = computed(() => jumpStatus.value === JumpStatus.Jumping);

  // Instant operation — no completion event, resolves as soon as the call returns
  const { executeAnimation, getCurrentCamera } = createCameraAnimation({
    map: props.map,
    debug: props.debug,
  });

  function validateJumpOptions(options: JumpToOptions): boolean {
    if (!options) return false;
    if (options.center && Array.isArray(options.center)) {
      if (options.center.length !== 2) return false;
      const [lng, lat] = options.center;
      if (typeof lng !== 'number' || typeof lat !== 'number') return false;
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
    }
    if (
      options.zoom !== undefined &&
      (typeof options.zoom !== 'number' ||
        options.zoom < 0 ||
        options.zoom > 24)
    )
      return false;
    if (options.bearing !== undefined && typeof options.bearing !== 'number')
      return false;
    if (
      options.pitch !== undefined &&
      (typeof options.pitch !== 'number' ||
        options.pitch < 0 ||
        options.pitch > 60)
    )
      return false;
    return true;
  }

  function jumpTo(options?: JumpToOptions): void {
    const finalOptions = options || jumpOptions.value;
    if (!finalOptions) return;
    if (!validateJumpOptions(finalOptions)) {
      jumpStatus.value = JumpStatus.Error;
      return;
    }

    if (options) jumpOptions.value = options;
    jumpStatus.value = JumpStatus.Jumping;

    // No completion event — instant resolve
    executeAnimation('jumpTo', [finalOptions])
      .then(() => {
        jumpStatus.value = JumpStatus.Completed;
      })
      .catch((error) => {
        jumpStatus.value = JumpStatus.Error;
        logError('Error performing jump-to operation:', error);
      });
  }

  function jumpToCenter(
    center: LngLatLike,
    options?: Omit<JumpToOptions, 'center'>,
  ): void {
    jumpTo({ ...options, center });
  }

  function jumpToZoom(
    zoom: number,
    options?: Omit<JumpToOptions, 'zoom'>,
  ): void {
    jumpTo({ ...options, zoom });
  }

  function jumpToBearing(
    bearing: number,
    options?: Omit<JumpToOptions, 'bearing'>,
  ): void {
    jumpTo({ ...options, bearing });
  }

  function jumpToPitch(
    pitch: number,
    options?: Omit<JumpToOptions, 'pitch'>,
  ): void {
    jumpTo({ ...options, pitch });
  }

  // Auto-jump once a map arrives. Watching the map instance rather than
  // running an effect keeps `jumpStatus` — which `jumpTo` writes — out of the
  // dependency set.
  watch(
    mapInstance,
    (map) => {
      if (
        map &&
        jumpOptions.value &&
        props.autoJump !== false &&
        jumpStatus.value === JumpStatus.NotStarted
      ) {
        jumpTo(jumpOptions.value);
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    jumpStatus.value = JumpStatus.Completed;
  });

  if (isLegacyAPI) {
    return { jumpTo };
  }

  return {
    jumpTo,
    jumpToCenter,
    jumpToZoom,
    jumpToBearing,
    jumpToPitch,
    getCurrentCamera,
    validateJumpOptions,
    jumpStatus: computed(() => jumpStatus.value),
    isJumping,
  };
}
