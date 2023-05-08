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
import { LayerConfig } from '@types';
import type { LayerSpecification } from 'maplibre-gl';
import type { ShallowRef } from 'vue';

const emits = defineEmits(mapLayerEvents);
const props = defineProps<LayerConfig>();
const { sourceId, source, before, id } = toRefs(props);

const map = inject<ShallowRef<Map>>(MAP_KEY);

watch(source, (value) => {
  const source = map?.value?.getSource(sourceId.value) as GeoJSONSource;
  if (source) source.setData((value as any).data);
});

function addLayer(map?: Map) {
  if (!map) return;

  return new Promise((resolve) => {
    map.addSource(sourceId.value, source.value);
    map.addLayer(props as LayerSpecification, before?.value);
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
