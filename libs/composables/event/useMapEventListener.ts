import { onUnmounted, unref, watchEffect } from 'vue';
import type { Nullable, MapEventTypes } from '@libs/types';
import type { Map } from 'maplibre-gl';
import type { MaybeRef } from 'vue';

interface LayerEventProps {
  map: MaybeRef<Nullable<Map>>;
  event: keyof MapEventTypes;
  on: <T extends keyof MapEventTypes>(e: MapEventTypes[T]) => void;
}

export function useMapEventListener(props: LayerEventProps) {
  console.log('goo');

  const layerEventFn = (e: MapEventTypes[keyof MapEventTypes]) => {
    props.on && props.on(e);
  };

  const stopEffect = watchEffect((onCleanUp) => {
    const map = unref(props.map);
    if (map) map.on(props.event, layerEventFn);
    onCleanUp(removeListener);
  });

  function removeListener() {
    const map = unref(props.map);
    if (map) map.off(props.event, layerEventFn);
  }

  onUnmounted(() => {
    stopEffect();
  });

  return {
    removeListener,
  };
}
