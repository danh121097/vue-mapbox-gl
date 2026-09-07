import { unref, watch, computed, ref, onScopeDispose } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, ImageDatas } from '@libs/types';
import type { ComputedRef, MaybeRef } from 'vue';
import type { Map, StyleImageMetadata } from 'maplibre-gl';

/**
 * Image creation status enum for better state management
 */
export enum ImageStatus {
  NotCreated = 'not-created',
  Loading = 'loading',
  Created = 'created',
  Updated = 'updated',
  Error = 'error',
}

interface CreateImageProps {
  map: MaybeRef<Nullable<Map>>;
  id: string;
  image: ImageDatas | string;
  options?: Partial<StyleImageMetadata>;
  debug?: boolean;
  /**
   * Force recreation when image dimensions change instead of throwing error.
   * When true (default), images are always removed and re-added to prevent dimension mismatch errors.
   * When false, uses the legacy behavior of trying updateImage first and falling back to recreation on error.
   */
  forceRecreateOnDimensionChange?: boolean;
}

interface CreateImageActions {
  remove: () => void;
  loadImage: (imageUrl: string) => Promise<HTMLImageElement | ImageBitmap>;
  updateImage: (newImage: ImageDatas | string) => Promise<void>;
  refreshImage: () => Promise<void>;
  hasImage: () => boolean;
  imageStatus: ComputedRef<ImageStatus>;
  isImageReady: ComputedRef<boolean>;
  loadPromise: Promise<void>;
}

/**
 * Composable for creating and managing MapLibre GL Images
 * Provides reactive image management with error handling, performance optimizations, and enhanced API
 *
 * **Important:** MapLibre GL requires that updated images have the same dimensions as the previous version.
 * This composable automatically handles dimension changes by removing and re-adding images when necessary.
 *
 * @param props - Configuration options for the image
 * @returns Enhanced actions and state for the image
 */
export function useCreateImage(props: CreateImageProps): CreateImageActions {
  const { logError } = useLogger(props.debug ?? false);
  const imageStatus = ref<ImageStatus>(ImageStatus.NotCreated);

  // Computed properties for better reactivity and performance
  const mapInstance = computed(() => unref(props.map));
  const isImageReady = computed(
    () =>
      imageStatus.value === ImageStatus.Created ||
      imageStatus.value === ImageStatus.Updated,
  );

  // Set once the owning scope is stopped. `onScopeDispose` can only tear down
  // synchronous state; an `updateImage` call suspended on `await loadImage(...)`
  // keeps running and would re-add the image with no owner left to remove it.
  let isDisposed = false;

  let settleResolve: (value?: any) => void;
  let settleReject: (reason?: any) => void;
  let isPromiseSettled = false;

  const promise = new Promise<void>((resolve, reject) => {
    settleResolve = resolve;
    settleReject = reject;
  });

  // `loadPromise` is public but consumers are not required to await it. Attach a
  // no-op handler so a genuine load failure never surfaces as an
  // `unhandledrejection` (which fails strict test runners and error SDKs).
  // Consumers awaiting `loadPromise` still observe the rejection on their own handle.
  promise.catch(() => {});

  /** Resolves the load promise once; later calls are no-ops. */
  function resolveFn(value?: any): void {
    if (isPromiseSettled) return;
    isPromiseSettled = true;
    settleResolve(value);
  }

  /** Rejects the load promise once; later calls are no-ops. */
  function rejectFn(reason?: any): void {
    if (isPromiseSettled) return;
    isPromiseSettled = true;
    settleReject(reason);
  }

  /**
   * Validates if image operations can be performed safely
   * @returns boolean indicating if operations can proceed
   */
  function validateImageOperation(): boolean {
    const map = mapInstance.value;
    if (!map) return false;
    return true;
  }

  /**
   * Gets the dimensions of an image data object
   * @param imageData - Image data to get dimensions from
   * @returns Object with width and height properties, or null if not determinable
   */
  function getImageDimensions(
    imageData: ImageDatas,
  ): { width: number; height: number } | null {
    try {
      if (imageData instanceof HTMLImageElement) {
        return {
          width: imageData.naturalWidth || imageData.width,
          height: imageData.naturalHeight || imageData.height,
        };
      }
      if (imageData instanceof ImageBitmap) {
        return { width: imageData.width, height: imageData.height };
      }
      if (imageData instanceof ImageData) {
        return { width: imageData.width, height: imageData.height };
      }
      if (
        typeof imageData === 'object' &&
        'width' in imageData &&
        'height' in imageData
      ) {
        return { width: imageData.width, height: imageData.height };
      }
      return null;
    } catch (error) {
      logError('Error getting image dimensions:', error);
      return null;
    }
  }

  /**
   * Checks if the image exists on the map
   * @returns boolean indicating if image exists
   */
  function hasImage(): boolean {
    const map = mapInstance.value;
    if (!map) return false;

    try {
      return map.hasImage(props.id);
    } catch (error) {
      logError('Error checking if image exists:', error, { imageId: props.id });
      return false;
    }
  }

  /**
   * Loads an image from a URL with enhanced error handling
   * @param imageUrl - URL of the image to load
   * @returns Promise resolving to the loaded image data
   */
  async function loadImage(
    imageUrl: string,
  ): Promise<HTMLImageElement | ImageBitmap> {
    if (!validateImageOperation()) {
      throw new Error('Map instance not available');
    }

    const map = mapInstance.value!;

    try {
      const result = await map.loadImage(imageUrl);

      return result.data;
    } catch (error) {
      logError('Error loading image from URL:', error, {
        imageId: props.id,
        imageUrl,
      });
      throw new Error(`Failed to load image from URL: ${imageUrl}`);
    }
  }

  /**
   * Updates or creates an image with enhanced error handling and validation
   * @param newImage - New image data (URL string or ImageData)
   */
  async function updateImage(newImage: ImageDatas | string): Promise<void> {
    if (!validateImageOperation()) {
      throw new Error('Map instance not available');
    }

    const map = mapInstance.value!;
    imageStatus.value = ImageStatus.Loading;

    try {
      let imageData: ImageDatas;

      // Handle string URLs
      if (typeof newImage === 'string') {
        imageData = await loadImage(newImage);
      } else {
        imageData = newImage;
      }

      if (isDisposed) {
        // Scope stopped while the image was loading — drop the result rather
        // than adding an image nothing will ever remove.
        imageStatus.value = ImageStatus.NotCreated;
        resolveFn();
        return;
      }

      // Update or add the image
      if (hasImage()) {
        // Check if we should force recreation when dimensions change
        const forceRecreate = props.forceRecreateOnDimensionChange ?? true; // Default to true for better UX

        if (forceRecreate) {
          // Safe approach: always remove and re-add to avoid dimension mismatch errors
          const newDimensions = getImageDimensions(imageData);

          try {
            // Remove the existing image
            map.removeImage(props.id);

            // Add the new image
            map.addImage(props.id, imageData, props.options);
            imageStatus.value = ImageStatus.Updated;
          } catch (recreateError) {
            logError('Error recreating image:', recreateError, {
              imageId: props.id,
              newDimensions,
            });
            throw recreateError;
          }
        } else {
          // Legacy approach: try update first, fallback to recreate on dimension errors
          try {
            map.updateImage(props.id, imageData);
            imageStatus.value = ImageStatus.Updated;
          } catch (updateError: any) {
            // If update fails due to dimension mismatch, remove and re-add the image
            if (
              updateError?.message?.includes('width and height') ||
              updateError?.message?.includes('same as the previous version')
            ) {
              const newDimensions = getImageDimensions(imageData);
              logError(
                'Image dimensions changed, removing and re-adding image:',
                updateError,
                {
                  imageId: props.id,
                  newDimensions,
                },
              );

              // Remove the existing image
              map.removeImage(props.id);

              // Add the new image with updated dimensions
              map.addImage(props.id, imageData, props.options);
              imageStatus.value = ImageStatus.Created;
            } else {
              // Re-throw if it's a different error
              throw updateError;
            }
          }
        }
      } else {
        map.addImage(props.id, imageData, props.options);
        imageStatus.value = ImageStatus.Created;
      }

      resolveFn();
    } catch (error) {
      imageStatus.value = ImageStatus.Error;
      logError('Error updating/creating image:', error, { imageId: props.id });
      rejectFn(error);
      throw error;
    }
  }

  /**
   * Refreshes the image by re-applying the current image data
   */
  async function refreshImage(): Promise<void> {
    await updateImage(props.image);
  }

  /**
   * Removes the image from the map with enhanced error handling
   */
  function remove(): void {
    const map = mapInstance.value;

    if (!map) {
      // Nothing to remove, but the promise must still settle or an awaiting
      // consumer (and `<Image>`'s `Promise.allSettled`) hangs forever.
      resolveFn();
      return;
    }

    try {
      if (hasImage()) {
        map.removeImage(props.id);
        imageStatus.value = ImageStatus.NotCreated;
      }
    } catch (error) {
      logError('Error removing image:', error, { imageId: props.id });
      imageStatus.value = ImageStatus.Error;
    } finally {
      // Removing before the image ever loaded is not a failure the consumer
      // must handle — settle as resolved rather than rejecting on every unmount.
      resolveFn();
    }
  }

  // Add the image whenever a map becomes available. Keyed on the map alone,
  // not on `imageStatus`: an explicit `remove()` also resets the status, and an
  // effect that tracked it would put the image straight back.
  watch(
    mapInstance,
    (map) => {
      if (!map) return;
      updateImage(props.image).catch((error) => {
        logError('Error adding image on map change:', error);
      });
    },
    { immediate: true },
  );

  // Cleanup when the owning effect scope is disposed. A component's setup scope
  // is disposed on unmount, so this also covers direct use inside a component.
  onScopeDispose(() => {
    isDisposed = true;
    remove();
  });

  return {
    remove,
    loadImage,
    updateImage,
    refreshImage,
    hasImage,
    imageStatus: computed(() => imageStatus.value),
    isImageReady,
    loadPromise: promise,
  };
}
