<script lang="ts" setup>
import { MapProvideKey } from '@libs/enums'
import { useScaleControl } from '@libs/hooks'
import type { ControlPosition, ScaleControlOptions } from 'maplibre-gl'

interface ScaleControlProps {
  position?: ControlPosition
  maxWidth?: ScaleControlOptions['maxWidth']
  unit?: ScaleControlOptions['unit']
}

const props = defineProps<ScaleControlProps>()

const mapInstance = inject(MapProvideKey, ref(null))

useScaleControl({
  map: mapInstance,
  ...props
})
</script>
<template></template>
