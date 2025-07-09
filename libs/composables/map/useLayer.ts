import {
  ref,
  shallowRef,
  computed,
  effectScope,
  unref,
  watch,
  onUnmounted,
} from 'vue';
import { hasLayer } from '@libs/helpers';
import { useLogger } from '@libs/composables';
import type {
  AnyLayout,
  AnyPaint,
  CreateLayerActions,
  Nullable,
} from '@libs/types';
import type { FilterSpecification, Map, StyleSetterOptions } from 'maplibre-gl';
import type { EffectScope, ComputedRef } from 'vue';
import type { LayerSpecification } from 'maplibre-gl';

/**
 * Layer management status enum for better state management
 */
export enum LayerManagementStatus {
  NotRegistered = 'not-registered',
  Registering = 'registering',
  Registered = 'registered',
  Error = 'error',
  Disposed = 'disposed',
}

interface LayerManagementProps {
  debug?: boolean;
  autoCleanup?: boolean;
}

interface LayerManagementActions {
  register: (instance: CreateLayerActions<any>, map: Map) => void;
  layerId: ComputedRef<string | undefined>;
  layer: ComputedRef<Nullable<LayerSpecification>>;
  layerStatus: ComputedRef<LayerManagementStatus>;
  isLayerRegistered: ComputedRef<boolean>;
  isLayerReady: ComputedRef<boolean>;
  getFilter: () => void | FilterSpecification;
  getLayoutProperty: (name: keyof AnyLayout) => any;
  getPaintProperty: (name: keyof AnyPaint) => any;
  setBeforeId: (beforeId?: string) => void;
  setFilter: (filter?: FilterSpecification) => void;
  setPaintProperty: (
    name: string,
    value: any,
    options?: StyleSetterOptions,
  ) => void;
  setLayoutProperty: (
    name: string,
    value: any,
    options?: StyleSetterOptions,
  ) => void;
  setZoomRange: (minzoom?: number, maxzoom?: number) => void;
  removeLayer: () => void;
  setStyle: (styleVal: AnyLayout & AnyPaint) => void;
  dispose: () => void;
  refresh: () => void;
}

/**
 * Composable for managing MapLibre GL Layer instances
 * Provides reactive layer management with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for layer management
 * @returns Enhanced actions and state for layer management
 */
export function useLayer<T extends LayerSpecification>(
  props: LayerManagementProps = {},
): LayerManagementActions {
  const { debug = false, autoCleanup = true } = props;
  const { logError } = useLogger(debug);

  const instanceRef = ref<CreateLayerActions<T>>();
  const layerStatus = ref<LayerManagementStatus>(
    LayerManagementStatus.NotRegistered,
  );
  const mapInstanceRef = shallowRef<Nullable<Map>>(null);
  const layerRef = shallowRef<Nullable<LayerSpecification>>(null);
  const layerIdRef = ref<string>();

  let watchScope: EffectScope;

  // Computed properties for better reactivity and performance
  const isLayerRegistered = computed(
    () => layerStatus.value === LayerManagementStatus.Registered,
  );
  const isLayerReady = computed(() => {
    const map = mapInstanceRef.value;
    const layerId = layerIdRef.value;
    return (
      isLayerRegistered.value && !!map && !!layerId && hasLayer(map, layerId)
    );
  });

  /**
   * Validates if layer operations can be performed safely
   * @returns boolean indicating if layer is ready for operations
   */
  function validateLayerOperation(): boolean {
    const map = mapInstanceRef.value;
    const layerId = layerIdRef.value;

    if (!map || !layerId || !hasLayer(map, layerId)) return false;
    return true;
  }

  /**
   * Registers a layer instance with enhanced error handling and validation
   * @param instance - Layer instance to register
   * @param map - Map instance
   */
  function register(instance: CreateLayerActions<T>, map: Map): void {
    try {
      // Prevent duplicate registration
      if (
        unref(instanceRef) === instance &&
        layerStatus.value === LayerManagementStatus.Registered
      )
        return;

      layerStatus.value = LayerManagementStatus.Registering;

      instanceRef.value = instance;
      mapInstanceRef.value = map;

      // Clean up previous watch scope
      watchScope?.stop();

      // Set up new watch scope for layer changes
      watchScope = effectScope();
      watchScope.run(() => {
        watch(
          () => instance.getLayer.value,
          (layer) => {
            try {
              layerRef.value = layer;
              layerIdRef.value = layer?.id;

              if (layer) {
                layerStatus.value = LayerManagementStatus.Registered;
              } else {
                layerStatus.value = LayerManagementStatus.NotRegistered;
              }
            } catch (error) {
              layerStatus.value = LayerManagementStatus.Error;
              logError('Error in layer watch handler:', error);
            }
          },
          {
            immediate: true,
          },
        );
      });
    } catch (error) {
      layerStatus.value = LayerManagementStatus.Error;
      logError('Error registering layer instance:', error);
    }
  }

  /**
   * Gets the current layer instance with validation
   * @returns Layer instance or undefined
   */
  function getInstance(): CreateLayerActions<T> | undefined {
    const instance = unref(instanceRef);
    if (!instance) return undefined;
    return instance;
  }

  /**
   * Disposes of the layer management and cleans up resources
   */
  function dispose(): void {
    try {
      watchScope?.stop();
      instanceRef.value = undefined;
      mapInstanceRef.value = null;
      layerRef.value = null;
      layerIdRef.value = undefined;
      layerStatus.value = LayerManagementStatus.Disposed;
    } catch (error) {
      logError('Error disposing layer management:', error);
    }
  }

  /**
   * Refreshes the layer registration
   */
  function refresh(): void {
    const instance = getInstance();
    const map = mapInstanceRef.value;

    if (instance && map) {
      register(instance, map);
    }
  }

  /**
   * Enhanced layer property getters with error handling
   */
  function getFilter(): void | FilterSpecification {
    if (!validateLayerOperation()) return;

    try {
      const map = mapInstanceRef.value!;
      const layerId = layerIdRef.value!;
      const filter = map.getFilter(layerId);
      return filter;
    } catch (error) {
      logError('Error getting layer filter:', error, {
        layerId: layerIdRef.value,
      });
    }
  }

  function getLayoutProperty(name: keyof AnyLayout): any {
    if (!validateLayerOperation()) return;

    try {
      const map = mapInstanceRef.value!;
      const layerId = layerIdRef.value!;
      const value = map.getLayoutProperty(layerId, name as string);

      return value;
    } catch (error) {
      logError('Error getting layout property:', error, {
        layerId: layerIdRef.value,
        property: name,
      });
    }
  }

  function getPaintProperty(name: keyof AnyPaint): any {
    if (!validateLayerOperation()) return;

    try {
      const map = mapInstanceRef.value!;
      const layerId = layerIdRef.value!;
      const value = map.getPaintProperty(layerId, name as string);
      return value;
    } catch (error) {
      logError('Error getting paint property:', error, {
        layerId: layerIdRef.value,
        property: name,
      });
    }
  }

  /**
   * Enhanced layer property setters with error handling
   */
  function setBeforeId(beforeId?: string): void {
    const instance = getInstance();
    if (!instance) return;

    try {
      instance.setBeforeId(beforeId);
    } catch (error) {
      logError('Error setting before ID:', error, { beforeId });
    }
  }

  function setFilter(filter?: FilterSpecification): void {
    const instance = getInstance();
    if (!instance) return;

    try {
      instance.setFilter(filter);
    } catch (error) {
      logError('Error setting filter:', error, { filter });
    }
  }

  function setPaintProperty(
    name: string,
    value: any,
    options?: StyleSetterOptions,
  ): void {
    const instance = getInstance();
    if (!instance) return;

    try {
      instance.setPaintProperty(name, value, options);
    } catch (error) {
      logError('Error setting paint property:', error, {
        property: name,
        value,
      });
    }
  }

  function setLayoutProperty(
    name: string,
    value: any,
    options?: StyleSetterOptions,
  ): void {
    const instance = getInstance();
    if (!instance) return;

    try {
      instance.setLayoutProperty(name, value, options);
    } catch (error) {
      logError('Error setting layout property:', error, {
        property: name,
        value,
      });
    }
  }

  function setZoomRange(minzoom?: number, maxzoom?: number): void {
    const instance = getInstance();
    if (!instance) return;

    try {
      instance.setZoomRange(minzoom, maxzoom);
    } catch (error) {
      logError('Error setting zoom range:', error, { minzoom, maxzoom });
    }
  }

  function removeLayer(): void {
    const instance = getInstance();
    if (!instance) return;

    try {
      instance.removeLayer();
    } catch (error) {
      logError('Error removing layer:', error, { layerId: layerIdRef.value });
    }
  }

  function setStyle(styleVal: AnyLayout & AnyPaint): void {
    const instance = getInstance();
    if (!instance) return;

    try {
      instance.setStyle(styleVal);
    } catch (error) {
      logError('Error setting layer style:', error, { style: styleVal });
    }
  }

  // Cleanup function for disposing resources
  function cleanup(): void {
    if (autoCleanup) {
      dispose();
    }
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  return {
    register,
    layerId: computed(() => layerIdRef.value),
    layer: computed(() => layerRef.value),
    layerStatus: computed(() => layerStatus.value),
    isLayerRegistered,
    isLayerReady,
    getFilter,
    getLayoutProperty,
    getPaintProperty,
    setBeforeId,
    setFilter,
    setPaintProperty,
    setLayoutProperty,
    setZoomRange,
    removeLayer,
    setStyle,
    dispose,
    refresh,
  };
}
