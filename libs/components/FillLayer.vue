<script lang="ts" setup>
import { ref, inject, watch } from 'vue';
import {
  MapProvideKey,
  SourceProvideKey,
  MapboxLayerEvents,
} from '@libs/enums';
import { useCreateFillLayer, useLayerEventListener } from '@libs/composables';
import type {
  CreateLayerActions,
  AnyLayout,
  FillLayerStyle,
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
  style?: FillLayerStyle;
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
  ) => any;
}

interface Emits {
  (e: keyof MapLayerEventType, ev: any): any;
  (e: 'register', actions: any, map: Map): any;
  (e: 'click', ev: MapLayerMouseEvent): any;
  (e: 'dblclick', ev: MapLayerMouseEvent): any;
  (e: 'mousedown', ev: MapLayerMouseEvent): any;
  (e: 'mouseup', ev: MapLayerMouseEvent): any;
  (e: 'mousemove', ev: MapLayerMouseEvent): any;
  (e: 'mouseenter', ev: MapLayerMouseEvent): any;
  (e: 'mouseleave', ev: MapLayerMouseEvent): any;
  (e: 'mouseover', ev: MapLayerMouseEvent): any;
  (e: 'mouseout', ev: MapLayerMouseEvent): any;
  (e: 'contextmenu', ev: MapLayerMouseEvent): any;
  (e: 'touchstart', ev: MapLayerTouchEvent): any;
  (e: 'touchend', ev: MapLayerTouchEvent): any;
  (e: 'touchcancel', ev: MapLayerTouchEvent): any;
}

const props = withDefaults(defineProps<LayerProps>(), {
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
} = useCreateFillLayer({
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

watch(() => props.filter!, setFilter);

watch(() => props.style!, setStyle);

watch(() => props.maxzoom!, setZoomRange);

watch(() => props.minzoom!, setZoomRange);

watch(() => props.beforeId!, setBeforeId);

watch(
  () => props.visible!,
  (visible) => setLayoutProperty('visibility', visible ? 'visible' : 'none'),
);
</script>
<template></template>
