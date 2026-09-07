<script lang="ts" setup>
import { inject, ref, watch, onMounted, onUnmounted, effectScope } from 'vue';
import type { EffectScope } from 'vue';
import { useCreateImage, useLogger } from '@libs/composables';
import { MapProvideKey } from '@libs/enums';
import type { ImageItem } from '@libs/types';
import type { StyleImageMetadata } from 'maplibre-gl';

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

interface Emits {
  /**
   * An image failed to load. `imageId` is absent for batch-level failures.
   *
   * Declared as an emit only — a matching `onError` *prop* would be invoked
   * twice, once as a prop and once as the emit listener Vue derives from it.
   */
  (e: 'error', error: unknown, imageId?: string): void;
}

// Component props with sensible defaults
const props = withDefaults(defineProps<ImageProps>(), {
  images: () => [],
  showLoading: true,
  forceRecreateOnDimensionChange: true,
});

const emits = defineEmits<Emits>();

const { logError } = useLogger(props.debug);

/**
 * Surfaces a load failure to the consumer.
 *
 * `useCreateImage` attaches its own handler to `loadPromise`, so a failure no
 * longer escapes as an `unhandledrejection`, and `logError` is opt-in via
 * `debug`. Without this emit a failed image would be entirely silent.
 */
function reportError(error: unknown, imageId?: string): void {
  emits('error', error, imageId);
}

// Reactive state
const loading = ref(true);

// Injected dependencies
const mapInstance = inject(MapProvideKey, ref(null));

/**
 * Owns every `useCreateImage` instance for the current `images` array.
 *
 * `useCreateImage` registers its own disposal hook, which only runs when the
 * scope that created it is stopped. Creating instances from a watcher or from
 * `onMounted` leaves them attached to no scope at all, so `map.removeImage()`
 * never runs and every reload leaks a map image. Holding an explicit scope and
 * stopping it before each reload gives those instances a real owner.
 */
let imagesScope: EffectScope | undefined;

/**
 * Identifies the newest `loadImages` call. Disposing a scope settles the
 * previous batch's promises immediately, so a superseded call resumes on the
 * very next microtask — it must not clear `loading` while the batch that
 * replaced it is still loading.
 */
let loadGeneration = 0;

/** Stops the current scope, disposing every image instance it owns. */
function disposeImagesScope(): void {
  try {
    imagesScope?.stop();
  } catch (error) {
    logError('Error disposing image scope:', error);
  } finally {
    imagesScope = undefined;
  }
}

/**
 * Enhanced image loading function with error handling and progress tracking
 * @param images - Array of images to load
 */
async function loadImages(images: ImageItem[]): Promise<void> {
  const generation = ++loadGeneration;

  // Release the previous batch first so its images are removed from the map
  // before the new instances add them back.
  disposeImagesScope();

  if (!images.length) {
    loading.value = false;
    return;
  }

  loading.value = true;

  try {
    const scope = effectScope();
    imagesScope = scope;

    // Instantiation must stay synchronous so the scope is still active for
    // every `useCreateImage` call.
    const loadPromises =
      scope.run(() =>
        images.map((image) => {
          const actions = useCreateImage({
            map: mapInstance,
            id: image.id,
            image: image.image,
            options: image.options || props.options,
            debug: props.debug,
            forceRecreateOnDimensionChange:
              props.forceRecreateOnDimensionChange,
          });

          return actions.loadPromise.catch((error) => {
            logError(`Failed to load image ${image.id}:`, error);
            reportError(error, image.id);
          });
        }),
      ) ?? [];

    await Promise.allSettled(loadPromises);
  } catch (error) {
    logError('Error loading images:', error);
    reportError(error);
  } finally {
    // A newer call has taken over; it owns `loading` from here.
    if (generation === loadGeneration) {
      loading.value = false;
    }
  }
}

// Watch for changes in images prop
// An empty array must reach `loadImages` too — that is what releases the
// previous batch's images from the map.
watch(
  () => props.images,
  (newImages) => {
    loadImages(newImages);
  },
  { immediate: false },
);

// Load images on mount
onMounted(() => {
  loadImages(props.images);
});

// Release every image instance the component still owns
onUnmounted(disposeImagesScope);
</script>
<template>
  <slot v-if="!loading" />
</template>
