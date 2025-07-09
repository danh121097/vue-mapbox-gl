import { shallowRef, unref, computed, watch, ref } from 'vue';
import type { CreateBaseLayerActions, Nullable, LayerTypes } from '@libs/types';
import { getNanoid, hasLayer } from '@libs/helpers';
import { useMapReloadEvent, useLogger } from '@libs/composables';
import type { MaybeRef } from 'vue';
import type {
  SourceSpecification,
  FilterSpecification,
  Map,
  StyleSetterOptions,
  LayerSpecification,
} from 'maplibre-gl';

/**
 * Layer creation status enum for better state management
 */
export enum LayerStatus {
  NotCreated = 'not-created',
  Creating = 'creating',
  Created = 'created',
  Error = 'error',
}

export interface CreateBaseLayerProps<Layer extends LayerSpecification> {
  map: MaybeRef<Nullable<Map>>;
  id?: string;
  source: MaybeRef<string | SourceSpecification | object | null | undefined>;
  type: LayerTypes;
  beforeId?: string;
  filter?: FilterSpecification;
  layout?: Layer['layout'];
  paint?: Layer['paint'];
  maxzoom?: number;
  minzoom?: number;
  metadata?: object;
  sourceLayer?: string;
  debug?: boolean;
  register?: (actions: CreateBaseLayerActions<Layer>, map: Map) => void;
}

export interface EnhancedLayerActions<Layer extends LayerSpecification>
  extends CreateBaseLayerActions<Layer> {
  layerStatus: Readonly<LayerStatus>;
  isLayerReady: boolean;
  refreshLayer: () => void;
  updateLayer: (updates: {
    filter?: FilterSpecification;
    minzoom?: number;
    maxzoom?: number;
    paint?: Record<string, any>;
    layout?: Record<string, any>;
  }) => void;
}

/**
 * Composable for creating and managing MapLibre GL Layers
 * Provides reactive layer management with error handling, performance optimizations, and enhanced API
 *
 * @param cfg - Configuration options for the layer
 * @returns Enhanced actions and state for the layer
 */
export function useCreateLayer<Layer extends LayerSpecification>(
  cfg: CreateBaseLayerProps<Layer>,
): EnhancedLayerActions<Layer> {
  const {
    map: mapRef,
    id,
    source: sourceRef,
    type,
    beforeId,
    filter = ['all'],
    layout = {},
    paint = {},
    maxzoom = 24,
    minzoom = 0,
    metadata,
    sourceLayer = '',
    debug = false,
    register,
  } = cfg;

  const { logWarn, logError } = useLogger(debug);
  const layerId = getNanoid(id);
  const layer = shallowRef<Nullable<Layer>>(null);
  const layerStatus = ref<LayerStatus>(LayerStatus.NotCreated);

  // Computed properties for better reactivity and performance
  const getLayer = computed(() => layer.value);
  const mapInstance = computed(() => unref(mapRef));
  const sourceInstance = computed(() => unref(sourceRef));
  const isLayerReady = computed(
    () =>
      layerStatus.value === LayerStatus.Created &&
      !!layer.value &&
      !!mapInstance.value &&
      hasLayer(mapInstance.value, layerId),
  );

  // Watch for source changes and manage layer lifecycle
  watch(
    sourceInstance,
    (source) => {
      if (source) createLayer();
      else removeLayer();
    },
    { immediate: false },
  );

  // Handle map reload events
  useMapReloadEvent({
    map: mapRef,
    callbacks: {
      onUnload: removeLayer,
      onLoad: createLayer,
    },
    debug,
  });

  /**
   * Validates if layer operations can be performed safely
   * @returns boolean indicating if layer is ready for operations
   */
  function validateLayerOperation(): boolean {
    const map = mapInstance.value;
    if (!map || !layer.value || !hasLayer(map, layerId)) return false;
    return true;
  }

  /**
   * Sets the layer position relative to other layers with error handling
   * @param beforeIdVal - ID of the layer to insert this layer before
   */
  function setBeforeId(beforeIdVal?: string): void {
    if (!validateLayerOperation()) return;

    try {
      const map = mapInstance.value!;
      map.moveLayer(layerId, beforeIdVal);
    } catch (error) {
      logError('Error setting layer position:', error);
    }
  }

  /**
   * Sets the layer filter with error handling and validation
   * @param filterVal - Filter specification for the layer
   */
  function setFilter(filterVal: FilterSpecification = ['all']): void {
    if (!validateLayerOperation()) return;

    try {
      const map = mapInstance.value!;
      map.setFilter(layerId, filterVal);
    } catch (error) {
      logError('Error setting layer filter:', error);
    }
  }

  /**
   * Sets the layer zoom range with validation and error handling
   * @param minzoomVal - Minimum zoom level (default: 0)
   * @param maxzoomVal - Maximum zoom level (default: 24)
   */
  function setZoomRange(minzoomVal = 0, maxzoomVal = 24): void {
    if (!validateLayerOperation()) return;

    // Validate zoom range
    if (minzoomVal < 0 || maxzoomVal > 24 || minzoomVal >= maxzoomVal) return;
    try {
      const map = mapInstance.value!;
      map.setLayerZoomRange(layerId, minzoomVal, maxzoomVal);
    } catch (error) {
      logError('Error setting layer zoom range:', error);
    }
  }

  /**
   * Sets a paint property with error handling and validation
   * @param name - Property name
   * @param value - Property value
   * @param options - Style setter options
   */
  function setPaintProperty(
    name: string,
    value: any,
    options: StyleSetterOptions = { validate: true },
  ): void {
    if (!validateLayerOperation()) return;

    try {
      const map = mapInstance.value!;
      map.setPaintProperty(layerId, name, value, options);
    } catch (error) {
      logError('Error setting paint property:', error, {
        property: name,
        value,
      });
    }
  }

  /**
   * Sets a layout property with error handling and validation
   * @param name - Property name
   * @param value - Property value
   * @param options - Style setter options
   */
  function setLayoutProperty(
    name: string,
    value: any,
    options: StyleSetterOptions = { validate: true },
  ): void {
    if (!validateLayerOperation()) return;

    try {
      const map = mapInstance.value!;
      map.setLayoutProperty(layerId, name, value, options);
    } catch (error) {
      logError('Error setting layout property:', error, {
        property: name,
        value,
      });
    }
  }

  /**
   * Resolves source data from various input types
   * @param source - Source input (string, object, or specification)
   * @returns Resolved source data or null if invalid
   */
  function resolveSourceData(source: any): string | null {
    if (typeof source === 'string') {
      return source;
    }

    if (typeof source === 'object' && source !== null) {
      if ('id' in source && typeof source.id === 'string') {
        return source.id;
      }
      // For source specifications, we need to return the source ID
      // This assumes the source has already been added to the map
      if ('type' in source) {
        logWarn(
          'Warning: Source specification provided, ensure source is added to map first',
        );
        return source.id || '';
      }
    }

    return null;
  }

  /**
   * Creates the layer with comprehensive error handling and validation
   */
  function createLayer(): void {
    const map = mapInstance.value;
    const source = sourceInstance.value;

    // Early validation
    if (!map) return;

    if (!source) return;

    if (layer.value || hasLayer(map, layerId)) return;

    layerStatus.value = LayerStatus.Creating;

    try {
      const sourceData = resolveSourceData(source);
      if (!sourceData) {
        layerStatus.value = LayerStatus.Error;
        return;
      }

      const layerSpec = {
        id: layerId,
        type,
        source: sourceData,
        layout: layout || {},
        paint: paint || {},
        'source-layer': sourceLayer,
        minzoom,
        maxzoom,
        metadata,
        filter,
      } as LayerSpecification;

      map.addLayer(layerSpec, beforeId);
      layer.value = map.getLayer(layerId) as unknown as Layer;
      layerStatus.value = LayerStatus.Created;

      // Register the enhanced actions
      register?.(
        {
          layerId,
          getLayer,
          removeLayer,
          setBeforeId,
          setFilter,
          setZoomRange,
          setPaintProperty,
          setLayoutProperty,
        },
        map,
      );
    } catch (error) {
      layerStatus.value = LayerStatus.Error;
      logError('Error creating layer:', error, { layerId, type });

      // Cleanup on error
      if (hasLayer(map, layerId)) {
        try {
          map.removeLayer(layerId);
        } catch (cleanupError) {
          logError('Error during layer cleanup:', cleanupError);
        }
      }
      layer.value = null;
    }
  }

  /**
   * Removes the layer with error handling and cleanup
   */
  function removeLayer(): void {
    const map = mapInstance.value;

    if (!map) return;

    try {
      if (hasLayer(map, layerId)) {
        map.removeLayer(layerId);
      }
    } catch (error) {
      logError('Error removing layer:', error, { layerId });
    } finally {
      layer.value = null;
      layerStatus.value = LayerStatus.NotCreated;
    }
  }

  /**
   * Refreshes the layer by removing and recreating it
   */
  function refreshLayer(): void {
    removeLayer();
    createLayer();
  }

  /**
   * Updates layer properties in batch
   * @param updates - Object containing layer property updates
   */
  function updateLayer(updates: {
    filter?: FilterSpecification;
    minzoom?: number;
    maxzoom?: number;
    paint?: Record<string, any>;
    layout?: Record<string, any>;
  }): void {
    if (!validateLayerOperation()) return;

    try {
      // Update filter if provided
      if (updates.filter !== undefined) {
        setFilter(updates.filter);
      }

      // Update zoom range if provided
      if (updates.minzoom !== undefined || updates.maxzoom !== undefined) {
        setZoomRange(updates.minzoom, updates.maxzoom);
      }

      // Update paint properties
      if (updates.paint) {
        Object.entries(updates.paint).forEach(([key, value]) => {
          setPaintProperty(key, value);
        });
      }

      // Update layout properties
      if (updates.layout) {
        Object.entries(updates.layout).forEach(([key, value]) => {
          setLayoutProperty(key, value);
        });
      }
    } catch (error) {
      logError('Error updating layer:', error, { layerId, updates });
    }
  }

  return {
    layerId,
    getLayer,
    removeLayer,
    setBeforeId,
    setFilter,
    setZoomRange,
    setPaintProperty,
    setLayoutProperty,
    layerStatus: layerStatus.value as Readonly<LayerStatus>,
    isLayerReady: isLayerReady.value,
    refreshLayer,
    updateLayer,
  };
}
