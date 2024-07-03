<script lang="ts" setup>
import { ref, inject, watch } from 'vue';
import {
  MapProvideKey,
  SourceProvideKey,
  MapboxLayerEvents,
} from '@libs/enums';
import { useLayerEventListener, useCreateCircleLayer } from '@libs/composables';
import type {
  CreateLayerActions,
  AnyLayout,
  CircleLayerStyle,
} from '@libs/types';
import type {
  Map,
  MapLayerEventType,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  FilterSpecification,
  FillLayerSpecification,
} from 'maplibre-gl';

interface LayerProps {
  id?: string;
  filter?: FilterSpecification;
  style?: CircleLayerStyle;
  maxzoom?: number;
  minzoom?: number;
  metadata?: object;
  source?: string | object;
  sourceLayer?: string;
  beforeId?: string;
  visible?: boolean;
  register?: (
    actions: CreateLayerActions<FillLayerSpecification>,
    map: Map,
  ) => void;
}

interface Emits {
  (e: keyof MapLayerEventType, ev: any): void;
  (e: 'register', actions: any, map: Map): void;
  (e: 'click', ev: MapLayerMouseEvent): void;
  (e: 'dblclick', ev: MapLayerMouseEvent): void;
  (e: 'mousedown', ev: MapLayerMouseEvent): void;
  (e: 'mouseup', ev: MapLayerMouseEvent): void;
  (e: 'mousemove', ev: MapLayerMouseEvent): void;
  (e: 'mouseenter', ev: MapLayerMouseEvent): void;
  (e: 'mouseleave', ev: MapLayerMouseEvent): void;
  (e: 'mouseover', ev: MapLayerMouseEvent): void;
  (e: 'mouseout', ev: MapLayerMouseEvent): void;
  (e: 'contextmenu', ev: MapLayerMouseEvent): void;
  (e: 'touchstart', ev: MapLayerTouchEvent): void;
  (e: 'touchend', ev: MapLayerTouchEvent): void;
  (e: 'touchcancel', ev: MapLayerTouchEvent): void;
}

const props = withDefaults(defineProps<LayerProps>(), {
  visible: undefined,
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
} = useCreateCircleLayer({
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

watch(
  () => props.visible,
  (visible) => setLayoutProperty('visibility', visible ? 'visible' : 'none'),
);
</script>
<template></template>
