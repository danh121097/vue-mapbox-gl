<script lang="ts" setup>
import { MapProvideKey } from '@libs/enums'
import { useNavigationControl } from '@libs/hooks'
import type { ControlPosition } from 'maplibre-gl'

interface ScaleControlProps {
  position?: ControlPosition
  showCompass?: boolean
  showZoom?: boolean
  visualizePitch?: boolean
}

const props = withDefaults(defineProps<ScaleControlProps>(), {
  showCompass: true,
  showZoom: true,
  visualizePitch: false
})

const mapInstance = inject(MapProvideKey, ref(null))

useNavigationControl({
  map: mapInstance,
  ...props
})
</script>
<template></template>
