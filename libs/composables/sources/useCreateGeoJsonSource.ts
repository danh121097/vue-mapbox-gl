import { unref, shallowRef, computed, onUnmounted } from 'vue';
import { getNanoid, getMainVersion, hasSource } from '@libs/helpers';
import { useMapReloadEvent } from '@libs/composables';
import type { MaybeRef, ShallowRef } from 'vue';
import type { Nullable } from '@libs/types';
import type {
  Map,
  GeoJSONSource,
  MapSourceDataEvent,
  SourceSpecification,
} from 'maplibre-gl';

export interface CreateGeoJsonSourceActions {
  sourceId: string;
  getSource: ShallowRef<Nullable<GeoJSONSource>>;
  setData: (data: SourceSpecification) => void;
}

interface CreateGeoJsonSourceProps {
  map: MaybeRef<Nullable<Map>>;
  id?: string;
  data?: SourceSpecification;
  register?: (actions: CreateGeoJsonSourceActions, map: Map) => void;
}

export function useCreateGeoJsonSource({
  map: mapRef,
  id,
  data,
  register,
}: CreateGeoJsonSourceProps) {
  const sourceId = getNanoid(id);
  const source = shallowRef<Nullable<GeoJSONSource>>(null);
  const getSource = computed(() => source.value);

  useMapReloadEvent(mapRef, {
    unLoad: removeSource,
    onLoad: initSource,
  });

  function sourcedataEventFn(e: MapSourceDataEvent) {
    const map = unref(mapRef)!;
    let isSourceLoaded = e.isSourceLoaded;
    if (getMainVersion() > 0) isSourceLoaded = true;

    if (!source.value && e.sourceId === sourceId && isSourceLoaded) {
      source.value = map?.getSource(sourceId) as GeoJSONSource;

      register?.(
        {
          sourceId,
          getSource,
          setData,
        },
        map,
      );
      map?.off('sourcedata', sourcedataEventFn);
    }
  }

  function initSource() {
    const map = unref(mapRef);
    if (map && !source.value && !hasSource(map, sourceId)) {
      if (!data) return;
      map.addSource(sourceId, data);
      map.on('sourcedata', sourcedataEventFn);
    }
  }
  function setData(dataVal: SourceSpecification) {
    const map = unref(mapRef);
    if (map && source.value && hasSource(map, sourceId))
      dataVal && source.value.setData(dataVal as any);
  }

  function removeSource() {
    const map = unref(mapRef);
    source.value = null;
    if (map && hasSource(map, sourceId)) {
      map.removeSource(sourceId);
      map.off('sourcedata', sourcedataEventFn);
    }
  }

  onUnmounted(() => {
    removeSource();
  });

  return {
    sourceId,
    getSource,
    setData,
    removeSource,
  };
}
