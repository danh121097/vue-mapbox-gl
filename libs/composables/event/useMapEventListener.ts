import {
  createEventListenerComposable,
  EventListenerStatus,
  type EventListenerActions,
} from './createEventListenerComposable';
import type { Nullable, MapEventTypes } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { Map } from 'maplibre-gl';

// Re-export for backward compatibility
export { EventListenerStatus };

/**
 * `T` is inferred from `event`, which is the whole point of it: a handler
 * registered for `'click'` has to receive a `MapMouseEvent`, not the union of
 * every map event. The generic used to sit on `on` itself, where nothing could
 * ever infer it, so `event.lngLat` failed to compile in correct code.
 */
interface MapEventListenerProps<T extends keyof MapEventTypes> {
  map: MaybeRef<Nullable<Map>>;
  event: T;
  on: (e: MapEventTypes[T]) => void;
  debug?: boolean;
  once?: boolean;
}

interface MapEventListenerActions extends EventListenerActions {}

/**
 * Composable for managing MapLibre GL Map Event Listeners
 */
export function useMapEventListener<T extends keyof MapEventTypes>(
  props: MapEventListenerProps<T>,
): MapEventListenerActions {
  return createEventListenerComposable<Map>({
    target: props.map,
    event: props.event as string,
    on: props.on,
    debug: props.debug,
    once: props.once,
    adapter: {
      attach: (map, event, handler) => map.on(event as any, handler),
      detach: (map, event, handler) => map.off(event as any, handler),
    },
  });
}
