import { ref, computed, unref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import {
  AnimationStatus,
  type CameraAnimationConfig,
  type CameraAnimationResult,
} from './cameraAnimationTypes';
import type { CameraOptions } from 'maplibre-gl';

/** Property MapLibre copies from `eventData` onto every movement event it emits. */
const ANIMATION_ID_KEY = 'vmlAnimationId';

/**
 * Module-wide so ids stay unique across every composable sharing one map:
 * each instance only ever settles on events carrying its own id.
 */
let nextAnimationId = 0;

/**
 * Generic factory for creating camera animation composables.
 * Handles: map validation, promise wrapping, completion events, timeout, status tracking, cleanup.
 *
 * @param config - Camera animation configuration
 * @returns Shared animation utilities
 */
export function createCameraAnimation(
  config: CameraAnimationConfig,
): CameraAnimationResult {
  const { logError } = useLogger(config.debug ?? false);
  const animationStatus = ref<AnimationStatus>(AnimationStatus.NotStarted);
  /** Id of the most recent call; only its completion may move the status on. */
  let activeAnimationId = 0;

  const mapInstance = computed(() => unref(config.map));
  const isAnimating = computed(
    () => animationStatus.value === AnimationStatus.Running,
  );

  /**
   * Execute a map camera method, wrapping it in a Promise that resolves on a completion event.
   *
   * Every call is tagged with an `eventData` token passed as the method's
   * trailing argument, and only a completion event carrying that token settles
   * the promise. MapLibre starts `easeTo` / `flyTo` by stopping any in-flight
   * ease, which synchronously fires that ease's `moveend` from inside the new
   * call — an untagged listener would mistake it for its own completion. Since
   * the token rides on the event, a zero-duration ease (which fires `moveend`
   * synchronously as well) resolves through the same path.
   *
   * Map `error` events are not treated as animation failures: MapLibre fires
   * them for unrelated problems such as tile fetches, and the ease keeps going.
   *
   * @param method - Map method name to call (e.g., 'flyTo', 'easeTo', 'zoomTo')
   * @param args - Arguments to pass to the map method. When a completion event is given, they must fill every parameter before `eventData` (pass `undefined` for omitted options).
   * @param completionEvent - Event to listen for completion (e.g., 'moveend'). If omitted, resolves immediately (instant operations like jumpTo).
   * @param timeout - Optional timeout in ms. On timeout: calls map.stop(), cleans up listener, rejects. Default: no timeout (backward compat).
   */
  function executeAnimation(
    method: string,
    args: any[],
    completionEvent?: string,
    timeout?: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const map = mapInstance.value;
      if (!map) {
        reject(new Error('Map instance not available'));
        return;
      }

      const animationId = ++nextAnimationId;
      activeAnimationId = animationId;
      animationStatus.value = AnimationStatus.Running;

      // A later call supersedes this one; its own completion owns the status.
      const settle = (status: AnimationStatus) => {
        if (activeAnimationId === animationId) animationStatus.value = status;
      };

      try {
        // No completion event = instant operation (e.g., jumpTo)
        if (!completionEvent) {
          (map as any)[method](...args);
          settle(AnimationStatus.Completed);
          resolve();
          return;
        }

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          map.off(completionEvent as any, onComplete);
        };

        const onComplete = (event: any) => {
          if (event?.[ANIMATION_ID_KEY] !== animationId) return;
          cleanup();
          settle(AnimationStatus.Completed);
          resolve();
        };

        map.on(completionEvent as any, onComplete);

        // Opt-in timeout. Detach first: `map.stop()` fires this animation's
        // completion synchronously, which would otherwise resolve before the
        // rejection.
        if (timeout && timeout > 0) {
          timeoutId = setTimeout(() => {
            cleanup();
            try {
              map.stop();
            } catch {
              // map may be destroyed
            }
            settle(AnimationStatus.Error);
            reject(new Error(`Animation timed out after ${timeout}ms`));
          }, timeout);
        }

        try {
          (map as any)[method](...args, { [ANIMATION_ID_KEY]: animationId });
        } catch (error) {
          cleanup();
          throw error;
        }
      } catch (error) {
        settle(AnimationStatus.Error);
        logError(`Error executing ${method} animation:`, error);
        reject(error);
      }
    });
  }

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

  function stopAnimation(): void {
    const map = mapInstance.value;
    if (!map) return;
    try {
      map.stop();
      animationStatus.value = AnimationStatus.Completed;
    } catch (error) {
      logError('Error stopping animation:', error);
    }
  }

  onUnmounted(() => {
    stopAnimation();
    animationStatus.value = AnimationStatus.NotStarted;
  });

  return {
    executeAnimation,
    getCurrentCamera,
    stopAnimation,
    animationStatus: computed(() => animationStatus.value),
    isAnimating,
    mapInstance,
  };
}
