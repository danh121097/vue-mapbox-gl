<script lang="ts" setup>
import { MapProvideKey } from '@libs/enums'
import { useFullscreenControl } from '@libs/hooks'
import type { ControlPosition } from 'maplibre-gl'

interface FullscreenControlProps {
  container?: HTMLElement | string
  position?: ControlPosition
}

const props = defineProps<FullscreenControlProps>()

const mapInstance = inject(MapProvideKey, ref(null))

useFullscreenControl({
  map: mapInstance,
  ...props
})
</script>
<template></template>
