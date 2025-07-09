import { unref, watchEffect, computed, ref, onUnmounted } from 'vue';
import { useLogger } from '@libs/composables';
import type { Nullable, ImageDatas } from '@libs/types';
import type { MaybeRef } from 'vue';
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
}

interface CreateImageActions {
  remove: () => void;
  loadImage: (imageUrl: string) => Promise<HTMLImageElement | ImageBitmap>;
  updateImage: (newImage: ImageDatas | string) => Promise<void>;
  refreshImage: () => Promise<void>;
  hasImage: () => boolean;
  imageStatus: Readonly<ImageStatus>;
  isImageReady: boolean;
  loadPromise: Promise<void>;
}

/**
 * Composable for creating and managing MapLibre GL Images
 * Provides reactive image management with error handling, performance optimizations, and enhanced API
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

  let resolveFn: (value?: any) => void;
  let rejectFn: (reason?: any) => void;

  const promise = new Promise<void>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

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

      // Update or add the image
      if (hasImage()) {
        map.updateImage(props.id, imageData);
        imageStatus.value = ImageStatus.Updated;
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

    if (!map) return;

    try {
      if (hasImage()) {
        map.removeImage(props.id);
        imageStatus.value = ImageStatus.NotCreated;
      }
    } catch (error) {
      logError('Error removing image:', error, { imageId: props.id });
      imageStatus.value = ImageStatus.Error;
    } finally {
      rejectFn(new Error('Image removed'));
    }
  }

  // Watch for map changes and manage image lifecycle
  watchEffect(() => {
    const map = mapInstance.value;
    if (map && imageStatus.value === ImageStatus.NotCreated) {
      updateImage(props.image).catch((error) => {
        logError('Error in watchEffect updateImage:', error);
      });
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    remove();
  });

  return {
    remove,
    loadImage,
    updateImage,
    refreshImage,
    hasImage,
    imageStatus: imageStatus.value as Readonly<ImageStatus>,
    isImageReady: isImageReady.value,
    loadPromise: promise,
  };
}
