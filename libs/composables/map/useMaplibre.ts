import {
  computed,
  effectScope,
  onUnmounted,
  ref,
  shallowRef,
  unref,
  watch,
  type ComputedRef,
  type EffectScope,
} from 'vue';
import type {
  FeatureIdentifier,
  LngLatBoundsLike,
  LngLatLike,
  Map,
  MapOptions,
  PaddingOptions,
  PointLike,
  QueryRenderedFeaturesOptions,
  QuerySourceFeatureOptions,
  StyleSpecification,
} from 'maplibre-gl';

import { useLogger } from '@libs/composables';
import { MapCreationStatus } from '@libs/enums';
import type { MaplibreActions, MaplibreMethods, Nullable } from '@libs/types';

interface UseMaplibreOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Automatically cleanup resources on unmount */
  autoCleanup?: boolean;
}

interface UseMaplibreReturn
  extends Omit<
    MaplibreMethods,
    | 'mapCreationStatus'
    | 'isMapReady'
    | 'isMapLoading'
    | 'hasMapError'
    | 'mapInstance'
  > {
  /** Reactive map instance reference */
  readonly mapInstance: ComputedRef<Map | null>;
  /** Current map creation status */
  readonly mapStatus: ComputedRef<MapCreationStatus>;
  /** Whether the map is ready for operations */
  readonly isMapReady: ComputedRef<boolean>;
  /** Whether the map is currently loading */
  readonly isMapLoading: ComputedRef<boolean>;
  /** Whether the map has encountered an error */
  readonly hasMapError: ComputedRef<boolean>;
  /** Whether a map instance is registered and ready */
  readonly isRegistered: ComputedRef<boolean>;

  /** Register a MapLibre actions instance */
  register: (instance: MaplibreActions) => Promise<void>;
  /** Set map options on the registered instance */
  setMapOptions: (options: Partial<MapOptions>) => void;
}

/**
 * Composable for managing MapLibre GL Map instances
 *
 * Provides reactive state management and a clean API for interacting with MapLibre GL maps.
 * Handles registration, lifecycle management, and provides reactive access to map state.
 *
 * @param options - Configuration options for the composable
 * @returns Reactive map management interface
 */
export function useMaplibre(
  options: UseMaplibreOptions = {},
): UseMaplibreReturn {
  const { debug = false, autoCleanup = true } = options;
  const { log, logError } = useLogger(debug);

  // Internal state
  const instanceRef = ref<MaplibreActions>();
  const mapStatus = ref<MapCreationStatus>(MapCreationStatus.NotInitialized);
  const mapInstance = shallowRef<Nullable<Map>>(null);

  let watchScope: EffectScope | undefined;

  // Reactive computed properties
  const isMapReady = computed(
    () => mapStatus.value === MapCreationStatus.Loaded,
  );
  const isMapLoading = computed(
    () => mapStatus.value === MapCreationStatus.Loading,
  );
  const hasMapError = computed(
    () => mapStatus.value === MapCreationStatus.Error,
  );
  const isRegistered = computed(
    () => isMapReady.value && mapInstance.value !== null,
  );

  /**
   * Registers a MapLibre actions instance with enhanced error handling and validation
   * @param instance - MapLibre actions instance to register
   */
  async function register(instance: MaplibreActions): Promise<void> {
    try {
      // Validate instance
      if (!instance) {
        throw new Error('Cannot register: instance is null or undefined');
      }

      if (!instance.mapInstance) {
        throw new Error(
          'Cannot register: instance missing mapInstance property',
        );
      }

      // Prevent duplicate registration
      if (instance === unref(instanceRef)) {
        log('Skipping duplicate registration for same instance');
        return;
      }

      log('🔄 Registering MapLibre instance with useMaplibre', {
        hasMapInstance: !!instance.mapInstance,
        currentMapCreationStatus: instance.mapCreationStatus.value,
        isMapReady: instance.isMapReady.value,
        isMapLoading: instance.isMapLoading.value,
        hasMapError: instance.hasMapError.value,
      });
      instanceRef.value = instance;

      // Clean up previous watch scope
      watchScope?.stop();

      // Set up new watch scope for instance changes
      watchScope = effectScope();
      // Set initial status from instance before the watcher's immediate run
      // refines it from the map itself.
      mapStatus.value = instance.mapCreationStatus.value;

      watchScope.run(() => {
        // One watcher over the map and the instance's error flag. The flag is
        // a real dependency, not just a read inside the callback: when map
        // construction throws, `mapInstance` stays `null` and never changes,
        // so watching it alone would never see the failure.
        watch(
          () =>
            [instance.mapInstance.value, instance.hasMapError.value] as const,
          ([map, hasError], _previous, onCleanUp) => {
            try {
              mapInstance.value = map;
              // No `loaded()` in the payload: it walks every source in the
              // style, and the branch below already logs that outcome.
              log('🗺️ Map instance updated in useMaplibre', { hasMap: !!map });

              if (hasError) {
                mapStatus.value = MapCreationStatus.Error;
              } else if (map) {
                // Map instance exists, check if it's loaded
                if (map.loaded()) {
                  mapStatus.value = MapCreationStatus.Loaded;
                  log('Map successfully registered with useMaplibre');
                } else {
                  // Map exists but not loaded yet
                  mapStatus.value = MapCreationStatus.Loading;

                  // Listen for load event. `once` plus cleanup, so a replaced
                  // map does not leave a listener behind on the old one.
                  const onLoad = () => {
                    mapStatus.value = MapCreationStatus.Loaded;
                    log('Map loaded and registered with useMaplibre');
                  };

                  map.once('load', onLoad);
                  onCleanUp(() => map.off('load', onLoad));
                }
              } else if (instance.isMapLoading.value) {
                mapStatus.value = MapCreationStatus.Loading;
              } else {
                mapStatus.value = MapCreationStatus.NotInitialized;
              }
            } catch (error) {
              mapStatus.value = MapCreationStatus.Error;
              logError('Error handling map instance change:', error);
            }
          },
          {
            immediate: true,
          },
        );
      });
    } catch (error) {
      mapStatus.value = MapCreationStatus.Error;
      logError('Error registering MapLibre instance:', error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  // Helper functions
  const getMapInstance = (): Map | null => mapInstance.value;
  const getInstance = (): MaplibreActions | undefined => instanceRef.value;

  // Map methods that delegate to the current instance
  const methods = {
    getContainer: () => getMapInstance()?.getContainer(),
    getCanvasContainer: () => getMapInstance()?.getCanvasContainer(),
    getCanvas: () => getMapInstance()?.getCanvas(),
    getStyle: () => getMapInstance()?.getStyle(),
    getBounds: () => getMapInstance()?.getBounds(),
    getCenter: () => getMapInstance()?.getCenter(),
    getZoom: () => getMapInstance()?.getZoom(),
    getBearing: () => getMapInstance()?.getBearing(),
    getPadding: () => getMapInstance()?.getPadding(),
    getPitch: () => getMapInstance()?.getPitch(),
    getMinZoom: () => getMapInstance()?.getMinZoom(),
    getMaxZoom: () => getMapInstance()?.getMaxZoom(),
    getMinPitch: () => getMapInstance()?.getMinPitch(),
    getMaxPitch: () => getMapInstance()?.getMaxPitch(),
    getFilter: (layerId: string) => getMapInstance()?.getFilter(layerId),
    getLayer: (layerId: string) => getMapInstance()?.getLayer(layerId),
    getLayoutProperty: (layerId: string, name: string) =>
      getMapInstance()?.getLayoutProperty(layerId, name),
    getPaintProperty: (layerId: string, name: string) =>
      getMapInstance()?.getPaintProperty(layerId, name),
    getSource: (sourceId: string) => getMapInstance()?.getSource(sourceId),
    project: (lnglat: LngLatLike) => getMapInstance()?.project(lnglat),
    unproject: (point: PointLike) => getMapInstance()?.unproject(point),
    queryRenderedFeatures: (
      point: PointLike | [PointLike, PointLike],
      options?: QueryRenderedFeaturesOptions,
    ) => getMapInstance()?.queryRenderedFeatures(point, options),
    querySourceFeatures: (
      sourceId: string,
      parameters?: QuerySourceFeatureOptions,
    ) => getMapInstance()?.querySourceFeatures(sourceId, parameters),
    queryTerrainElevation: (lnglat: LngLatLike) =>
      getMapInstance()?.queryTerrainElevation(lnglat),
    isStyleLoaded: () => getMapInstance()?.isStyleLoaded(),
    isMoving: () => getMapInstance()?.isMoving(),
    isZooming: () => getMapInstance()?.isZooming(),
    isRotating: () => getMapInstance()?.isRotating(),
    isEasing: () => getMapInstance()?.isEasing(),
    resize: () => getMapInstance()?.resize(),
    remove: () => getMapInstance()?.remove(),
    triggerRepaint: () => getMapInstance()?.triggerRepaint(),
    setFeatureState: (options: FeatureIdentifier, state: Record<string, any>) =>
      getMapInstance()?.setFeatureState(options, state),
    removeFeatureState: (options: FeatureIdentifier, key: string) =>
      getMapInstance()?.removeFeatureState(options, key),
    getFeatureState: (options: FeatureIdentifier) =>
      getMapInstance()?.getFeatureState(options),
    setPadding: (padding?: PaddingOptions) =>
      padding && getMapInstance()?.setPadding(padding),

    // Setter methods that delegate to instance
    setRenderWorldCopies: (val: boolean) =>
      getInstance()?.setRenderWorldCopies?.(val),
    setMinZoom: (zoom: number) => getInstance()?.setMinZoom?.(zoom),
    setMinPitch: (pitch: number) => getInstance()?.setMinPitch?.(pitch),
    setMaxZoom: (zoom: number) => getInstance()?.setMaxZoom?.(zoom),
    setMaxPitch: (pitch: number) => getInstance()?.setMaxPitch?.(pitch),
    setMaxBounds: (bounds: LngLatBoundsLike) =>
      getInstance()?.setMaxBounds?.(bounds),
    setStyle: (style: string | StyleSpecification) =>
      getInstance()?.setStyle?.(style),
    setPitch: (pitch: number) => getInstance()?.setPitch?.(pitch),
    setZoom: (zoom: number) => getInstance()?.setZoom?.(zoom),
    setBearing: (bearing: number) => getInstance()?.setBearing?.(bearing),
    setCenter: (center: LngLatLike) => getInstance()?.setCenter?.(center),
  };

  // Cleanup on component unmount
  onUnmounted(() => {
    if (autoCleanup) {
      // Stop watching
      watchScope?.stop();

      // Clear references
      instanceRef.value = undefined;
      mapInstance.value = null;
      mapStatus.value = MapCreationStatus.NotInitialized;
    }
  });

  /**
   * Sets map options on the registered instance
   */
  const setMapOptions = (options: Partial<MapOptions>): void => {
    const instance = getInstance();
    if (instance?.setMapOptions) {
      instance.setMapOptions(options);
      log('Map options updated', options);
    } else {
      logError('Cannot set map options: no registered instance');
    }
  };

  return {
    ...methods,
    mapInstance: computed(() => mapInstance.value),
    mapStatus: computed(() => mapStatus.value),
    isMapReady,
    isMapLoading,
    hasMapError,
    isRegistered,
    register,
    setMapOptions,
  };
}
