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
import type { SourceSpecification, LayerSpecification } from 'maplibre-gl';
import type { ShallowRef } from 'vue';

interface LayerOptions {
  sourceId: string;
  layerId: string;
  source: SourceSpecification;
  layer: LayerSpecification;
  before?: string;
}

const emits = defineEmits(mapLayerEvents);
const props = defineProps<LayerOptions>();
const { sourceId, layerId, source, layer, before } = toRefs(props);

const map = inject<ShallowRef<Map>>(MAP_KEY);
const LAYER = {
  ...layer.value,
  id: layerId.value,
  source: sourceId.value
};

watch(source, (value) => {
  const source = map?.value?.getSource(sourceId.value) as GeoJSONSource;
  source.setData((value as any).data);
});

function addLayer(map?: Map) {
  if (!map) return;

  return new Promise((resolve) => {
    map.addSource(sourceId.value, source.value);
    map.addLayer(LAYER, before?.value);
    resolve(true);
  });
}

function listenerLayerEvent() {
  mapLayerEvents.forEach((event) => {
    map?.value.on(event, layerId.value, (e) => emits(event, e));
  });
}

function removeLayerEvent() {
  mapLayerEvents.forEach((event) => {
    map?.value.off(event, layerId.value, (e) => emits(event, e));
  });
}

onMounted(async () => {
  await nextTick();
  await addLayer(map?.value);
  listenerLayerEvent();
});

onBeforeUnmount(() => {
  removeLayerEvent();
  map?.value.removeLayer(layerId.value);
  map?.value.removeSource(sourceId.value);
});
</script>
