<script lang="ts" setup>
import { inject, watch, ref, provide } from 'vue';
import { MapProvideKey, SourceProvideKey } from '@libs/enums';
import { useCreateGeoJsonSource } from '@libs/composables';
import type { CreateGeoJsonSourceActions } from '@libs/composables';
import type { SourceSpecification } from 'maplibre-gl';

interface GeoJsonSourceProps {
  id?: string;
  data?: SourceSpecification;
  register?: (actions: CreateGeoJsonSourceActions) => void;
}

interface Emits {
  (e: 'register', actions: CreateGeoJsonSourceActions): void;
}

const props = withDefaults(defineProps<GeoJsonSourceProps>(), {
  data: () => ({
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  }),
});

const emits = defineEmits<Emits>();

const mapInstance = inject(MapProvideKey, ref(null));

const { setData, getSource } = useCreateGeoJsonSource({
  map: mapInstance,
  id: props.id,
  data: props.data,
  register: (actions) => {
    props.register?.(actions);
    emits('register', actions);
  },
});

provide(SourceProvideKey, getSource);

watch(() => props.data, setData, {
  deep: true,
  immediate: true,
});
</script>
<template>
  <slot />
</template>
