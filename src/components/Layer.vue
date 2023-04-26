<script lang="ts" setup>
import {
  onMounted,
  onBeforeUnmount,
  nextTick,
  inject,
  toRefs,
  watch
} from 'vue';
import type { ShallowRef } from 'vue';
import { GeoJSONSource, Map } from 'mapbox-gl';
import type { AnySourceData, AnyLayer } from 'mapbox-gl';

export interface LayerOptions {
  layerIdx?: string;
  sourceId: string;
  sourceData: AnySourceData;
  layerConfig: AnyLayer[];
}

const emits = defineEmits(['click']);
const props = defineProps<LayerOptions>();
const { layerIdx, sourceId, sourceData, layerConfig } = toRefs(props);

const map = inject<ShallowRef<Map>>('map');

function addLayer(map?: Map) {
  if (!map) return;

  map.addSource(sourceId.value, sourceData.value);

  layerConfig.value.forEach((config) => {
    map.addLayer(
      { ...config, source: sourceId.value } as AnyLayer,
      layerIdx?.value
    );
  });

  const layerIds = layerConfig.value.map((config) => config.id);
  map.on('click', layerIds, (e) => emits('click', e));
}

watch(sourceData, (value) => {
  const source = map?.value?.getSource(sourceId.value) as GeoJSONSource;
  source.setData((value as any).data);
});

onMounted(async () => {
  await nextTick();
  addLayer(map?.value);
});

onBeforeUnmount(() => {
  map?.value?.removeSource(sourceId.value);
  layerConfig.value.forEach((config) => {
    map?.value?.removeLayer(config.id);
  });
});
</script>
