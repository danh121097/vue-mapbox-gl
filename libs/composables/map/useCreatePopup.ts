import {
  computed,
  shallowRef,
  unref,
  watchEffect,
  ref,
  watch,
  onUnmounted,
} from 'vue';
import { Popup } from 'maplibre-gl';
import { lngLatLikeHasValue } from '@libs/helpers';
import { useLogger } from '@libs/composables';
import type { Nullable } from '@libs/types';
import type { Ref, MaybeRef } from 'vue';
import type { LngLatLike, Map, PopupOptions, PointLike } from 'maplibre-gl';

/**
 * Popup creation status enum for better state management
 */
export enum PopupStatus {
  NotCreated = 'not-created',
  Creating = 'creating',
  Created = 'created',
  Open = 'open',
  Closed = 'closed',
  Error = 'error',
  Removed = 'removed',
}

interface PopupEventHandlers {
  open?: (popup: Popup) => void;
  close?: (popup: Popup) => void;
}

interface CreatePopupProps {
  map: MaybeRef<Nullable<Map>>;
  options?: PopupOptions;
  el?: Ref<HTMLElement | undefined>;
  lnglat?: MaybeRef<LngLatLike | undefined>;
  show?: boolean;
  withMap?: boolean;
  html?: MaybeRef<string | undefined>;
  on?: PopupEventHandlers;
  debug?: boolean;
  autoCreate?: boolean;
  closeOnClick?: boolean;
  closeButton?: boolean;
}

interface CreatePopupActions {
  popup: Readonly<Nullable<Popup>>;
  popupStatus: Readonly<PopupStatus>;
  isPopupCreated: boolean;
  isPopupOpen: boolean;
  setLngLat: (lnglat: LngLatLike) => void;
  setOffset: (offset: PointLike) => void;
  addClassName: (className: string) => void;
  removeClassName: (className: string) => void;
  setMaxWidth: (width: string) => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  addToMap: () => void;
  setHTMLContent: (html?: string) => void;
  setDOMContent: (element: HTMLElement) => void;
  setText: (text: string) => void;
  removePopup: () => void;
  createPopup: () => void;
  getLngLat: () => LngLatLike | null;
  getElement: () => HTMLElement | null;
}

/**
 * Composable for managing MapLibre GL Popups
 * Provides reactive popup with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for the popup
 * @returns Enhanced actions and state for the popup
 */
export function useCreatePopup({
  map: mapRef,
  lnglat: lnglatVal,
  html,
  el,
  show: showVal = true,
  withMap: withMapVal = true,
  options = {},
  on = {},
  debug = false,
  autoCreate = true,
  closeOnClick = true,
  closeButton = true,
}: CreatePopupProps): CreatePopupActions {
  const { logError } = useLogger(debug);
  const popup = shallowRef<Nullable<Popup>>(null);
  const popupStatus = ref<PopupStatus>(PopupStatus.NotCreated);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(mapRef));
  const lnglatValue = computed(() => unref(lnglatVal));
  const htmlValue = computed(() => unref(html));
  const isPopupCreated = computed(
    () =>
      popupStatus.value === PopupStatus.Created ||
      popupStatus.value === PopupStatus.Open ||
      popupStatus.value === PopupStatus.Closed,
  );
  const isPopupOpen = computed(() => popupStatus.value === PopupStatus.Open);

  /**
   * Enhanced event handlers with error handling and debugging
   */
  const openEventFn = (): void => {
    try {
      if (popup.value) {
        popupStatus.value = PopupStatus.Open;
        on.open?.(popup.value);
      }
    } catch (error) {
      logError('Error in popup open handler:', error);
    }
  };

  const closeEventFn = (): void => {
    try {
      if (popup.value) {
        popupStatus.value = PopupStatus.Closed;
        on.close?.(popup.value);
      }
    } catch (error) {
      logError('Error in popup close handler:', error);
    }
  };

  /**
   * Creates and initializes the popup
   */
  function createPopup(): void {
    const map = mapInstance.value;

    if (!map) return;

    if (popup.value) return;

    if (!el?.value && !htmlValue.value) return;

    try {
      popupStatus.value = PopupStatus.Creating;

      popup.value = new Popup({
        closeOnClick,
        closeButton,
        ...options,
      });

      // Set content
      if (el?.value) {
        popup.value.setDOMContent(el.value);
      } else if (htmlValue.value) {
        popup.value.setHTML(htmlValue.value);
      }

      // Set initial position if provided
      const lnglat = lnglatValue.value;
      if (lnglat && lngLatLikeHasValue(lnglat)) {
        popup.value.setLngLat(lnglat);
      }

      // Attach event listeners
      popup.value.on('open', openEventFn);
      popup.value.on('close', closeEventFn);

      popupStatus.value = PopupStatus.Created;

      // Show popup if requested
      if (showVal && withMapVal) {
        show();
      } else if (withMapVal) {
        addToMap();
      }
    } catch (error) {
      popupStatus.value = PopupStatus.Error;
      logError('Error creating popup:', error);
      popup.value = null;
    }
  }

  // Watch for map changes and manage popup lifecycle
  watchEffect((onCleanUp) => {
    const map = mapInstance.value;
    if (map && popupStatus.value === PopupStatus.NotCreated && autoCreate) {
      createPopup();
    } else if (!map && isPopupCreated.value) {
      removePopup();
    }
    onCleanUp(removePopup);
  });

  // Watch for HTML content changes
  watch(htmlValue, (newHtml) => {
    if (popup.value && newHtml) {
      setHTMLContent(newHtml);
    }
  });

  // Watch for position changes
  watch(lnglatValue, (newLnglat) => {
    if (popup.value && newLnglat && lngLatLikeHasValue(newLnglat)) {
      setLngLat(newLnglat);
    }
  });

  /**
   * Sets the popup's position with error handling
   * @param lnglat - New position for the popup
   */
  function setLngLat(lnglat: LngLatLike): void {
    if (!popup.value) return;

    try {
      popup.value.setLngLat(lnglat);
    } catch (error) {
      logError('Error setting popup position:', error, { lnglat });
    }
  }

  /**
   * Sets the popup's offset with error handling
   * @param offset - Offset for the popup
   */
  function setOffset(offset: PointLike): void {
    if (!popup.value) return;

    try {
      popup.value.setOffset(offset);
    } catch (error) {
      logError('Error setting popup offset:', error, { offset });
    }
  }

  /**
   * Adds a CSS class to the popup with error handling
   * @param className - CSS class name to add
   */
  function addClassName(className: string): void {
    if (!popup.value) return;
    try {
      popup.value.addClassName(className);
    } catch (error) {
      logError('Error adding popup class:', error, { className });
    }
  }

  /**
   * Removes a CSS class from the popup with error handling
   * @param className - CSS class name to remove
   */
  function removeClassName(className: string): void {
    if (!popup.value) return;

    try {
      popup.value.removeClassName(className);
    } catch (error) {
      logError('Error removing popup class:', error, { className });
    }
  }

  /**
   * Sets the popup's maximum width with error handling
   * @param width - Maximum width value
   */
  function setMaxWidth(width: string): void {
    if (!popup.value) return;

    try {
      popup.value.setMaxWidth(width);
    } catch (error) {
      logError('Error setting popup max width:', error, { width });
    }
  }

  /**
   * Shows the popup on the map
   */
  function show(): void {
    const map = mapInstance.value;

    if (!map) return;

    if (!popup.value) return;

    try {
      if (!popup.value.isOpen()) {
        popup.value.addTo(map);
      }
    } catch (error) {
      logError('Error showing popup:', error);
    }
  }

  /**
   * Hides the popup from the map
   */
  function hide(): void {
    if (!popup.value) return;

    try {
      if (popup.value.isOpen()) {
        popup.value.remove();
      }
    } catch (error) {
      logError('Error hiding popup:', error);
    }
  }

  /**
   * Toggles the popup visibility
   */
  function toggle(): void {
    if (!popup.value) return;

    try {
      if (popup.value.isOpen()) {
        hide();
      } else {
        show();
      }
    } catch (error) {
      logError('Error toggling popup:', error);
    }
  }

  /**
   * Adds the popup to the map without showing it
   */
  function addToMap(): void {
    const map = mapInstance.value;

    if (!map) return;

    if (!popup.value) return;

    try {
      popup.value.addTo(map);
    } catch (error) {
      logError('Error adding popup to map:', error);
    }
  }

  /**
   * Sets the popup's HTML content with error handling
   * @param html - HTML content to set
   */
  function setHTMLContent(html?: string): void {
    if (!popup.value) return;

    const content = html || htmlValue.value;
    if (!content) return;

    try {
      popup.value.setHTML(content);
    } catch (error) {
      logError('Error setting popup HTML content:', error, { content });
    }
  }

  /**
   * Sets the popup's DOM content with error handling
   * @param element - DOM element to set as content
   */
  function setDOMContent(element: HTMLElement): void {
    if (!popup.value) return;

    try {
      popup.value.setDOMContent(element);
    } catch (error) {
      logError('Error setting popup DOM content:', error, { element });
    }
  }

  /**
   * Sets the popup's text content with error handling
   * @param text - Text content to set
   */
  function setText(text: string): void {
    if (!popup.value) return;

    try {
      popup.value.setText(text);
    } catch (error) {
      logError('Error setting popup text content:', error, { text });
    }
  }

  /**
   * Gets the popup's current position
   * @returns Current position or null
   */
  function getLngLat(): LngLatLike | null {
    if (!popup.value) return null;

    try {
      return popup.value.getLngLat();
    } catch (error) {
      logError('Error getting popup position:', error);
      return null;
    }
  }

  /**
   * Gets the popup's DOM element
   * @returns The popup's DOM element or null
   */
  function getElement(): HTMLElement | null {
    if (!popup.value) return null;

    try {
      return popup.value.getElement();
    } catch (error) {
      logError('Error getting popup element:', error);
      return null;
    }
  }

  /**
   * Removes the popup and cleans up resources
   */
  function removePopup(): void {
    if (!popup.value) return;

    try {
      // Remove event listeners
      popup.value.off('open', openEventFn);
      popup.value.off('close', closeEventFn);

      // Hide popup if open
      if (popup.value.isOpen()) {
        popup.value.remove();
      }

      popupStatus.value = PopupStatus.Removed;
    } catch (error) {
      logError('Error removing popup:', error);
    } finally {
      popup.value = null;
      popupStatus.value = PopupStatus.NotCreated;
    }
  }

  // Cleanup function for removing popup and stopping watchers
  function cleanup(): void {
    removePopup();
  }

  // Cleanup on component unmount
  onUnmounted(cleanup);

  return {
    popup: popup.value,
    popupStatus: popupStatus.value,
    isPopupCreated: isPopupCreated.value,
    isPopupOpen: isPopupOpen.value,
    setLngLat,
    setOffset,
    addClassName,
    removeClassName,
    setMaxWidth,
    show,
    hide,
    toggle,
    addToMap,
    setHTMLContent,
    setDOMContent,
    setText,
    removePopup,
    createPopup,
    getLngLat,
    getElement,
  };
}
