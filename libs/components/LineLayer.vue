<script lang="ts" setup>
import { ref, inject, watch, watchEffect } from 'vue';
import {
  MapProvideKey,
  SourceProvideKey,
  MapboxLayerEvents,
} from '@libs/enums';
import { useCreateLineLayer, useLayerEventListener } from '@libs/composables';
import type {
  CreateLayerActions,
  AnyLayout,
  LineLayerStyle,
} from '@libs/types';
import type {
  Map,
  MapLayerEventType,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  FilterSpecification,
  LineLayerSpecification,
} from 'maplibre-gl';

interface LayerProps {
  id: string;
  filter: FilterSpecification;
  style: LineLayerStyle;
  maxzoom: number;
  minzoom: number;
  metadata: object;
  source: string | object;
  sourceLayer: string;
  beforeId: string;
  visible: boolean;
  register: (
    actions: CreateLayerActions<LineLayerSpecification>,
    map: Map,
  ) => void;
}

interface Emits {
  (e: keyof MapLayerEventType, ev: any): void;
  (
    e: 'register',
    actions: CreateLayerActions<LineLayerSpecification>,
    map: Map,
  ): void;
  (
    e:
      | 'click'
      | 'dblclick'
      | 'mousedown'
      | 'mouseup'
      | 'mouseup'
      | 'mousemove'
      | 'mouseenter'
      | 'mouseleave'
      | 'mouseover'
      | 'mouseout'
      | 'contextmenu',
    ev: MapLayerMouseEvent,
  ): void;
  (e: 'touchstart' | 'touchend' | 'touchcancel', ev: MapLayerTouchEvent): void;
}

const props = withDefaults(defineProps<Partial<LayerProps>>(), {
  visible: true,
});

const emits = defineEmits<Emits>();

const sourceData = inject(SourceProvideKey, ref(null));
const mapInstance = inject(MapProvideKey, ref(null));

const visibleStyle: AnyLayout = {};

if (props.visible !== undefined)
  visibleStyle['visibility'] = props.visible ? 'visible' : 'none';

const {
  getLayer,
  setBeforeId,
  setFilter,
  setStyle,
  setZoomRange,
  setLayoutProperty,
} = useCreateLineLayer({
  map: mapInstance,
  source: props.source || sourceData,
  style: { ...props.style, ...visibleStyle },
  filter: props.filter || ['all'],
  id: props.id,
  maxzoom: props.maxzoom,
  minzoom: props.minzoom,
  metadata: props.metadata,
  sourceLayer: props.sourceLayer,
  register: (actions, map) => {
    props.register?.(actions as any, map);
    emits('register', actions as any, map);
  },
});

MapboxLayerEvents.map((evt) => {
  useLayerEventListener({
    map: mapInstance,
    layer: getLayer,
    event: evt,
    on: (data) => {
      emits(evt, data);
    },
  });
});

watch(() => props.filter, setFilter);

watch(() => props.style, setStyle);

watch(() => props.maxzoom, setZoomRange);

watch(() => props.minzoom, setZoomRange);

watch(() => props.beforeId, setBeforeId);

watchEffect(() => {
  setLayoutProperty('visibility', props.visible ? 'visible' : 'none');
});
</script>
<template></template>
