<script lang="ts" setup>
import { MapProvideKey, GeolocateEvents } from '@libs/enums'
import { useGeolocateControl, useGeoControlEventListener } from '@libs/hooks'
import type { ControlPosition, GeolocateControlOptions } from 'maplibre-gl'
import type { GeolocateSuccess } from '@libs/types'

interface GeolocateControlProps {
  position?: ControlPosition
  options?: GeolocateControlOptions
}

interface Emits {
  (e: 'geolocate', ev: GeolocateSuccess): void
  (e: 'error', ev: GeolocationPositionError): void
  (e: 'outofmaxbounds', ev: GeolocateSuccess): void
  (e: 'trackuserlocationstart', ev: GeolocateSuccess): void
  (e: 'trackuserlocationend', ev: GeolocateSuccess): void
}

const props = defineProps<GeolocateControlProps>()
const emits = defineEmits<Emits>()

const mapInstance = inject(MapProvideKey, ref(null))

const { geolocateControl } = useGeolocateControl({
  map: mapInstance,
  ...props
})

GeolocateEvents.map(eventName => {
  useGeoControlEventListener({
    geo: geolocateControl,
    event: eventName,
    on: data => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      emits(eventName, data)
    }
  })
})
</script>
<template></template>
