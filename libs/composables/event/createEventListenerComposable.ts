import { onUnmounted, unref, watch, computed, ref } from 'vue';
import { useLogger } from '@libs/composables';
import type { ComputedRef, MaybeRef } from 'vue';
import type { Nullable } from '@libs/types';

/**
 * Shared event listener status enum used by all event listener composables
 */
export enum EventListenerStatus {
  NotAttached = 'not-attached',
  Attached = 'attached',
  Error = 'error',
}

/**
 * Adapter functions for attaching/detaching events on different target types
 */
export interface EventListenerAdapter<TTarget> {
  attach: (
    target: TTarget,
    event: string,
    handler: (...args: any[]) => void,
  ) => void;
  detach: (
    target: TTarget,
    event: string,
    handler: (...args: any[]) => void,
  ) => void;
  /** Optional validation before attaching (e.g., hasLayer check) */
  validate?: (target: TTarget) => boolean;
}

export interface EventListenerConfig<TTarget> {
  target: MaybeRef<Nullable<TTarget>>;
  event: string;
  on: (...args: any[]) => void;
  debug?: boolean;
  once?: boolean;
  adapter: EventListenerAdapter<TTarget>;
  /** Additional reactive dependencies that trigger re-evaluation */
  extraDeps?: () => any[];
}

export interface EventListenerActions {
  removeListener: () => void;
  attachListener: () => void;
  isListenerAttached: ComputedRef<boolean>;
  listenerStatus: ComputedRef<EventListenerStatus>;
}

/**
 * Generic factory for creating event listener composables.
 * Handles: status tracking, watchEffect lifecycle, onUnmounted cleanup, idempotent removal.
 *
 * @param config - Event listener configuration
 * @returns Actions and state for the event listener
 */
export function createEventListenerComposable<TTarget>(
  config: EventListenerConfig<TTarget>,
): EventListenerActions {
  const { logError } = useLogger(config.debug ?? false);
  const listenerStatus = ref<EventListenerStatus>(
    EventListenerStatus.NotAttached,
  );

  const targetInstance = computed(() => unref(config.target));
  const isListenerAttached = computed(
    () => listenerStatus.value === EventListenerStatus.Attached,
  );
  // The target the handler is currently on. Detach reads this rather than the
  // ref: by the time a swap's cleanup runs, the ref already points at the
  // incoming target, and detaching there would strand the outgoing one.
  let attachedTarget: Nullable<TTarget> = null;

  // Event handler with error handling and once support
  const eventHandler = (...args: any[]): void => {
    try {
      if (config.on) config.on(...args);
      if (config.once) removeListener();
    } catch (error) {
      logError('Error in event handler:', error, { event: config.event });
      listenerStatus.value = EventListenerStatus.Error;
    }
  };

  /**
   * Attaches the event listener to the target (idempotent)
   */
  function attachListener(): void {
    const target = targetInstance.value;
    if (!target) return;
    if (listenerStatus.value === EventListenerStatus.Attached) return;

    // Run optional validation (e.g., layer exists)
    if (config.adapter.validate && !config.adapter.validate(target)) return;

    try {
      config.adapter.attach(target, config.event, eventHandler);
      attachedTarget = target;
      listenerStatus.value = EventListenerStatus.Attached;
    } catch (error) {
      listenerStatus.value = EventListenerStatus.Error;
      logError('Error attaching event listener:', error, {
        event: config.event,
      });
    }
  }

  /**
   * Removes the event listener from the target (idempotent - safe to call multiple times)
   */
  function removeListener(): void {
    const target = attachedTarget;
    attachedTarget = null;

    if (target) {
      try {
        config.adapter.detach(target, config.event, eventHandler);
      } catch {
        // The target may already be destroyed; cleanup must stay idempotent.
      }
    }
    listenerStatus.value = EventListenerStatus.NotAttached;
  }

  // Re-run whenever the target or an extra dependency changes: detach from
  // wherever the handler is, then attach if the target now validates. The
  // target alone is not enough to key on — a layer listener's target is the
  // map, which stays the same while the layer is created, removed on a style
  // reload, and created again.
  //
  // A `watch` with a getter, not a `watchEffect`: attaching writes the status
  // the effect would otherwise read, so an effect would re-run on its own
  // write and re-attach a `once` listener right after it removed itself.
  const stopEffect = watch(
    () => [targetInstance.value, ...(config.extraDeps?.() ?? [])],
    (_, __, onCleanUp) => {
      attachListener();
      onCleanUp(removeListener);
    },
    { immediate: true },
  );

  function cleanup(): void {
    stopEffect();
    removeListener();
  }

  onUnmounted(cleanup);

  return {
    removeListener,
    attachListener,
    isListenerAttached,
    listenerStatus: computed(() => listenerStatus.value),
  };
}
