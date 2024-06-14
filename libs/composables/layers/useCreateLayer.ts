import { shallowRef, unref, computed, watch } from 'vue';
import type { CreateBaseLayerActions, Nullable, LayerTypes } from '@libs/types';
import { getNanoid, hasLayer } from '@libs/helpers';
import { useMapReloadEvent } from '@libs/composables';
import type { MaybeRef } from 'vue';
import type {
  SourceSpecification,
  FilterSpecification,
  Map,
  StyleSetterOptions,
  LayerSpecification,
} from 'maplibre-gl';

interface CreateBaseLayerProps<Layer extends LayerSpecification> {
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
  register?: (actions: CreateBaseLayerActions<Layer>, map: Map) => void;
}

export function useCreateLayer<Layer extends LayerSpecification>(
  cfg: CreateBaseLayerProps<Layer>,
) {
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
    register,
  } = cfg;

  const layerId = getNanoid(id);
  const layer = shallowRef<Nullable<Layer>>(null);
  const getLayer = computed(() => layer.value);

  watch(
    () => unref(sourceRef),
    (source) => {
      if (source) createLayer();
      else removeLayer();
    },
  );

  useMapReloadEvent(mapRef, {
    unLoad: removeLayer,
    onLoad: createLayer,
  });

  function setBeforeId(beforeIdVal?: string) {
    const mapInstance = unref(mapRef);
    if (mapInstance && layer.value && hasLayer(mapInstance, layerId)) {
      mapInstance.moveLayer(layerId, beforeIdVal);
    }
  }

  function setFilter(filterVal: FilterSpecification = ['all']) {
    const mapInstance = unref(mapRef);
    if (mapInstance && layer.value && hasLayer(mapInstance, layerId))
      mapInstance.setFilter(layerId, filterVal);
  }

  function setZoomRange(minzoomVal = 0, maxzoomVal = 24) {
    const mapInstance = unref(mapRef);
    if (mapInstance && layer.value && hasLayer(mapInstance, layerId))
      mapInstance.setLayerZoomRange(layerId, minzoomVal, maxzoomVal);
  }

  function setPaintProperty(
    name: string,
    value: any,
    options?: StyleSetterOptions,
  ) {
    const mapInstance = unref(mapRef);
    if (mapInstance && layer.value && hasLayer(mapInstance, layerId))
      mapInstance.setPaintProperty(layerId, name, value, options);
  }

  function setLayoutProperty(
    name: string,
    value: any,
    options?: StyleSetterOptions,
  ) {
    const mapInstance = unref(mapRef);
    if (mapInstance && layer.value && hasLayer(mapInstance, layerId))
      mapInstance.setLayoutProperty(layerId, name, value, options);
  }

  function createLayer() {
    const mapInstance = unref(mapRef);
    const source = unref(sourceRef);
    if (
      mapInstance &&
      source &&
      !layer.value &&
      !hasLayer(mapInstance, layerId)
    ) {
      let sourceData: any;

      // Check if source is a string (source ID)
      if (typeof source === 'string') sourceData = source;
      else if (typeof source === 'object' && 'id' in source)
        // If source is an object and has an 'id' property, use the 'id'
        sourceData = source.id;
      else if (typeof source === 'object' && 'type' in source)
        // If source is an object and has a 'type' property, use the source object itself
        sourceData = source;
      // Fallback or default value if source doesn't match expected types or structure
      else sourceData = '';
      if (!sourceData) return;

      const LAYER = {
        id: layerId,
        type,
        source: sourceData,
        layout,
        paint,
        'source-layer': sourceLayer,
        minzoom,
        maxzoom,
        metadata,
        filter,
      };

      mapInstance.addLayer(LAYER, beforeId);
      layer.value = mapInstance.getLayer(layerId);

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
        mapInstance,
      );
    }
  }

  function removeLayer() {
    const mapInstance = unref(mapRef);
    layer.value = null;
    if (mapInstance && hasLayer(mapInstance, layerId))
      mapInstance.removeLayer(layerId);
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
  };
}
