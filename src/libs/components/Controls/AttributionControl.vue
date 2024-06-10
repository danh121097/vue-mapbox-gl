<script lang="ts" setup>
import { MapProvideKey } from '@libs/enums'
import { useAttributionControl } from '@libs/hooks'

import type { AttributionControlOptions, ControlPosition } from 'maplibre-gl'
interface AttributionControlProps {
  position?: ControlPosition
  compact?: AttributionControlOptions['compact']
  customAttribution?: AttributionControlOptions['customAttribution']
}
const props = defineProps<AttributionControlProps>()
const mapInstance = inject(MapProvideKey, ref(null))

useAttributionControl({
  map: mapInstance,
  ...props
})
</script>
<template></template>
