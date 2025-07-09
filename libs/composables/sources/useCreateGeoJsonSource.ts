import {
  unref,
  shallowRef,
  computed,
  onUnmounted,
  onMounted,
  nextTick,
  ref,
} from 'vue';
import { getMainVersion, getNanoid, hasSource } from '@libs/helpers';
import { useMapReloadEvent, useLogger } from '@libs/composables';
import type { MaybeRef, ShallowRef } from 'vue';
import type { Nullable } from '@libs/types';
import type {
  Map,
  GeoJSONSource,
  MapSourceDataEvent,
  GeoJSONSourceSpecification,
} from 'maplibre-gl';

/**
 * Source creation status enum for better state management
 */
export enum SourceStatus {
  NotCreated = 'not-created',
  Creating = 'creating',
  Created = 'created',
  Error = 'error',
}

export interface CreateGeoJsonSourceActions {
  sourceId: string;
  getSource: ShallowRef<Nullable<GeoJSONSource>>;
  setData: (data: GeoJSONSourceSpecification['data']) => void;
  removeSource: () => void;
  refreshSource: () => void;
  sourceStatus: Readonly<SourceStatus>;
  isSourceReady: boolean;
}

interface CreateGeoJsonSourceProps {
  map: MaybeRef<Nullable<Map>>;
  id?: string;
  data: GeoJSONSourceSpecification['data'];
  options?: Partial<GeoJSONSourceSpecification>;
  debug?: boolean;
  register?: (actions: CreateGeoJsonSourceActions, map: Map) => void;
}

/**
 * Default empty GeoJSON data structure
 */
const DEFAULT_GEOJSON_DATA: GeoJSONSourceSpecification['data'] = {
  type: 'FeatureCollection',
  features: [],
};

/**
 * Composable for creating and managing MapLibre GL GeoJSON Sources
 * Provides reactive GeoJSON source with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for the GeoJSON source
 * @returns Enhanced actions and state for the GeoJSON source
 */
export function useCreateGeoJsonSource({
  map: mapRef,
  id,
  data = DEFAULT_GEOJSON_DATA,
  options = {},
  debug = false,
  register,
}: CreateGeoJsonSourceProps): CreateGeoJsonSourceActions {
  const { logError } = useLogger(debug);
  const sourceId = getNanoid(id);
  const source = shallowRef<Nullable<GeoJSONSource>>(null);
  const sourceStatus = ref<SourceStatus>(SourceStatus.NotCreated);

  // Computed properties for better reactivity and performance
  const getSource = computed(() => source.value);
  const mapInstance = computed(() => unref(mapRef));
  const isSourceReady = computed(
    () =>
      sourceStatus.value === SourceStatus.Created &&
      !!source.value &&
      !!mapInstance.value &&
      hasSource(mapInstance.value, sourceId),
  );

  useMapReloadEvent({
    map: mapRef,
    callbacks: {
      onUnload: removeSource,
      onLoad: initSource,
    },
    debug,
  });

  /**
   * Handles source data events with enhanced error handling
   * @param e - Map source data event
   */
  function sourcedataEventFn(e: MapSourceDataEvent): void {
    try {
      const map = mapInstance.value;
      if (!map) return;

      let isSourceLoaded = e.isSourceLoaded;
      if (getMainVersion() > 0) isSourceLoaded = true;

      if (!source.value && e.sourceId === sourceId && isSourceLoaded) {
        source.value = map.getSource(sourceId) as GeoJSONSource;
        sourceStatus.value = SourceStatus.Created;

        register?.(
          {
            sourceId,
            getSource,
            setData,
            removeSource,
            refreshSource,
            sourceStatus: sourceStatus.value as Readonly<SourceStatus>,
            isSourceReady: isSourceReady.value,
          },
          map,
        );
        map.off('sourcedata', sourcedataEventFn);
      }
    } catch (error) {
      sourceStatus.value = SourceStatus.Error;
      logError('Error in source data event handler:', error);
    }
  }

  /**
   * Initializes the GeoJSON source with enhanced error handling
   */
  function initSource(): void {
    const map = mapInstance.value;

    if (!map) return;

    if (source.value || hasSource(map, sourceId)) return;

    if (!data) return;

    sourceStatus.value = SourceStatus.Creating;

    try {
      const sourceSpec: GeoJSONSourceSpecification = {
        ...options,
        type: 'geojson',
        data,
      };

      map.addSource(sourceId, sourceSpec);
      map.on('sourcedata', sourcedataEventFn);
    } catch (error) {
      sourceStatus.value = SourceStatus.Error;
      logError('Error creating GeoJSON source:', error, { sourceId });
    }
  }

  /**
   * Sets new data for the GeoJSON source with error handling and validation
   * @param newData - New GeoJSON data to set
   */
  function setData(newData: GeoJSONSourceSpecification['data']): void {
    const map = mapInstance.value;

    if (!map) return;

    if (!source.value || !hasSource(map, sourceId)) return;

    if (!newData) return;

    try {
      source.value.setData(newData);
    } catch (error) {
      logError('Error setting GeoJSON source data:', error, { sourceId });
    }
  }

  /**
   * Removes the GeoJSON source with enhanced cleanup and error handling
   */
  function removeSource(): void {
    const map = mapInstance.value;

    if (!map) return;

    try {
      if (hasSource(map, sourceId)) {
        map.removeSource(sourceId);
        map.off('sourcedata', sourcedataEventFn);
      }
    } catch (error) {
      logError('Error removing GeoJSON source:', error, { sourceId });
    } finally {
      source.value = null;
      sourceStatus.value = SourceStatus.NotCreated;
    }
  }

  /**
   * Refreshes the source by removing and recreating it
   */
  function refreshSource(): void {
    removeSource();
    initSource();
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
    refreshSource,
    sourceStatus: sourceStatus.value as Readonly<SourceStatus>,
    isSourceReady: isSourceReady.value,
  };
}
