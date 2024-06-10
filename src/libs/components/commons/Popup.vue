<script lang="ts" setup>
import { MapProvideKey } from '@libs/enums'
import { useCreatePopup } from '@libs/hooks'
import type { LngLatLike, PopupOptions } from 'maplibre-gl'

interface PopupProps {
  className?: string
  lnglat?: LngLatLike
  show?: boolean
  options?: PopupOptions
}

const props = withDefaults(defineProps<PopupProps>(), {
  show: false
})
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'open'): void
  (event: 'update:show', show: boolean): void
}>()
const mapInstance = inject(MapProvideKey, ref(null))
const popupElRef = ref<HTMLElement>()

const { setLngLat, show, hide } = useCreatePopup({
  map: mapInstance,
  el: popupElRef,
  lnglat: props.lnglat,
  show: props.show,
  options: props.options,
  on: {
    open: () => {
      emit('open')
      emit('update:show', true)
    },
    close: async () => {
      emit('close')
      emit('update:show', false)
    }
  }
})
watch(
  () => props.show,
  isShow => {
    isShow ? show() : hide()
  }
)

watch(
  () => props.lnglat,
  lnglat => {
    lnglat && setLngLat(lnglat)
  }
)
</script>
<template>
  <div ref="popupElRef" class="mapboxgl-popup-content-inner">
    <slot />
  </div>
</template>
