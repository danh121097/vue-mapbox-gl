<script lang="ts" setup>
import {
  onMounted,
  onBeforeUnmount,
  nextTick,
  inject,
  toRefs,
  watch
} from 'vue';
import { GeoJSONSource, Map } from 'maplibre-gl';
import { mapLayerEvents } from '@constants';
import { MAP_KEY } from '@enums';
import type { Vue3MapBox } from '@types';
import type { SourceSpecification, LayerSpecification } from 'maplibre-gl';
import type { ShallowRef } from 'vue';

interface LayerOptions {
  sourceId: string;
  id: string;
  source: SourceSpecification;
  paint?: Vue3MapBox.PaintSpecification;
  layout?: Vue3MapBox.LayoutSpecification;
  type: Vue3MapBox.LayerType;
  before?: string;
}

const emits = defineEmits(mapLayerEvents);
const props = defineProps<LayerOptions>();
const { sourceId, id, source, before } = toRefs(props);

const map = inject<ShallowRef<Map>>(MAP_KEY);
const LAYER = {
  paint: props.paint || {},
  layout: props.layout || {},
  type: props.type,
  id: id.value,
  source: sourceId.value
};

watch(source, (value) => {
  const source = map?.value?.getSource(sourceId.value) as GeoJSONSource;
  if (source) source.setData((value as any).data);
});

function addLayer(map?: Map) {
  if (!map) return;

  return new Promise((resolve) => {
    if (!map.getSource(sourceId.value))
      map.addSource(sourceId.value, source.value);
    map.addLayer(LAYER as unknown as LayerSpecification, before?.value);
    resolve(true);
  });
}

function listenerLayerEvent() {
  mapLayerEvents.forEach((event) => {
    map?.value.on(event, id.value, (e) => emits(event, e));
  });
}

function removeLayerEvent() {
  mapLayerEvents.forEach((event) => {
    map?.value.off(event, id.value, (e) => emits(event, e));
  });
}

onMounted(async () => {
  await nextTick();
  await addLayer(map?.value);
  listenerLayerEvent();
});

onBeforeUnmount(() => {
  removeLayerEvent();
  map?.value.removeLayer(id.value);
  map?.value.removeSource(sourceId.value);
});
</script>
