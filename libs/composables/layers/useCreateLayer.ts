import { useLogger, useMapReloadEvent } from '@libs/composables';
import { getNanoid, hasLayer, hasSource } from '@libs/helpers';
import type { CreateBaseLayerActions, LayerTypes, Nullable } from '@libs/types';
import type {
  FilterSpecification,
  LayerSpecification,
  Map,
  SourceSpecification,
  StyleSetterOptions,
} from 'maplibre-gl';
import type { ComputedRef, MaybeRef } from 'vue';
import { computed, markRaw, ref, shallowRef, unref, watch } from 'vue';

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
  layerStatus: ComputedRef<LayerStatus>;
  isLayerReady: ComputedRef<boolean>;
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

  const { logError } = useLogger(debug);
  const layerId = getNanoid(id);
  const layer = shallowRef<Nullable<Layer>>(null);
  const layerStatus = ref<LayerStatus>(LayerStatus.NotCreated);

  // The configuration the layer should currently have. Creation is deferred
  // and a style reload rebuilds the layer from scratch, so every setter
  // records here first and `createLayer` builds from it — a change made while
  // the layer is not on the map is applied once it is, not dropped.
  const current = {
    beforeId,
    filter,
    layout: { ...(layout || {}) } as Record<string, any>,
    paint: { ...(paint || {}) } as Record<string, any>,
    minzoom,
    maxzoom,
  };

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
      onUnload: removeLayerFrom,
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
    current.beforeId = beforeIdVal;
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
    current.filter = filterVal;
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
    // Validate zoom range
    if (minzoomVal < 0 || maxzoomVal > 24 || minzoomVal >= maxzoomVal) return;

    current.minzoom = minzoomVal;
    current.maxzoom = maxzoomVal;
    if (!validateLayerOperation()) return;

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
    current.paint[name] = value;
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
    current.layout[name] = value;
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
   * Resolves the `source` prop to the id of a source already on the map.
   *
   * A layer references its source by id — MapLibre offers no way to hand
   * `addLayer` an inline specification — so an object is usable here only when
   * it carries its own string id. A bare specification such as
   * `{ type: 'geojson', data }` has none, and reporting that is more useful
   * than passing `addLayer` an empty id and letting it fail deeper in.
   */
  function resolveSourceData(source: unknown): string | null {
    if (typeof source === 'string') return source;

    if (typeof source === 'object' && source !== null && 'id' in source) {
      const { id } = source as { id: unknown };
      if (typeof id === 'string') return id;
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
        logError(
          'Error creating layer: `source` must be a source id, or an object carrying one. ' +
            'Add the source to the map first — with <GeoJsonSource> or useCreateGeoJsonSource — and pass its id.',
          null,
          { layerId, type },
        );
        return;
      }

      // Validate source exists before adding layer
      if (!hasSource(map, sourceData)) {
        layerStatus.value = LayerStatus.Error;
        logError(
          `Error creating layer: Source '${sourceData}' does not exist`,
          null,
          { layerId, type, sourceId: sourceData },
        );
        return;
      }

      const layerSpec = {
        id: layerId,
        type,
        source: sourceData,
        layout: { ...current.layout },
        paint: { ...current.paint },
        'source-layer': sourceLayer,
        minzoom: current.minzoom,
        maxzoom: current.maxzoom,
        metadata,
        filter: current.filter,
      } as LayerSpecification;

      map.addLayer(layerSpec, current.beforeId);
      // Use markRaw to prevent Vue reactivity overhead on MapLibre layer objects
      layer.value = markRaw(map.getLayer(layerId) as unknown as Layer);
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
   * Removes the layer from a specific map. When the map ref is swapped the
   * layer is still on the outgoing map, which the ref no longer points at.
   */
  function removeLayerFrom(map: Nullable<Map>): void {
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
   * Removes the layer with error handling and cleanup
   */
  function removeLayer(): void {
    removeLayerFrom(mapInstance.value);
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
    layerStatus: computed(() => layerStatus.value),
    isLayerReady,
    refreshLayer,
    updateLayer,
  };
}
