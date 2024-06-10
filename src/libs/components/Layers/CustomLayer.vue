<script lang="ts" setup>
import { MapProvideKey } from '@libs/enums'
import { useCreateCustomLayer } from '@libs/hooks'
import type { CustomLayerInterface } from 'maplibre-gl'

interface LayerProps {
  customLayer: CustomLayerInterface | (new () => CustomLayerInterface)
  beforeId?: string
}

const props = defineProps<LayerProps>()

const mapInstance = inject(MapProvideKey, ref(null))

const { setBeforeId } = useCreateCustomLayer({
  map: mapInstance,
  customLayer: props.customLayer
})

watch(() => props.beforeId, setBeforeId)
</script>
<template></template>
