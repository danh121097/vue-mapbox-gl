import {
  unref,
  shallowRef,
  computed,
  onUnmounted,
  onMounted,
  nextTick,
} from 'vue';
import { getMainVersion, getNanoid, hasSource } from '@libs/helpers';
import { useMapReloadEvent } from '@libs/composables';
import type { MaybeRef, ShallowRef } from 'vue';
import type { Nullable } from '@libs/types';
import type {
  Map,
  GeoJSONSource,
  MapSourceDataEvent,
  GeoJSONSourceSpecification,
} from 'maplibre-gl';

export interface CreateGeoJsonSourceActions {
  sourceId: string;
  getSource: ShallowRef<Nullable<GeoJSONSource>>;
  setData: (data: GeoJSONSourceSpecification['data']) => void;
}

interface CreateGeoJsonSourceProps {
  map: MaybeRef<Nullable<Map>>;
  id?: string;
  data: GeoJSONSourceSpecification['data'];
  options?: Partial<GeoJSONSourceSpecification>;
  register?: (actions: CreateGeoJsonSourceActions, map: Map) => void;
}

const defaultData: GeoJSONSourceSpecification['data'] = {
  type: 'FeatureCollection',
  features: [],
};

export function useCreateGeoJsonSource({
  map: mapRef,
  id,
  data = defaultData,
  options = {},
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

      map.addSource(sourceId, {
        ...options,
        type: 'geojson',
        data,
      });

      map.on('sourcedata', sourcedataEventFn);
    }
  }

  function setData(data: GeoJSONSourceSpecification['data']) {
    const map = unref(mapRef);

    if (map && source.value && hasSource(map, sourceId))
      data && source.value.setData(data);
  }

  function removeSource() {
    const map = unref(mapRef);
    source.value = null;
    if (map && hasSource(map, sourceId)) {
      map.removeSource(sourceId);
      map.off('sourcedata', sourcedataEventFn);
    }
  }

  onMounted(async () => {
    await nextTick();
    initSource();
  });

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
