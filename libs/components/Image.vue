<script lang="ts" setup>
import { inject, ref, computed, watch, onMounted } from 'vue';
import { useCreateImage, useLogger } from '@libs/composables';
import { MapProvideKey } from '@libs/enums';
import type { ImageDatas } from '@libs/types';
import type { StyleImageMetadata } from 'maplibre-gl';

/**
 * Interface for individual image items
 */
interface ImageItem {
  /** Unique identifier for the image */
  id: string;
  /** Image data (URL string or ImageData/HTMLImageElement) */
  image: ImageDatas | string;
  /** Optional image metadata and options */
  options?: Partial<StyleImageMetadata>;
}

/**
 * Props interface for Image component
 * Manages multiple images for MapLibre GL
 */
interface ImageProps {
  /** Array of images to load */
  images: ImageItem[];
  /** Default options applied to all images */
  options?: Partial<StyleImageMetadata>;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Whether to enable debug logging */
  debug?: boolean;
  /**
   * Force recreation when image dimensions change instead of throwing error.
   * When true (default), images are always removed and re-added to prevent dimension mismatch errors.
   * This solves the common "width and height must be the same as the previous version" error.
   */
  forceRecreateOnDimensionChange?: boolean;
}

// Component props with sensible defaults
const props = withDefaults(defineProps<ImageProps>(), {
  images: () => [],
  showLoading: true,
  forceRecreateOnDimensionChange: true,
});

const { logError } = useLogger(props.debug);

// Reactive state
const loading = ref(true);

// Injected dependencies
const mapInstance = inject(MapProvideKey, ref(null));

// Computed properties for better performance
const hasImages = computed(() => props.images.length > 0);

/**
 * Enhanced image loading function with error handling and progress tracking
 * @param images - Array of images to load
 */
async function loadImages(images: ImageItem[]): Promise<void> {
  if (!images.length) {
    loading.value = false;
    return;
  }

  loading.value = true;

  try {
    const loadPromises = images.map(async (image) => {
      try {
        const actions = useCreateImage({
          map: mapInstance,
          id: image.id,
          image: image.image,
          options: image.options || props.options,
          debug: props.debug,
          forceRecreateOnDimensionChange: props.forceRecreateOnDimensionChange,
        });
        await actions.loadPromise;
      } catch (error) {
        const errorMessage = `Failed to load image ${image.id}: ${error}`;
        logError(errorMessage);
      }
    });

    await Promise.allSettled(loadPromises);
  } catch (error) {
    logError('Error loading images:', error);
  } finally {
    loading.value = false;
  }
}

// Watch for changes in images prop
watch(
  () => props.images,
  (newImages) => {
    if (newImages.length > 0) {
      loadImages(newImages);
    }
  },
  { deep: true, immediate: false },
);

// Load images on mount
onMounted(() => {
  if (hasImages.value) {
    loadImages(props.images);
  } else {
    loading.value = false;
  }
});
</script>
<template>
  <slot v-if="!loading" />
</template>
