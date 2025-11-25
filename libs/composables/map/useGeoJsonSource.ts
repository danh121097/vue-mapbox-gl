import {
  computed,
  effectScope,
  ref,
  shallowRef,
  unref,
  watch,
  onScopeDispose,
  type ComputedRef,
  type EffectScope,
} from 'vue';
import { useLogger } from '@libs/composables';
import type { CreateGeoJsonSourceActions } from '@libs/composables';
import type { GeoJSONSource, GeoJSONSourceSpecification } from 'maplibre-gl';
import type { Nullable } from '@libs/types';

/**
 * GeoJSON source management status enum for better state tracking
 */
export enum GeoJsonSourceStatus {
  NotRegistered = 'not-registered',
  Registered = 'registered',
  Error = 'error',
}

/**
 * Enhanced interface for GeoJSON source management methods
 */
interface GeoJsonSourceMethods {
  sourceId: ComputedRef<string | undefined>;
  getSource: ComputedRef<Nullable<GeoJSONSource>>;
  setData: (data: GeoJSONSourceSpecification['data']) => void;
  refreshSource: () => void;
  isSourceReady: ComputedRef<boolean>;
  sourceStatus: ComputedRef<GeoJsonSourceStatus>;
}

/**
 * Configuration options for GeoJSON source management
 */
interface UseGeoJsonSourceProps {
  debug?: boolean;
  autoRefresh?: boolean;
}

/**
 * Enhanced composable for managing GeoJSON source instances
 * Provides reactive source management with improved error handling and performance optimizations
 *
 * @param props - Configuration options for the GeoJSON source manager
 * @returns Enhanced methods and state for GeoJSON source management
 */
export function useGeoJsonSource(
  props: UseGeoJsonSourceProps = {},
): GeoJsonSourceMethods & {
  register: (instance: CreateGeoJsonSourceActions) => void;
} {
  const { debug = false, autoRefresh = true } = props;
  const { logError } = useLogger(debug);

  // State management with better typing and performance
  const instanceRef = shallowRef<CreateGeoJsonSourceActions>();
  const sourceRef = shallowRef<Nullable<GeoJSONSource>>(null);
  const sourceIdRef = ref<string>();
  const sourceStatus = ref<GeoJsonSourceStatus>(
    GeoJsonSourceStatus.NotRegistered,
  );

  // Effect scope for proper cleanup management
  let watchScope: EffectScope | undefined;

  // Computed properties for better reactivity and performance
  const isSourceReady = computed(
    () =>
      sourceStatus.value === GeoJsonSourceStatus.Registered &&
      !!sourceRef.value &&
      !!sourceIdRef.value,
  );

  /**
   * Enhanced registration function with better error handling and validation
   * @param instance - The GeoJSON source actions instance to register
   */
  function register(instance: CreateGeoJsonSourceActions): void {
    try {
      // Prevent unnecessary re-registration of the same instance
      if (
        sourceStatus.value === GeoJsonSourceStatus.Registered &&
        instance === unref(instanceRef)
      )
        return;

      // Clean up previous watch scope
      cleanupWatchScope();

      // Update instance and status
      instanceRef.value = instance;
      sourceStatus.value = GeoJsonSourceStatus.Registered;

      // Set up new watch scope for reactive source tracking
      setupSourceWatcher(instance);
    } catch (error) {
      sourceStatus.value = GeoJsonSourceStatus.Error;
      logError('Error registering GeoJSON source instance:', error);
    }
  }

  /**
   * Sets up reactive watcher for source changes with enhanced error handling
   * @param instance - The source instance to watch
   */
  function setupSourceWatcher(instance: CreateGeoJsonSourceActions): void {
    watchScope = effectScope();

    watchScope.run(() => {
      watch(
        () => instance.getSource.value,
        (newSource, oldSource) => {
          try {
            if (newSource !== oldSource) {
              sourceRef.value = newSource;
              sourceIdRef.value = instance.sourceId;
            }
          } catch (error) {
            sourceStatus.value = GeoJsonSourceStatus.Error;
            logError('Error in source watcher:', error);
          }
        },
        { immediate: true },
      );
    });
  }

  /**
   * Safely cleans up the watch scope
   */
  function cleanupWatchScope(): void {
    try {
      watchScope?.stop();
      watchScope = undefined;
    } catch (error) {
      logError('Error cleaning up watch scope:', error);
    }
  }

  /**
   * Enhanced setData method with validation and error handling
   * @param data - The GeoJSON data to set
   */
  function setData(data: GeoJSONSourceSpecification['data']): void {
    try {
      if (!instanceRef.value) return;

      if (!instanceRef.value.setData) return;

      instanceRef.value.setData(data);
    } catch (error) {
      logError('Error setting GeoJSON source data:', error);
    }
  }

  /**
   * Refreshes the source by triggering a re-registration if auto-refresh is enabled
   */
  function refreshSource(): void {
    try {
      if (!autoRefresh) return;

      const currentInstance = instanceRef.value;
      if (currentInstance) {
        register(currentInstance);
      }
    } catch (error) {
      logError('Error refreshing GeoJSON source:', error);
    }
  }

  // Cleanup on scope disposal
  onScopeDispose(() => {
    cleanupWatchScope();
  });

  // Return enhanced interface with computed properties for better encapsulation
  const methods: GeoJsonSourceMethods = {
    sourceId: computed(() => sourceIdRef.value),
    getSource: computed(() => sourceRef.value),
    setData,
    refreshSource,
    isSourceReady,
    sourceStatus: computed(() => sourceStatus.value),
  };

  return {
    register,
    ...methods,
  };
}
