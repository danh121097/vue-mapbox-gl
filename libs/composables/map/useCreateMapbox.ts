import { Map } from 'maplibre-gl';
import {
  ref,
  shallowRef,
  computed,
  watchEffect,
  unref,
  onUnmounted,
} from 'vue';
import { useLogger } from '@libs/composables';
import { MapCreationStatus } from '@libs/enums';
import { type CreateMaplibreActions } from '@libs/types';
import type { MaybeRef } from 'vue';
import type {
  MapOptions,
  LngLatBoundsLike,
  LngLatLike,
  StyleSpecification,
  StyleSwapOptions,
  StyleOptions,
  CameraOptions,
} from 'maplibre-gl';

interface CreateMapboxProps extends MapOptions {
  register?: (actions: EnhancedCreateMaplibreActions) => void;
  debug?: boolean;
  onLoad?: (map: Map) => void;
  onError?: (error: any) => void;
}

interface EnhancedCreateMaplibreActions extends CreateMaplibreActions {
  // Enhanced camera controls
  getCurrentCamera: () => CameraOptions | null;
  resetCamera: () => void;
  validateMapBounds: (bounds: LngLatBoundsLike) => boolean;

  // Enhanced status and state
  mapCreationStatus: Readonly<MapCreationStatus>;
  isMapReady: boolean;
  isMapLoading: boolean;
  hasMapError: boolean;

  // Enhanced map management
  refreshMap: () => void;
  destroyMap: () => void;
  retryMapCreation: () => void;

  // Enhanced style management
  getCurrentStyle: () => StyleSpecification | string | null;

  // Enhanced bounds and limits management
  resetBounds: () => void;
  resetZoomLimits: () => void;
  resetPitchLimits: () => void;
}

/**
 * Composable for creating and managing MapLibre GL Maps with enhanced error handling
 * Provides reactive map management with validation, debugging, and comprehensive state management
 *
 * @param elRef - Reference to the HTML element container
 * @param styleRef - Reference to the map style
 * @param props - Configuration options for the map
 * @returns Enhanced actions and state for map management
 */
export function useCreateMapbox(
  elRef: MaybeRef<HTMLElement | undefined>,
  styleRef: MaybeRef<StyleSpecification | string>,
  props: Omit<CreateMapboxProps, 'container' | 'style'> = {},
) {
  const { register, onLoad, onError, ...options } = props;
  const { log, logError, logWarn } = useLogger(props.debug ?? false);

  // Enhanced state management
  const mapInstance = shallowRef<Map | null>(null);
  const mapCreationStatus = ref<MapCreationStatus>(
    MapCreationStatus.NotInitialized,
  );
  const mapOptions = ref<Omit<MapOptions, 'container' | 'style'>>(options);
  const retryCount = ref<number>(0);
  const currentStyle = ref<StyleSpecification | string | null>(null);

  // Computed properties for better reactivity and performance
  const mapInstanceComputed = computed(() => mapInstance.value);
  const mapCreationStatusComputed = computed(() => mapCreationStatus.value);
  const isMapReady = computed(
    () => mapCreationStatus.value === MapCreationStatus.Loaded,
  );
  const isMapLoading = computed(
    () => mapCreationStatus.value === MapCreationStatus.Loading,
  );
  const hasMapError = computed(
    () => mapCreationStatus.value === MapCreationStatus.Error,
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
   * Validates map bounds
   * @param bounds - Bounds to validate
   * @returns boolean indicating if bounds are valid
   */
  function validateMapBounds(bounds: LngLatBoundsLike): boolean {
    if (!bounds) return false;

    // Additional validation for array format
    if (Array.isArray(bounds)) {
      if (bounds.length !== 4 && bounds.length !== 2) {
        logWarn('Invalid bounds array: must have 2 or 4 elements', { bounds });
        return false;
      }
    }

    return true;
  }

  /**
   * Gets the current camera state
   * @returns Current camera options or null if not available
   */
  function getCurrentCamera(): CameraOptions | null {
    if (!validateMapOperation()) return null;

    const map = mapInstance.value!;
    try {
      return {
        center: map.getCenter(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      };
    } catch (error) {
      logError('Error getting current camera state:', error);
      return null;
    }
  }

  /**
   * Gets the current map style
   * @returns Current style or null if not available
   */
  function getCurrentStyle(): StyleSpecification | string | null {
    if (!validateMapOperation()) return null;

    try {
      return mapInstance.value!.getStyle() as StyleSpecification;
    } catch (error) {
      logError('Error getting current style:', error);
      return currentStyle.value as StyleSpecification | string | null;
    }
  }

  /**
   * Enhanced map initialization with comprehensive error handling
   */
  function initMap(): void {
    const el = unref(elRef);
    const style = unref(styleRef);

    if (!el) {
      mapCreationStatus.value = MapCreationStatus.Error;
      return;
    }

    if (!style) {
      mapCreationStatus.value = MapCreationStatus.Error;
      return;
    }

    mapCreationStatus.value = MapCreationStatus.Initializing;

    try {
      const mapOpts = unref(mapOptions);

      mapInstance.value = new Map({
        ...mapOpts,
        style,
        container: el,
      });

      // Use explicit type assertion to avoid deep type instantiation
      currentStyle.value = style as any;
      mapCreationStatus.value = MapCreationStatus.Loading;

      // Attach event listeners
      mapInstance.value.on('load', mapEventLoad);
      mapInstance.value.on('error', mapEventError);
      mapInstance.value.on('styledata', mapEventStyleData);
    } catch (error) {
      mapCreationStatus.value = MapCreationStatus.Error;
      logError('Error creating map instance:', error);

      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Enhanced map removal with comprehensive cleanup
   */
  function removeMap(): void {
    const map = mapInstance.value;
    if (!map) return;

    try {
      // Remove all event listeners
      map.off('load', mapEventLoad);
      map.off('error', mapEventError);
      map.off('styledata', mapEventStyleData);

      // Remove the map
      map.remove();
    } catch (error) {
      logError('Error removing map instance:', error);
    } finally {
      mapInstance.value = null;
      mapCreationStatus.value = MapCreationStatus.Destroyed;
      currentStyle.value = null;
    }
  }

  /**
   * Enhanced map load event handler
   */
  function mapEventLoad(): void {
    mapCreationStatus.value = MapCreationStatus.Loaded;
    retryCount.value = 0; // Reset retry count on successful load

    if (onLoad && mapInstance.value) {
      onLoad(mapInstance.value);
    }
  }

  /**
   * Enhanced map error event handler
   */
  function mapEventError(e: any): void {
    mapCreationStatus.value = MapCreationStatus.Error;

    if (onError) {
      onError(e);
    }
  }

  /**
   * Map style data event handler
   */
  function mapEventStyleData(e: any): void {
    log('Map style data updated', e);
  }

  /**
   * Enhanced center setter with validation and error handling
   * @param centerVal - Center coordinates to set
   */
  function setCenter(centerVal: LngLatLike): void {
    if (!validateMapOperation()) return;

    try {
      mapInstance.value!.setCenter(centerVal);
      mapOptions.value.center = centerVal;
    } catch (error) {
      logError('Error setting map center:', error, { center: centerVal });
    }
  }

  /**
   * Enhanced bearing setter with validation and error handling
   * @param bearing - Bearing value in degrees (default: 0)
   */
  function setBearing(bearing = 0): void {
    if (!validateMapOperation()) return;

    // Validate bearing range
    if (bearing < -180 || bearing > 180) {
      logWarn('Warning: Bearing should be between -180 and 180 degrees', {
        bearing,
      });
    }

    try {
      mapInstance.value!.setBearing(bearing);
      mapOptions.value.bearing = bearing;
    } catch (error) {
      logError('Error setting map bearing:', error, { bearing });
    }
  }

  /**
   * Enhanced zoom setter with validation and error handling
   * @param zoom - Zoom level to set
   */
  function setZoom(zoom: number): void {
    if (!validateMapOperation()) return;

    // Validate zoom range
    if (zoom < 0 || zoom > 24) {
      logWarn('Warning: Zoom level should be between 0 and 24', { zoom });
    }

    try {
      mapInstance.value!.setZoom(zoom);
      mapOptions.value.zoom = zoom;
    } catch (error) {
      logError('Error setting map zoom:', error, { zoom });
    }
  }

  /**
   * Enhanced pitch setter with validation and error handling
   * @param pitch - Pitch value in degrees
   */
  function setPitch(pitch: number): void {
    if (!validateMapOperation()) return;

    // Validate pitch range
    if (pitch < 0 || pitch > 60) {
      logWarn('Warning: Pitch should be between 0 and 60 degrees', { pitch });
    }

    try {
      mapInstance.value!.setPitch(pitch);
      mapOptions.value.pitch = pitch;
    } catch (error) {
      logError('Error setting map pitch:', error, { pitch });
    }
  }

  /**
   * Enhanced style setter with validation and error handling
   * @param style - Style to set
   * @param options - Style options
   */
  function setStyle(
    style: string | StyleSpecification,
    options?: StyleSwapOptions & StyleOptions,
  ): void {
    if (!validateMapOperation()) return;

    try {
      mapInstance.value!.setStyle(style, options);
      // Use explicit type assertion to avoid deep type instantiation
      currentStyle.value = style as any;
    } catch (error) {
      logError('Error setting map style:', error, { style });
    }
  }

  /**
   * Enhanced max bounds setter with validation and error handling
   * @param bounds - Maximum bounds to set
   */
  function setMaxBounds(bounds?: LngLatBoundsLike): void {
    if (!validateMapOperation()) return;

    if (bounds && !validateMapBounds(bounds)) return;

    try {
      mapInstance.value!.setMaxBounds(bounds);
      mapOptions.value.maxBounds = bounds;
    } catch (error) {
      logError('Error setting map max bounds:', error, { bounds });
    }
  }

  /**
   * Enhanced max pitch setter with validation and error handling
   * @param pitch - Maximum pitch value (default: 60)
   */
  function setMaxPitch(pitch = 60): void {
    if (!validateMapOperation()) return;

    if (pitch < 0 || pitch > 60) {
      logWarn('Warning: Max pitch should be between 0 and 60 degrees', {
        pitch,
      });
    }

    try {
      mapInstance.value!.setMaxPitch(pitch);
      mapOptions.value.maxPitch = pitch;
    } catch (error) {
      logError('Error setting map max pitch:', error, { pitch });
    }
  }

  /**
   * Enhanced max zoom setter with validation and error handling
   * @param zoom - Maximum zoom level (default: 24)
   */
  function setMaxZoom(zoom = 24): void {
    if (!validateMapOperation()) return;

    if (zoom < 0 || zoom > 24) {
      logWarn('Warning: Max zoom should be between 0 and 24', { zoom });
    }

    try {
      mapInstance.value!.setMaxZoom(zoom);
      mapOptions.value.maxZoom = zoom;
    } catch (error) {
      logError('Error setting map max zoom:', error, { zoom });
    }
  }

  /**
   * Enhanced min pitch setter with validation and error handling
   * @param pitch - Minimum pitch value (default: 0)
   */
  function setMinPitch(pitch = 0): void {
    if (!validateMapOperation()) return;

    if (pitch < 0 || pitch > 60) {
      logWarn('Warning: Min pitch should be between 0 and 60 degrees', {
        pitch,
      });
    }

    try {
      mapInstance.value!.setMinPitch(pitch);
      mapOptions.value.minPitch = pitch;
    } catch (error) {
      logError('Error setting map min pitch:', error, { pitch });
    }
  }

  /**
   * Enhanced min zoom setter with validation and error handling
   * @param zoom - Minimum zoom level (default: 0)
   */
  function setMinZoom(zoom = 0): void {
    if (!validateMapOperation()) return;

    if (zoom < 0 || zoom > 24) {
      logWarn('Warning: Min zoom should be between 0 and 24', { zoom });
    }

    try {
      mapInstance.value!.setMinZoom(zoom);
      mapOptions.value.minZoom = zoom;
    } catch (error) {
      logError('Error setting map min zoom:', error, { zoom });
    }
  }

  /**
   * Enhanced render world copies setter with validation and error handling
   * @param renderWorldCopies - Whether to render world copies (default: true)
   */
  function setRenderWorldCopies(renderWorldCopies = true): void {
    if (!validateMapOperation()) return;

    try {
      mapInstance.value!.setRenderWorldCopies(renderWorldCopies);
      mapOptions.value.renderWorldCopies = renderWorldCopies;
    } catch (error) {
      logError('Error setting map render world copies:', error, {
        renderWorldCopies,
      });
    }
  }

  /**
   * Resets the camera to initial state
   */
  function resetCamera(): void {
    if (!validateMapOperation()) return;

    try {
      const initialOptions = unref(mapOptions);
      if (initialOptions.center) setCenter(initialOptions.center);
      if (initialOptions.zoom !== undefined) setZoom(initialOptions.zoom);
      if (initialOptions.bearing !== undefined)
        setBearing(initialOptions.bearing);
      if (initialOptions.pitch !== undefined) setPitch(initialOptions.pitch);
    } catch (error) {
      logError('Error resetting camera:', error);
    }
  }

  /**
   * Resets map bounds to initial state
   */
  function resetBounds(): void {
    if (!validateMapOperation()) return;

    try {
      setMaxBounds(undefined);
    } catch (error) {
      logError('Error resetting bounds:', error);
    }
  }

  /**
   * Resets zoom limits to default values
   */
  function resetZoomLimits(): void {
    if (!validateMapOperation()) return;

    try {
      setMinZoom(0);
      setMaxZoom(24);
    } catch (error) {
      logError('Error resetting zoom limits:', error);
    }
  }

  /**
   * Resets pitch limits to default values
   */
  function resetPitchLimits(): void {
    if (!validateMapOperation()) return;

    try {
      setMinPitch(0);
      setMaxPitch(60);
    } catch (error) {
      logError('Error resetting pitch limits:', error);
    }
  }

  /**
   * Refreshes the map by removing and recreating it
   */
  function refreshMap(): void {
    removeMap();
    initMap();
  }

  /**
   * Destroys the map permanently
   */
  function destroyMap(): void {
    removeMap();
    mapCreationStatus.value = MapCreationStatus.Destroyed;
  }

  /**
   * Retries map creation after an error
   */
  function retryMapCreation(): void {
    retryCount.value = 0;
    initMap();
  }

  /**
   * Checks if map should be initialized based on options
   */
  function checkInitMap(): void {
    const opts = unref(mapOptions);
    if (!opts.center && !opts.bounds) {
      log('Map initialization skipped: no center or bounds provided');
      return;
    }
    initMap();
  }

  // Watch effect for automatic map initialization
  const stopWatchEffect = watchEffect(() => {
    removeMap();
    if (!unref(mapInstance) && unref(elRef)) {
      initMap();
      stopWatchEffect();
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    destroyMap();
  });

  const methods: EnhancedCreateMaplibreActions = {
    // Original CreateMaplibreActions
    mapInstance: mapInstanceComputed,
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

    // Enhanced actions
    getCurrentCamera,
    resetCamera,
    validateMapBounds,
    mapCreationStatus: mapCreationStatusComputed.value,
    isMapReady: isMapReady.value,
    isMapLoading: isMapLoading.value,
    hasMapError: hasMapError.value,
    refreshMap,
    destroyMap,
    retryMapCreation,
    getCurrentStyle,
    resetBounds,
    resetZoomLimits,
    resetPitchLimits,
  };

  // Register the enhanced methods
  register?.(methods);

  return {
    initMap,
    removeMap,
    checkInitMap,
    ...methods,
  };
}
