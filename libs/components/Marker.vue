<script lang="ts" setup>
import { inject, ref, useSlots, watch } from 'vue';
import { MapProvideKey } from '@libs/enums';
import { useCreateMarker } from '@libs/composables';
import type { Anchor } from '@libs/types';
import type {
  LngLatLike,
  Alignment,
  PointLike,
  MarkerOptions,
  Popup,
} from 'maplibre-gl';

interface MarkerProps {
  lnglat?: LngLatLike;
  popup?: Popup;
  options?: MarkerOptions;
  draggable?: boolean;
  element?: HTMLElement | undefined;

  offset?: PointLike | undefined;
  anchor?: Anchor | undefined;

  color?: string | undefined;
  clickTolerance?: number | null | undefined;
  rotation?: number | undefined;
  rotationAlignment?: Alignment | undefined;
  pitchAlignment?: Alignment | undefined;
  scale?: number | undefined;
  occludedOpacity?: number | undefined;
}

interface Emits {
  (e: 'dragstart', ev: Event): void;
  (e: 'drag', ev: Event): void;
  (e: 'dragend', ev: Event): void;
}

const props = withDefaults(defineProps<MarkerProps>(), {
  options: () => ({}),
});

const emits = defineEmits<Emits>();

const slots = useSlots();

const mapInstance = inject(MapProvideKey, ref(null));
const markerElRef = ref<HTMLElement>();

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
          draggable: props.draggable,
        }),
  },
  on: {
    dragstart: (ev) => emits('dragstart', ev),
    drag: (ev) => emits('drag', ev),
    dragend: (ev) => emits('dragend', ev),
  },
});

watch(
  () => props.lnglat,
  (lnglat) => {
    lnglat && setLngLat(lnglat);
  },
);

watch(() => props.draggable, setDraggable);
</script>
<template>
  <div ref="markerElRef">
    <slot />
  </div>
</template>
