import {
  watchEffect,
  watch,
  unref,
  shallowRef,
  computed,
  ref,
  onUnmounted,
} from 'vue';
import { Marker } from 'maplibre-gl';
import { lngLatLikeHasValue } from '@libs/helpers';
import { useLogger } from '@libs/composables';
import type { Nullable } from '@libs/types';
import type { MaybeRef, Ref } from 'vue';
import type {
  Alignment,
  Listener,
  LngLatLike,
  Map,
  MarkerOptions,
  Popup,
  PointLike,
} from 'maplibre-gl';

/**
 * Marker creation status enum for better state management
 */
export enum MarkerStatus {
  NotCreated = 'not-created',
  Creating = 'creating',
  Created = 'created',
  Error = 'error',
  Removed = 'removed',
}

interface MarkerEventHandlers {
  dragstart?: (e: Event) => void;
  drag?: (e: Event) => void;
  dragend?: (e: Event) => void;
}

interface CreateMarkerProps {
  map: MaybeRef<Nullable<Map>>;
  lnglat?: MaybeRef<LngLatLike | undefined>;
  popup?: MaybeRef<Nullable<Popup>>;
  el?: Ref<HTMLElement | undefined>;
  options?: MarkerOptions;
  on?: MarkerEventHandlers;
  debug?: boolean;
  autoAdd?: boolean;
}

interface CreateMarkerActions {
  marker: Readonly<Nullable<Marker>>;
  markerStatus: Readonly<MarkerStatus>;
  isMarkerCreated: boolean;
  setLngLat: (lnglat: LngLatLike) => void;
  setPopup: (popup?: Popup | null) => void;
  setOffset: (offset: PointLike) => void;
  setDraggable: (draggable: boolean) => void;
  togglePopup: () => void;
  getElement: () => HTMLElement | null;
  setRotation: (rotation: number) => void;
  setRotationAlignment: (alignment: Alignment) => void;
  setPitchAlignment: (alignment: Alignment) => void;
  setOpacity: (opacity: string, opacityWhenCovered?: string) => void;
  removeMarker: () => void;
  addMarker: () => void;
  getLngLat: () => LngLatLike | null;
  getPopup: () => Popup | null;
  getOffset: () => PointLike;
  getDraggable: () => boolean;
  getRotation: () => number;
}

/**
 * Composable for managing MapLibre GL Markers
 * Provides reactive marker with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for the marker
 * @returns Enhanced actions and state for the marker
 */
export function useCreateMarker({
  map: mapRef,
  lnglat: lnglatVal,
  popup: popupRef,
  el,
  options = {},
  on = {},
  debug = false,
  autoAdd = true,
}: CreateMarkerProps): CreateMarkerActions {
  const { logError } = useLogger(debug);
  const marker = shallowRef<Nullable<Marker>>(null);
  const markerStatus = ref<MarkerStatus>(MarkerStatus.NotCreated);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(mapRef));
  const lnglatValue = computed(() => unref(lnglatVal));
  const popupValue = computed(() => unref(popupRef));
  const isMarkerCreated = computed(
    () => markerStatus.value === MarkerStatus.Created,
  );

  /**
   * Enhanced drag event handlers with error handling and debugging
   */
  const dragstartEventFn = (ev: Event): void => {
    try {
      on.dragstart?.(ev);
    } catch (error) {
      logError('Error in marker dragstart handler:', error);
    }
  };

  const dragEventFn = (ev: Event): void => {
    try {
      on.drag?.(ev);
    } catch (error) {
      logError('Error in marker drag handler:', error);
    }
  };

  const dragendEventFn = (ev: Event): void => {
    try {
      on.dragend?.(ev);
    } catch (error) {
      logError('Error in marker dragend handler:', error);
    }
  };

  /**
   * Creates and initializes the marker
   */
  function createMarker(): void {
    const map = mapInstance.value;

    if (!map) return;

    if (marker.value) return;

    try {
      markerStatus.value = MarkerStatus.Creating;

      marker.value = new Marker({
        ...options,
        element: el?.value,
      });

      // Set initial position if provided
      const lnglat = lnglatValue.value;
      if (lnglat && lngLatLikeHasValue(lnglat)) {
        marker.value.setLngLat(lnglat);
      }

      // Set initial popup if provided
      const popup = popupValue.value;
      if (popup) {
        marker.value.setPopup(popup);
      }

      // Attach event listeners
      marker.value.on('dragstart', dragstartEventFn as Listener);
      marker.value.on('drag', dragEventFn as Listener);
      marker.value.on('dragend', dragendEventFn as Listener);

      // Add to map if autoAdd is enabled
      if (autoAdd) {
        marker.value.addTo(map);
      }

      markerStatus.value = MarkerStatus.Created;
    } catch (error) {
      markerStatus.value = MarkerStatus.Error;
      logError('Error creating marker:', error);
      marker.value = null;
    }
  }

  // Watch for map changes and manage marker lifecycle
  watchEffect((onCleanUp) => {
    const map = mapInstance.value;
    if (map && markerStatus.value === MarkerStatus.NotCreated) {
      createMarker();
    } else if (!map && markerStatus.value === MarkerStatus.Created) {
      removeMarker();
    }
    onCleanUp(removeMarker);
  });

  // Watch for popup changes
  watch(popupValue, (newPopup) => {
    if (marker.value && newPopup !== undefined) {
      setPopup(newPopup);
    }
  });

  // Watch for lnglat changes
  watch(lnglatValue, (newLnglat) => {
    if (marker.value && newLnglat && lngLatLikeHasValue(newLnglat)) {
      setLngLat(newLnglat);
    }
  });

  /**
   * Sets the marker's position with error handling
   * @param lnglat - New position for the marker
   */
  function setLngLat(lnglat: LngLatLike): void {
    if (!marker.value) return;

    try {
      marker.value.setLngLat(lnglat);
    } catch (error) {
      logError('Error setting marker position:', error, { lnglat });
    }
  }

  /**
   * Sets the marker's popup with error handling
   * @param popup - Popup to attach to the marker
   */
  function setPopup(popup?: Popup | null): void {
    if (!marker.value) return;

    try {
      if (popup) {
        marker.value.setPopup(popup);
      } else {
        marker.value.setPopup(undefined);
      }
    } catch (error) {
      logError('Error setting marker popup:', error);
    }
  }

  /**
   * Sets the marker's offset with error handling
   * @param offset - Offset for the marker
   */
  function setOffset(offset: PointLike): void {
    if (!marker.value) return;

    try {
      marker.value.setOffset(offset);
    } catch (error) {
      logError('Error setting marker offset:', error, { offset });
    }
  }

  /**
   * Sets the marker's draggable state with error handling
   * @param draggable - Whether the marker should be draggable
   */
  function setDraggable(draggable: boolean): void {
    if (!marker.value) return;

    try {
      marker.value.setDraggable(draggable);
    } catch (error) {
      logError('Error setting marker draggable state:', error, { draggable });
    }
  }

  /**
   * Toggles the marker's popup with error handling
   */
  function togglePopup(): void {
    if (!marker.value) return;

    try {
      marker.value.togglePopup();
    } catch (error) {
      logError('Error toggling marker popup:', error);
    }
  }

  /**
   * Gets the marker's DOM element
   * @returns The marker's DOM element or null
   */
  function getElement(): HTMLElement | null {
    if (!marker.value) return null;

    try {
      return marker.value.getElement();
    } catch (error) {
      logError('Error getting marker element:', error);
      return null;
    }
  }

  /**
   * Sets the marker's rotation with error handling
   * @param rotation - Rotation angle in degrees
   */
  function setRotation(rotation: number): void {
    if (!marker.value) return;

    try {
      marker.value.setRotation(rotation);
    } catch (error) {
      logError('Error setting marker rotation:', error, { rotation });
    }
  }

  /**
   * Sets the marker's rotation alignment with error handling
   * @param alignment - Rotation alignment
   */
  function setRotationAlignment(alignment: Alignment): void {
    if (!marker.value) return;

    try {
      marker.value.setRotationAlignment(alignment);
    } catch (error) {
      logError('Error setting marker rotation alignment:', error, {
        alignment,
      });
    }
  }

  /**
   * Sets the marker's pitch alignment with error handling
   * @param alignment - Pitch alignment
   */
  function setPitchAlignment(alignment: Alignment): void {
    if (!marker.value) return;

    try {
      marker.value.setPitchAlignment(alignment);
    } catch (error) {
      logError('Error setting marker pitch alignment:', error, { alignment });
    }
  }

  /**
   * Sets the marker's opacity with error handling
   * @param opacity - Opacity value
   * @param opacityWhenCovered - Opacity when covered by other elements
   */
  function setOpacity(opacity: string, opacityWhenCovered?: string): void {
    if (!marker.value) return;

    try {
      marker.value.setOpacity(opacity, opacityWhenCovered);
    } catch (error) {
      logError('Error setting marker opacity:', error, {
        opacity,
        opacityWhenCovered,
      });
    }
  }

  /**
   * Adds the marker to the map
   */
  function addMarker(): void {
    const map = mapInstance.value;

    if (!map) return;

    if (!marker.value) return;

    try {
      marker.value.addTo(map);
    } catch (error) {
      logError('Error adding marker to map:', error);
    }
  }

  /**
   * Removes the marker from the map and cleans up resources
   */
  function removeMarker(): void {
    if (!marker.value) return;

    try {
      // Remove event listeners
      marker.value.off('dragstart', dragstartEventFn as Listener);
      marker.value.off('drag', dragEventFn as Listener);
      marker.value.off('dragend', dragendEventFn as Listener);

      // Remove from map
      marker.value.remove();

      markerStatus.value = MarkerStatus.Removed;
    } catch (error) {
      logError('Error removing marker:', error);
    } finally {
      marker.value = null;
      markerStatus.value = MarkerStatus.NotCreated;
    }
  }

  /**
   * Gets the marker's current position
   * @returns Current position or null
   */
  function getLngLat(): LngLatLike | null {
    if (!marker.value) return null;

    try {
      return marker.value.getLngLat();
    } catch (error) {
      logError('Error getting marker position:', error);
      return null;
    }
  }

  /**
   * Gets the marker's current popup
   * @returns Current popup or null
   */
  function getPopup(): Popup | null {
    if (!marker.value) return null;

    try {
      return marker.value.getPopup();
    } catch (error) {
      logError('Error getting marker popup:', error);
      return null;
    }
  }

  /**
   * Gets the marker's current offset
   * @returns Current offset
   */
  function getOffset(): PointLike {
    if (!marker.value) return [0, 0];

    try {
      return marker.value.getOffset();
    } catch (error) {
      logError('Error getting marker offset:', error);
      return [0, 0];
    }
  }

  /**
   * Gets the marker's draggable state
   * @returns Whether the marker is draggable
   */
  function getDraggable(): boolean {
    if (!marker.value) return false;

    try {
      return marker.value.isDraggable();
    } catch (error) {
      logError('Error getting marker draggable state:', error);
      return false;
    }
  }

  /**
   * Gets the marker's current rotation
   * @returns Current rotation in degrees
   */
  function getRotation(): number {
    if (!marker.value) return 0;

    try {
      return marker.value.getRotation();
    } catch (error) {
      logError('Error getting marker rotation:', error);
      return 0;
    }
  }

  // Cleanup function for removing marker and stopping watchers
  function cleanup(): void {
    removeMarker();
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  return {
    marker: marker.value,
    markerStatus: markerStatus.value,
    isMarkerCreated: isMarkerCreated.value,
    setLngLat,
    setPopup,
    setOffset,
    setDraggable,
    togglePopup,
    getElement,
    setRotation,
    setRotationAlignment,
    setPitchAlignment,
    setOpacity,
    removeMarker,
    addMarker,
    getLngLat,
    getPopup,
    getOffset,
    getDraggable,
    getRotation,
  };
}
