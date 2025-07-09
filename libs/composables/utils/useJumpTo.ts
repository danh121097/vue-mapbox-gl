import { watchEffect, ref, computed, unref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, Undefinedable } from '@libs/types';
import type { MaybeRef } from 'vue';
import type {
  Map,
  JumpToOptions,
  LngLatLike,
  CameraOptions,
} from 'maplibre-gl';

/**
 * Jump animation status enum for better state management
 */
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
  jumpStatus: Readonly<JumpStatus>;
  isJumping: boolean;
}

/**
 * Composable for managing instant map camera jumps with enhanced error handling
 * Provides reactive jump-to functionality with validation and debugging capabilities
 *
 * @param props - Configuration options for jump-to functionality
 * @returns Enhanced actions and state for camera jumps
 */
export function useJumpTo(props: JumpToProps): JumpToActions;

/**
 * Legacy overload for backward compatibility
 * @deprecated Use the new props-based interface for better type safety and features
 */
export function useJumpTo(
  map: MaybeRef<Nullable<Map>>,
  options?: JumpToOptions,
): { jumpTo: (options?: JumpToOptions) => void };

export function useJumpTo(
  mapOrProps: MaybeRef<Nullable<Map>> | JumpToProps,
  legacyOptions?: JumpToOptions,
): JumpToActions | { jumpTo: (options?: JumpToOptions) => void } {
  // Handle legacy API for backward compatibility
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

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isJumping = computed(() => jumpStatus.value === JumpStatus.Jumping);

  /**
   * Validates if jump operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateJumpOperation(): boolean {
    const map = mapInstance.value;
    if (!map) return false;
    return true;
  }

  /**
   * Validates jump options for correctness
   * @param options - Jump options to validate
   * @returns boolean indicating if options are valid
   */
  function validateJumpOptions(options: JumpToOptions): boolean {
    if (!options) return false;

    // Validate center coordinates if provided
    if (options.center) {
      if (Array.isArray(options.center)) {
        if (options.center.length !== 2) {
          return false;
        }
        const [lng, lat] = options.center;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          return false;
        }
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          return false;
        }
      }
    }

    // Validate zoom level if provided
    if (options.zoom !== undefined) {
      if (
        typeof options.zoom !== 'number' ||
        options.zoom < 0 ||
        options.zoom > 24
      ) {
        return false;
      }
    }

    // Validate bearing if provided
    if (options.bearing !== undefined) {
      if (typeof options.bearing !== 'number') {
        return false;
      }
    }

    // Validate pitch if provided
    if (options.pitch !== undefined) {
      if (
        typeof options.pitch !== 'number' ||
        options.pitch < 0 ||
        options.pitch > 60
      ) {
        return false;
      }
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
   * Performs jump-to operation with enhanced error handling and validation
   * @param options - Jump-to options
   */
  function jumpTo(options?: JumpToOptions): void {
    if (!validateJumpOperation()) return;

    const finalOptions = options || jumpOptions.value;
    if (!finalOptions) return;

    if (!validateJumpOptions(finalOptions)) {
      jumpStatus.value = JumpStatus.Error;
      return;
    }

    const map = mapInstance.value!;
    jumpStatus.value = JumpStatus.Jumping;

    try {
      // Store options for future use
      if (options) jumpOptions.value = options;

      // Perform the jump
      map.jumpTo(finalOptions);

      jumpStatus.value = JumpStatus.Completed;
    } catch (error) {
      jumpStatus.value = JumpStatus.Error;
      logError('Error performing jump-to operation:', error);
    }
  }

  /**
   * Jumps to a specific center coordinate
   * @param center - Target center coordinate
   * @param options - Additional jump options (excluding center)
   */
  function jumpToCenter(
    center: LngLatLike,
    options?: Omit<JumpToOptions, 'center'>,
  ): void {
    jumpTo({ ...options, center });
  }

  /**
   * Jumps to a specific zoom level
   * @param zoom - Target zoom level
   * @param options - Additional jump options (excluding zoom)
   */
  function jumpToZoom(
    zoom: number,
    options?: Omit<JumpToOptions, 'zoom'>,
  ): void {
    jumpTo({ ...options, zoom });
  }

  /**
   * Jumps to a specific bearing
   * @param bearing - Target bearing in degrees
   * @param options - Additional jump options (excluding bearing)
   */
  function jumpToBearing(
    bearing: number,
    options?: Omit<JumpToOptions, 'bearing'>,
  ): void {
    jumpTo({ ...options, bearing });
  }

  /**
   * Jumps to a specific pitch
   * @param pitch - Target pitch in degrees
   * @param options - Additional jump options (excluding pitch)
   */
  function jumpToPitch(
    pitch: number,
    options?: Omit<JumpToOptions, 'pitch'>,
  ): void {
    jumpTo({ ...options, pitch });
  }

  // Watch for map and options changes
  watchEffect(() => {
    const map = mapInstance.value;
    if (
      map &&
      jumpOptions.value &&
      props.autoJump !== false &&
      jumpStatus.value === JumpStatus.NotStarted
    ) {
      jumpTo(jumpOptions.value);
    }
  });

  // Cleanup function
  function cleanup(): void {
    jumpStatus.value = JumpStatus.Completed;
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  // Return appropriate interface based on API version
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
    jumpStatus: jumpStatus.value as Readonly<JumpStatus>,
    isJumping: isJumping.value,
  };
}
