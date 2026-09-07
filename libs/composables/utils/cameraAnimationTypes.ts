import type { Nullable } from '@libs/types';
import type { ComputedRef, MaybeRef } from 'vue';
import type { Map, CameraOptions } from 'maplibre-gl';

/**
 * Shared animation status enum used by all camera animation composables
 */
export enum AnimationStatus {
  NotStarted = 'not-started',
  Running = 'running',
  Completed = 'completed',
  Error = 'error',
}

export interface CameraAnimationConfig {
  map: MaybeRef<Nullable<Map>>;
  debug?: boolean;
}

export interface CameraAnimationResult {
  /**
   * Execute an animation on the map, resolving when the completion event fires.
   * With a completion event, `args` must fill every parameter before the map
   * method's `eventData` (pass `undefined` for omitted options) — the factory
   * appends a token there and only settles on events that carry it.
   */
  executeAnimation: (
    method: string,
    args: any[],
    completionEvent?: string,
    timeout?: number,
  ) => Promise<void>;
  /** Get current camera state */
  getCurrentCamera: () => CameraOptions | null;
  /** Stop any in-flight animation */
  stopAnimation: () => void;
  /** Current animation status */
  animationStatus: ComputedRef<AnimationStatus>;
  /** Whether animation is currently running */
  isAnimating: ComputedRef<boolean>;
  /** Resolved map instance (computed) */
  mapInstance: ComputedRef<Nullable<Map>>;
}
