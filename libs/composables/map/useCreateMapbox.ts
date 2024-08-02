import { Map } from 'maplibre-gl';
import { ref, shallowRef, computed, watchEffect, unref } from 'vue';
import { MapboxStatus } from '@libs/enums';
import type { CreateMaplibreActions } from '@libs/types';
import type { MaybeRef } from 'vue';
import type {
  MapOptions,
  LngLatBoundsLike,
  LngLatLike,
  StyleSpecification,
  StyleSwapOptions,
  StyleOptions,
} from 'maplibre-gl';

interface CreateMapboxProps extends MapOptions {
  register?: (actions: CreateMaplibreActions) => void;
}

export function useCreateMapbox(
  elRef: MaybeRef<HTMLElement | undefined>,
  styleRef: MaybeRef<StyleSpecification | string>,
  props: Omit<CreateMapboxProps, 'container' | 'style'> = {},
) {
  const { register, ...options } = props;

  const mapInstance = shallowRef<Map | null>(null);
  const mapStatus = ref<MapboxStatus>(MapboxStatus.NotLoaded);
  const mapOptions = ref<Omit<MapOptions, 'container' | 'style'>>(options);

  const stopWatchEffect = watchEffect(() => {
    removeMap();
    if (!unref(mapInstance) && unref(elRef)) {
      initMap();
      stopWatchEffect();
    }
  });

  function checkInitMap() {
    if (!options.center && !options.bounds) return;
    initMap();
  }

  function initMap() {
    mapStatus.value = MapboxStatus.NotLoaded;
    const options = unref(mapOptions);
    const el = unref(elRef);
    const style = unref(styleRef);
    if (!el || !style) return;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mapInstance.value = new Map({
      ...options,
      style,
      container: el,
    });

    mapStatus.value = MapboxStatus.Loading;
    register?.(methods);

    mapInstance.value.on('load', mapEventLoad);
    mapInstance.value.on('error', mapEventError);
  }

  function removeMap() {
    const map = unref(mapInstance);
    if (map) {
      map.off('load', mapEventLoad);
      map.off('error', mapEventError);
      map.remove();
    }
    mapInstance.value = null;
  }

  function mapEventLoad() {
    mapStatus.value = MapboxStatus.Loaded;
  }

  function mapEventError() {
    mapStatus.value = MapboxStatus.Error;
  }

  function setCenter(centerVal: LngLatLike) {
    mapInstance.value?.setCenter(centerVal);
    mapOptions.value.center = centerVal;
  }

  function setBearing(bearing = 0) {
    mapInstance.value?.setBearing(bearing);
    mapOptions.value.bearing = bearing;
  }

  function setZoom(zoom: number) {
    mapInstance.value?.setZoom(zoom);
    mapOptions.value.zoom = zoom;
  }

  function setPitch(pitch: number) {
    mapInstance.value?.setPitch(pitch);
    mapOptions.value.pitch = pitch;
  }

  function setStyle(
    style: string | StyleSpecification,
    options?: StyleSwapOptions & StyleOptions,
  ) {
    mapInstance.value?.setStyle(style, options);
  }

  function setMaxBounds(bounds?: LngLatBoundsLike) {
    mapInstance.value?.setMaxBounds(bounds);
    mapOptions.value.maxBounds = bounds;
  }

  function setMaxPitch(pitch = 60) {
    mapInstance.value?.setMaxPitch(pitch);
    mapOptions.value.maxPitch = pitch;
  }

  function setMaxZoom(zoom = 24) {
    mapInstance.value?.setMaxZoom(zoom);
    mapOptions.value.maxZoom = zoom;
  }

  function setMinPitch(pitch = 0) {
    mapInstance.value?.setMinPitch(pitch);
    mapOptions.value.minPitch = pitch;
  }

  function setMinZoom(zoom = 0) {
    mapInstance.value?.setMinZoom(zoom);
    mapOptions.value.minZoom = zoom;
  }

  function setRenderWorldCopies(renderWorldCopies = true) {
    mapInstance.value?.setRenderWorldCopies(renderWorldCopies);
    mapOptions.value.renderWorldCopies = renderWorldCopies;
  }

  const methods: CreateMaplibreActions = {
    mapInstance: computed(() => mapInstance.value),
    mapStatus: computed(() => mapStatus.value),
    setRenderWorldCopies,
    setMinZoom,
    setMinPitch,
    setMaxZoom,
    setMaxPitch,
    setMaxBounds,
    setStyle,
    setPitch,
    setZoom,
    setBearing,
    setCenter,
  };

  return {
    initMap,
    removeMap,
    checkInitMap,
    ...methods,
  };
}
