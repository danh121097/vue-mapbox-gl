import { ref, shallowRef, computed, effectScope, unref, watch } from 'vue';
import { hasLayer } from '@libs/helpers';
import type {
  AnyLayout,
  AnyPaint,
  CreateLayerActions,
  Nullable,
} from '@libs/types';
import type { FilterSpecification, Map, StyleSetterOptions } from 'maplibre-gl';
import type { EffectScope, ComputedRef } from 'vue';
import type { LayerSpecification } from 'maplibre-gl';

interface Methods {
  layerId: ComputedRef<string | undefined>;
  layer: ComputedRef<Nullable<LayerSpecification>>;
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
}

export function useLayer<T extends LayerSpecification>() {
  const instanceRef = ref<CreateLayerActions<T>>();
  const loadedRef = ref<boolean>(false);

  const mapInstanceRef = shallowRef<Nullable<Map>>(null);
  const layerRef = shallowRef<Nullable<LayerSpecification>>(null);
  const layerIdRef = ref<string>();

  let watchScope: EffectScope;

  function register(instance: CreateLayerActions<T>, map: Map) {
    if (unref(loadedRef) && instance === unref(instanceRef)) return;

    instanceRef.value = instance;
    mapInstanceRef.value = map;

    loadedRef.value = true;

    watchScope?.stop();

    watchScope = effectScope();
    watchScope.run(() => {
      watch(
        () => instance.getLayer.value,
        (layer) => {
          layerRef.value = layer;
          layerIdRef.value = layer?.id;
        },
        {
          immediate: true,
        },
      );
    });
  }

  function getInstance(): CreateLayerActions<T> | undefined {
    const instance = unref(instanceRef);
    if (!instance) return;
    return instance;
  }

  const methods: Methods = {
    layerId: computed(() => layerIdRef.value),
    layer: computed(() => layerRef.value),
    getFilter: () => {
      if (
        mapInstanceRef.value &&
        layerIdRef.value &&
        hasLayer(mapInstanceRef.value, layerIdRef.value)
      )
        return mapInstanceRef.value.getFilter(layerIdRef.value);
    },
    getLayoutProperty: (name: keyof AnyLayout) => {
      if (
        mapInstanceRef.value &&
        layerIdRef.value &&
        hasLayer(mapInstanceRef.value, layerIdRef.value)
      )
        return mapInstanceRef.value.getLayoutProperty(
          layerIdRef.value,
          name as string,
        );
    },
    getPaintProperty: (name: keyof AnyPaint) => {
      if (
        mapInstanceRef.value &&
        layerIdRef.value &&
        hasLayer(mapInstanceRef.value, layerIdRef.value)
      ) {
        mapInstanceRef.value.getPaintProperty(layerIdRef.value, name as string);
      }
    },
    setBeforeId: (beforeId?: string) => {
      getInstance()?.setBeforeId(beforeId);
    },
    setFilter: (filter?: FilterSpecification) => {
      getInstance()?.setFilter(filter);
    },
    setPaintProperty: (
      name: string,
      value: any,
      options?: StyleSetterOptions,
    ) => {
      getInstance()?.setPaintProperty(name, value, options);
    },
    setLayoutProperty: (
      name: string,
      value: any,
      options?: StyleSetterOptions,
    ) => {
      getInstance()?.setLayoutProperty(name, value, options);
    },
    setZoomRange: (minzoom?: number, maxzoom?: number) => {
      getInstance()?.setZoomRange(minzoom, maxzoom);
    },
    removeLayer: () => {
      getInstance()?.removeLayer();
    },
  };

  return {
    register,
    ...methods,
  };
}
