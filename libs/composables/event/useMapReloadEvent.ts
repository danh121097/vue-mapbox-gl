import { watchEffect, onUnmounted, unref } from 'vue';
import type { MaybeRef } from 'vue';
import type { Nullable } from '@libs/types';
import type { Map } from 'maplibre-gl';

interface CallBackFn {
  (map: Map): void;
}

export function useMapReloadEvent(
  mapRef: MaybeRef<Nullable<Map>>,
  cb: {
    unLoad?: CallBackFn;
    onLoad: CallBackFn;
  },
) {
  const map = unref(mapRef);

  let isMapLoad = !!map?._loaded;

  isMapLoad && loadEventFn(true);

  function unLoadEventFn() {
    const map = unref(mapRef);
    if (!isMapLoad) return;
    isMapLoad = false;
    cb.unLoad && cb.unLoad(map!);
  }

  function loadEventFn(isForce: boolean = false) {
    const map = unref(mapRef);

    if (isMapLoad && !isForce) return;
    isMapLoad = true;
    cb.onLoad && cb.onLoad(map!);
  }

  function clear() {
    const map = unref(mapRef);
    if (map) {
      map.off('styledata', loadEventFn);
      map.off('styledataloading', unLoadEventFn);
      map.off('load', loadEventFn);
    }
  }

  const stopEffect = watchEffect((onCleanUp) => {
    const map = unref(mapRef);
    if (!map) return;
    if (!isMapLoad) map.on('load', loadEventFn);
    else loadEventFn();

    map.on('styledata', loadEventFn);
    map.on('styledataloading', unLoadEventFn);
    onCleanUp(clear);
  });

  onUnmounted(() => {
    unLoadEventFn();
    stopEffect();
    clear();
  });

  return {
    clear,
  };
}
