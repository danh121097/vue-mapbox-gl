<script lang="ts" setup>
import { useCreateImage } from '@libs/hooks'
import { MapProvideKey } from '@libs/enums'
import type { ImageDatas, ImageOptions } from '@libs/types'

interface ImageItem {
  id: string
  image: ImageDatas | string
  options?: ImageOptions
}

interface ImageProps {
  images: ImageItem[]
  options?: ImageOptions
}

const props = withDefaults(defineProps<ImageProps>(), {
  images: () => []
})
const loading = ref(true)
const mapInstance = inject(MapProvideKey, ref(null))

loadImages(props.images)

function loadImages(images: ImageItem[]) {
  const allLoadPromise = images.map(image => {
    const actions = useCreateImage({
      map: mapInstance,
      id: image.id,
      image: image.image,
      options: image.options || props.options
    })
    return actions.loadPromise
  })

  Promise.all(allLoadPromise).finally(() => {
    loading.value = false
  })
}
</script>
<template>
  <slot v-if="!loading" />
</template>
