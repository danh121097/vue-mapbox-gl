<script lang="ts" setup>
import { inject, ref } from 'vue';
import { useCreateImage } from '@libs/composables';
import { MapProvideKey } from '@libs/enums';
import type { ImageDatas } from '@libs/types';
import type { StyleImageMetadata } from 'maplibre-gl';

interface ImageItem {
  id: string;
  image: ImageDatas | string;
  options?: Partial<StyleImageMetadata>;
}

interface ImageProps {
  images: ImageItem[];
  options?: Partial<StyleImageMetadata>;
}

const props = withDefaults(defineProps<ImageProps>(), {
  images: () => [],
});

const loading = ref(true);

const mapInstance = inject(MapProvideKey, ref(null));

loadImages(props.images);

function loadImages(images: ImageItem[]) {
  const allLoadPromise = images.map((image) => {
    const actions = useCreateImage({
      map: mapInstance,
      id: image.id,
      image: image.image,
      options: image.options || props.options,
    });
    return actions.loadPromise;
  });

  Promise.all(allLoadPromise).finally(() => {
    loading.value = false;
  });
}
</script>
<template>
  <slot v-if="!loading" />
</template>
