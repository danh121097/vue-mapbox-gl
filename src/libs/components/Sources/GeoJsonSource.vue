<script lang="ts" setup>
import { MapProvideKey, SourceProvideKey } from '@libs/enums'
import { useCreateGeoJsonSource } from '@libs/hooks'
import type { GeoJSONSourceOptions, SourceSpecification } from 'maplibre-gl'
import type { CreateGeoJsonSourceActions } from '@libs/hooks'

interface GeoJsonSourceProps {
  id?: string
  data?: SourceSpecification
  options?: Partial<GeoJSONSourceOptions>
}

interface Emits {
  (e: 'register', actions: CreateGeoJsonSourceActions): void
}

const props = withDefaults(
  defineProps<
    GeoJsonSourceProps & {
      register?: (actions: CreateGeoJsonSourceActions) => void
    }
  >(),
  {
    options: () => ({}),
    data: () => ({
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })
  }
)
const emits = defineEmits<Emits>()

const mapInstance = inject(MapProvideKey, ref(null))

const { setData, getSource } = useCreateGeoJsonSource({
  map: mapInstance,
  id: props.id,
  data: props.data,
  options: props.options,
  register: actions => {
    props.register?.(actions)
    emits('register', actions)
  }
})

provide(SourceProvideKey, getSource)

watch(() => props.data, setData, {
  deep: true,
  immediate: true
})
</script>
<template>
  <slot />
</template>
