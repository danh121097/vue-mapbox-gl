<script lang="ts" setup>
import { inject, ref, provide, watch } from 'vue';
import { MapProvideKey, SourceProvideKey } from '@libs/enums';
import { useCreateGeoJsonSource } from '@libs/composables';
import type { CreateGeoJsonSourceActions } from '@libs/composables';
import type { GeoJSONSourceSpecification } from 'maplibre-gl';

interface GeoJsonSourceProps {
  id?: string;
  data: GeoJSONSourceSpecification['data'];
  options?: Partial<GeoJSONSourceSpecification>;
  register?: (actions: CreateGeoJsonSourceActions) => void;
}

interface Emits {
  (e: 'register', actions: CreateGeoJsonSourceActions): void;
}

const props = withDefaults(defineProps<GeoJsonSourceProps>(), {
  data: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
});

const emits = defineEmits<Emits>();

const mapInstance = inject(MapProvideKey, ref(null));

const { setData, getSource } = useCreateGeoJsonSource({
  map: mapInstance,
  id: props.id,
  data: props.data,
  options: props.options,
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
