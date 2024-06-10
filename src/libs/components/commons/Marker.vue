<script lang="ts" setup>
import { MapProvideKey } from '@libs/enums'
import { useCreateMarker } from '@libs/hooks'
import type {
  LngLatLike,
  Alignment,
  PointLike,
  MarkerOptions,
  PositionAnchor,
  Popup
} from 'maplibre-gl'

interface MarkerProps {
  lnglat?: LngLatLike
  popup?: Popup
  options?: MarkerOptions
  draggable?: boolean
  element?: HTMLElement | undefined

  offset?: PointLike | undefined
  anchor?: PositionAnchor | undefined

  color?: string | undefined
  clickTolerance?: number | null | undefined
  rotation?: number | undefined
  rotationAlignment?: Alignment | undefined
  pitchAlignment?: Alignment | undefined
  scale?: number | undefined
  occludedOpacity?: number | undefined
}

const props = withDefaults(defineProps<MarkerProps>(), {
  options: () => ({})
})
const emit = defineEmits<{
  (e: 'dragstart', ev: Event): void
  (e: 'drag', ev: Event): void
  (e: 'dragend', ev: Event): void
}>()
const slots = useSlots()

const mapInstance = inject(MapProvideKey, ref(null))
const markerElRef = ref<HTMLElement>()

const { setDraggable, setLngLat } = useCreateMarker({
  map: mapInstance,
  el: slots.default?.() ? markerElRef : undefined,
  lnglat: props.lnglat,
  popup: props.popup,
  options: {
    ...props.options,
    ...(props.draggable === undefined
      ? {}
      : {
          draggable: props.draggable
        })
  },
  on: {
    dragstart: ev => emit('dragstart', ev),
    drag: ev => emit('drag', ev),
    dragend: ev => emit('dragend', ev)
  }
})

watch(
  () => props.lnglat,
  lnglat => {
    lnglat && setLngLat(lnglat)
  }
)

watch(() => props.draggable, setDraggable)
</script>
<template>
  <div ref="markerElRef">
    <slot />
  </div>
</template>
