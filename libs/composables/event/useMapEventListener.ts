import { onUnmounted, unref, watchEffect } from 'vue';
import type { Nullable, MapEventTypes } from '@libs/types';
import type { MaybeRef } from 'vue';
import type { Map } from 'maplibre-gl';

interface MapEventProps {
  map: MaybeRef<Nullable<Map>>;
  event: keyof MapEventTypes;
  on: <T extends keyof MapEventTypes>(e: MapEventTypes[T]) => void;
}

export function useMapEventListener(props: MapEventProps) {
  const mapEventFn = (e: MapEventTypes[keyof MapEventTypes]) => {
    props.on && props.on(e);
  };

  const stopEffect = watchEffect((onCleanUp) => {
    const map = unref(props.map);
    if (map) map.on(props.event, mapEventFn);
    onCleanUp(removeListener);
  });

  function removeListener() {
    const map = unref(props.map);
    if (map) map.off(props.event, mapEventFn);
  }

  onUnmounted(() => {
    stopEffect();
  });

  return {
    removeListener,
  };
}
