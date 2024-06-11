import { onUnmounted, shallowRef, watchEffect } from 'vue';
import type { Nullable } from '@libs/types';
import type { GeolocateEventTypes } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { GeolocateControl } from 'maplibre-gl';

interface GeolocateEventProps {
  geolocate: MaybeRef<Nullable<GeolocateControl>>;
  event: keyof GeolocateEventTypes;
  on: <T extends keyof GeolocateEventTypes>(e: GeolocateEventTypes[T]) => void;
}

export function useGeolocateEventListener(props: GeolocateEventProps) {
  const geolocateInstance = shallowRef(props.geolocate);

  const geoEventFn = (e: GeolocateEventTypes[keyof GeolocateEventTypes]) => {
    props.on && props.on(e);
  };

  const stopEffect = watchEffect(() => {
    if (geolocateInstance.value)
      geolocateInstance.value.on(props.event, geoEventFn);
  });

  function removeListener() {
    if (geolocateInstance.value)
      geolocateInstance.value.off(props.event, geoEventFn);
  }

  onUnmounted(() => {
    stopEffect();
  });

  return {
    removeListener,
  };
}
