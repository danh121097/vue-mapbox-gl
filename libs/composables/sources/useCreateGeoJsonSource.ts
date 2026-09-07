import { useLogger, useMapReloadEvent } from '@libs/composables';
import { getNanoid, hasSource } from '@libs/helpers';
import type { Nullable } from '@libs/types';
import type {
  GeoJSONSource,
  GeoJSONSourceSpecification,
  Map,
  MapSourceDataEvent,
} from 'maplibre-gl';
import type { ComputedRef, MaybeRef, ShallowRef } from 'vue';
import {
  computed,
  markRaw,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  unref,
} from 'vue';

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
  sourceStatus: ComputedRef<SourceStatus>;
  isSourceReady: ComputedRef<boolean>;
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
  // The data the source should currently hold. Creation is deferred and a
  // style reload rebuilds the source, so `setData` records here and
  // `initSource` builds from it rather than from the setup-time value.
  let currentData = data;
  // Set on unmount so the deferred mount-time creation cannot add a source
  // after the teardown that would have removed it has already run.
  let isDisposed = false;

  // Computed properties for better reactivity and performance
  const getSource = computed(() => source.value);
  const sourceStatusComputed = computed(() => sourceStatus.value);
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
      onUnload: removeSourceFrom,
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

      if (!source.value && e.sourceId === sourceId) {
        // Use markRaw to prevent Vue reactivity overhead on MapLibre source objects
        source.value = markRaw(map.getSource(sourceId) as GeoJSONSource);
        sourceStatus.value = SourceStatus.Created;

        register?.(
          {
            sourceId,
            getSource,
            setData,
            removeSource,
            refreshSource,
            sourceStatus: sourceStatusComputed,
            isSourceReady,
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

    if (!currentData) return;

    sourceStatus.value = SourceStatus.Creating;

    try {
      const sourceSpec: GeoJSONSourceSpecification = {
        ...options,
        type: 'geojson',
        data: currentData,
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
    if (!newData) return;

    currentData = newData;

    const map = mapInstance.value;

    if (!map) return;

    if (!source.value || !hasSource(map, sourceId)) return;

    try {
      source.value.setData(newData);
    } catch (error) {
      logError('Error setting GeoJSON source data:', error, { sourceId });
    }
  }

  /**
   * Removes the source from a specific map. When the map ref is swapped the
   * source is still on the outgoing map, which the ref no longer points at.
   */
  function removeSourceFrom(map: Nullable<Map>): void {
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
   * Removes the GeoJSON source with enhanced cleanup and error handling
   */
  function removeSource(): void {
    removeSourceFrom(mapInstance.value);
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
    if (!isDisposed) initSource();
  });

  onUnmounted(() => {
    isDisposed = true;
    removeSource();
  });

  return {
    sourceId,
    getSource,
    setData,
    removeSource,
    refreshSource,
    sourceStatus: sourceStatusComputed,
    isSourceReady,
  };
}
