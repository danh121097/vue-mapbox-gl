import {
  computed,
  effectScope,
  ref,
  shallowRef,
  unref,
  watch,
  onUnmounted,
  type ComputedRef,
} from 'vue';
import { useLogger } from '@libs/composables';
import { MapCreationStatus } from '@libs/enums';
import type { MaplibreMethods, MaplibreActions, Nullable } from '@libs/types';
import type { EffectScope } from 'vue';
import type {
  FeatureIdentifier,
  LngLatBoundsLike,
  LngLatLike,
  Map,
  PaddingOptions,
  PointLike,
  QueryRenderedFeaturesOptions,
  QuerySourceFeatureOptions,
  StyleSpecification,
} from 'maplibre-gl';

/**
 * Mapbox management status enum for better state management
 */
export enum MapboxManagementStatus {
  NotRegistered = 'not-registered',
  Registering = 'registering',
  Registered = 'registered',
  Error = 'error',
  Disposed = 'disposed',
}

/**
 * Configuration options for mapbox management
 */
interface MapboxManagementProps {
  /** Enable debug logging */
  debug?: boolean;
  /** Automatically cleanup resources on unmount */
  autoCleanup?: boolean;
  /** Maximum retry attempts for operations */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

/**
 * Enhanced MapLibre methods with reactive state management
 */
interface EnhancedMaplibreMethods
  extends Omit<
    MaplibreMethods,
    'mapCreationStatus' | 'isMapReady' | 'isMapLoading' | 'hasMapError'
  > {
  // Enhanced reactive state (overriding base types with ComputedRef)
  readonly mapCreationStatus: ComputedRef<MapCreationStatus>;
  readonly managementStatus: ComputedRef<MapboxManagementStatus>;
  readonly isMapReady: ComputedRef<boolean>;
  readonly isMapLoading: ComputedRef<boolean>;
  readonly hasMapError: ComputedRef<boolean>;
  readonly isRegistered: ComputedRef<boolean>;

  // Enhanced management methods
  register: (instance: MaplibreActions) => Promise<void>;
  dispose: () => Promise<void>;
  refresh: () => Promise<void>;
  validateMapOperation: () => boolean;

  // Enhanced error recovery
  retryOperation: <T>(operation: () => T, context?: string) => Promise<T>;
}

/**
 * Composable for managing MapLibre GL Map instances with enhanced error handling
 * Provides reactive map management with validation, debugging, and comprehensive state management
 *
 * @param props - Configuration options for mapbox management
 * @returns Enhanced actions and state for mapbox management
 */
export function useMapbox(
  props: MapboxManagementProps = {},
): EnhancedMaplibreMethods {
  const {
    debug = false,
    autoCleanup = true,
    maxRetries = 3,
    retryDelay = 1000,
  } = props;
  const { logError } = useLogger(debug);

  const instanceRef = ref<MaplibreActions>();
  const mapCreationStatus = ref<MapCreationStatus>(
    MapCreationStatus.NotInitialized,
  );
  const mapInstance = shallowRef<Nullable<Map>>(null);
  const managementStatus = ref<MapboxManagementStatus>(
    MapboxManagementStatus.NotRegistered,
  );

  let watchScope: EffectScope;

  // Computed properties for better reactivity and performance
  const mapCreationStatusComputed = computed(() => mapCreationStatus.value);
  const managementStatusComputed = computed(() => managementStatus.value);
  const isMapReady = computed(
    () => mapCreationStatus.value === MapCreationStatus.Loaded,
  );
  const isMapLoading = computed(
    () => mapCreationStatus.value === MapCreationStatus.Loading,
  );
  const hasMapError = computed(
    () => mapCreationStatus.value === MapCreationStatus.Error,
  );
  const isRegistered = computed(
    () => managementStatus.value === MapboxManagementStatus.Registered,
  );

  /**
   * Validates if map operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateMapOperation(): boolean {
    const map = mapInstance.value;
    if (!map) return false;
    return true;
  }

  /**
   * Registers a MapLibre actions instance with enhanced error handling and validation
   * @param instance - MapLibre actions instance to register
   */
  async function register(instance: MaplibreActions): Promise<void> {
    try {
      // Prevent duplicate registration
      if (
        managementStatus.value === MapboxManagementStatus.Registered &&
        instance === unref(instanceRef)
      )
        return;

      managementStatus.value = MapboxManagementStatus.Registering;

      instanceRef.value = instance;

      // Clean up previous watch scope
      watchScope?.stop();

      // Set up new watch scope for instance changes
      watchScope = effectScope();
      watchScope.run(() => {
        watch(
          () => instance.mapInstance.value,
          (map) => {
            try {
              mapInstance.value = map;
            } catch (error) {
              managementStatus.value = MapboxManagementStatus.Error;
              logError('Error updating map instance:', error);
            }
          },
          {
            immediate: true,
          },
        );

        watch(
          () => instance.mapCreationStatus,
          (status) => {
            try {
              if (status === MapCreationStatus.Loaded) {
                managementStatus.value = MapboxManagementStatus.Registered;
              }
            } catch (error) {
              managementStatus.value = MapboxManagementStatus.Error;
              logError('Error updating map status:', error);
            }
          },
          {
            immediate: true,
          },
        );
      });
    } catch (error) {
      managementStatus.value = MapboxManagementStatus.Error;
      logError('Error registering MapLibre instance:', error);
    }
  }

  /**
   * Gets the current map instance with validation
   * @returns Map instance or undefined
   */
  function getMapInstance(): Map | null | undefined {
    const mapInstance = unref(instanceRef.value?.mapInstance);
    if (!mapInstance) return undefined;
    return mapInstance;
  }

  /**
   * Gets the current MapLibre actions instance with validation
   * @returns MapLibre actions instance or undefined
   */
  function getInstance(): MaplibreActions | undefined {
    const instance = unref(instanceRef);
    return instance;
  }

  /**
   * Disposes of the mapbox management and cleans up resources
   */
  async function dispose(): Promise<void> {
    try {
      watchScope?.stop();
      instanceRef.value = undefined;
      mapInstance.value = null;
      managementStatus.value = MapboxManagementStatus.Disposed;
    } catch (error) {
      logError('Error disposing mapbox management:', error);
    }
  }

  /**
   * Refreshes the mapbox registration
   */
  async function refresh(): Promise<void> {
    const instance = getInstance();

    if (instance) {
      await register(instance);
    } else {
      logError('Cannot refresh: no instance available');
    }
  }

  /**
   * Retries an operation with exponential backoff
   */
  async function retryOperation<T>(
    operation: () => T,
    context?: string,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return operation();
      } catch (error) {
        lastError = error;
        logError(
          `${context || 'Operation'} failed (attempt ${attempt}/${maxRetries}):`,
          error,
        );

        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  const methods: MaplibreMethods = {
    mapInstance: computed(() => mapInstance.value),
    mapCreationStatus: mapCreationStatusComputed.value,
    isMapReady: isMapReady.value,
    isMapLoading: isMapLoading.value,
    hasMapError: hasMapError.value,
    getContainer: () => {
      return getMapInstance()?.getContainer();
    },
    getCanvasContainer: () => {
      return getMapInstance()?.getCanvasContainer();
    },
    getCanvas: () => {
      return getMapInstance()?.getCanvas();
    },
    getStyle: () => {
      return getMapInstance()?.getStyle();
    },
    getBounds: () => {
      return getMapInstance()?.getBounds();
    },
    getCenter: () => {
      return getMapInstance()?.getCenter();
    },
    getZoom: () => {
      return getMapInstance()?.getZoom();
    },
    getBearing: () => {
      return getMapInstance()?.getBearing();
    },
    getPadding: () => {
      return getMapInstance()?.getPadding();
    },
    getPitch: () => {
      return getMapInstance()?.getPitch();
    },
    getMinZoom: () => {
      return getMapInstance()?.getMinZoom();
    },
    getMaxZoom: () => {
      return getMapInstance()?.getMaxZoom();
    },
    getMinPitch: () => {
      return getMapInstance()?.getMinPitch();
    },
    getMaxPitch: () => {
      return getMapInstance()?.getMaxPitch();
    },
    getFilter: (layerId: string) => {
      return getMapInstance()?.getFilter(layerId);
    },
    getLayer: (layerId: string) => {
      return getMapInstance()?.getLayer(layerId);
    },
    getLayoutProperty: (layerId: string, name: string) => {
      return getMapInstance()?.getLayoutProperty(layerId, name);
    },
    getPaintProperty: (layerId: string, name: string) => {
      return getMapInstance()?.getPaintProperty(layerId, name);
    },
    getSource: (sourceId: string) => {
      return getMapInstance()?.getSource(sourceId);
    },
    project: (lnglat: LngLatLike) => {
      return getMapInstance()?.project(lnglat);
    },
    unproject: (point: PointLike) => {
      return getMapInstance()?.unproject(point);
    },
    queryRenderedFeatures: (
      point: PointLike | [PointLike, PointLike],
      options?: QueryRenderedFeaturesOptions,
    ) => {
      return getMapInstance()?.queryRenderedFeatures(point, options);
    },
    querySourceFeatures: (
      sourceId: string,
      parameters?: QuerySourceFeatureOptions,
    ) => {
      return getMapInstance()?.querySourceFeatures(sourceId, parameters);
    },
    queryTerrainElevation: (lnglat: LngLatLike) => {
      return getMapInstance()?.queryTerrainElevation(lnglat);
    },
    isStyleLoaded: () => {
      return getMapInstance()?.isStyleLoaded();
    },
    isMoving: () => {
      return getMapInstance()?.isMoving();
    },
    isZooming: () => {
      return getMapInstance()?.isZooming();
    },
    isRotating: () => {
      return getMapInstance()?.isRotating();
    },
    isEasing: () => {
      return getMapInstance()?.isEasing();
    },
    resize: () => {
      getMapInstance()?.resize();
    },
    remove: () => {
      getMapInstance()?.remove();
    },
    triggerRepaint: () => {
      getMapInstance()?.triggerRepaint();
    },
    setFeatureState: (
      options: FeatureIdentifier,
      state: Record<string, any>,
    ) => {
      getMapInstance()?.setFeatureState(options, state);
    },
    removeFeatureState: (options: FeatureIdentifier, key: string) => {
      getMapInstance()?.removeFeatureState(options, key);
    },
    getFeatureState: (options: FeatureIdentifier) => {
      return getMapInstance()?.getFeatureState(options);
    },
    setPadding: (padding?: PaddingOptions) => {
      padding && getMapInstance()?.setPadding(padding);
    },
    setRenderWorldCopies: (val: boolean) => {
      getInstance()?.setRenderWorldCopies?.(val);
    },
    setMinZoom: (zoom: number) => {
      getInstance()?.setMaxZoom?.(zoom);
    },
    setMinPitch: (pitch: number) => {
      getInstance()?.setMinPitch?.(pitch);
    },
    setMaxZoom: (zoom: number) => {
      getInstance()?.setMaxZoom?.(zoom);
    },
    setMaxPitch: (pitch: number) => {
      getInstance()?.setMaxPitch?.(pitch);
    },
    setMaxBounds: (bounds: LngLatBoundsLike) => {
      getInstance()?.setMaxBounds?.(bounds);
    },
    setStyle: (style: string | StyleSpecification) => {
      getInstance()?.setStyle?.(style);
    },
    setPitch: (pitch: number) => {
      getInstance()?.setPitch?.(pitch);
    },
    setZoom: (zoom: number) => {
      getInstance()?.setZoom?.(zoom);
    },
    setBearing: (bearing: number) => {
      getInstance()?.setBearing?.(bearing);
    },
    setCenter: (center: LngLatLike) => {
      getInstance()?.setCenter?.(center);
    },
  };

  // Cleanup function for disposing resources
  function cleanup(): void {
    if (autoCleanup) {
      dispose();
    }
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  return {
    ...methods,
    // Override with enhanced reactive properties
    mapCreationStatus: mapCreationStatusComputed,
    isMapReady,
    isMapLoading,
    hasMapError,
    // Enhanced management methods and properties
    register,
    dispose,
    refresh,
    validateMapOperation,
    retryOperation,
    managementStatus: managementStatusComputed,
    isRegistered,
  };
}
