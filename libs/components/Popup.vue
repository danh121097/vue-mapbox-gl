<script lang="ts" setup>
import { inject, ref, watch } from 'vue';
import { MapProvideKey } from '@libs/enums';
import { useCreatePopup } from '@libs/composables';
import type { LngLatLike, PopupOptions } from 'maplibre-gl';

interface PopupProps {
  className?: string;
  lnglat?: LngLatLike;
  show?: boolean;
  withMap?: boolean;
  options?: PopupOptions;
}

interface Emits {
  (event: 'close'): void;
  (event: 'open'): void;
  (event: 'update:show', show: boolean): void;
}

const props = withDefaults(defineProps<PopupProps>(), {
  show: true,
  withMap: true,
});

const emits = defineEmits<Emits>();

const mapInstance = inject(MapProvideKey, ref(null));
const popupElRef = ref<HTMLElement>();

const { setLngLat, show, hide } = useCreatePopup({
  map: mapInstance,
  el: popupElRef,
  lnglat: props.lnglat,
  show: props.show,
  withMap: props.withMap,
  options: {
    ...props.options,
    className: props.className,
  },
  on: {
    open: () => {
      emits('open');
      emits('update:show', true);
    },
    close: async () => {
      emits('close');
      emits('update:show', false);
    },
  },
});

watch(
  () => props.show,
  (isShow) => {
    isShow ? show() : hide();
  },
);

watch(
  () => props.lnglat,
  (lnglat) => {
    lnglat && setLngLat(lnglat);
  },
);
</script>
<template>
  <div ref="popupElRef" class="mapboxgl-popup-content-inner">
    <slot />
  </div>
</template>
