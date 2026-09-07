import {
  createEventListenerComposable,
  EventListenerStatus as BaseStatus,
  type EventListenerActions,
} from './createEventListenerComposable';
import type { Nullable, GeolocateEventTypes } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { GeolocateControl } from 'maplibre-gl';

// Re-export with original name for backward compatibility
export { BaseStatus as GeolocateEventListenerStatus };

/** `T` is inferred from `event`, so a `'geolocate'` handler receives a
 * `GeolocateSuccess` rather than the union that also includes the error type. */
interface GeolocateEventListenerProps<T extends keyof GeolocateEventTypes> {
  geolocate: MaybeRef<Nullable<GeolocateControl>>;
  event: T;
  on: (e: GeolocateEventTypes[T]) => void;
  debug?: boolean;
  once?: boolean;
}

interface GeolocateEventListenerActions extends EventListenerActions {}

/**
 * Composable for managing MapLibre GL Geolocate Control Event Listeners
 */
export function useGeolocateEventListener<T extends keyof GeolocateEventTypes>(
  props: GeolocateEventListenerProps<T>,
): GeolocateEventListenerActions {
  return createEventListenerComposable<GeolocateControl>({
    target: props.geolocate,
    event: props.event as string,
    on: props.on,
    debug: props.debug,
    once: props.once,
    adapter: {
      attach: (geolocate, event, handler) =>
        geolocate.on(event as any, handler),
      detach: (geolocate, event, handler) =>
        geolocate.off(event as any, handler),
    },
  });
}
