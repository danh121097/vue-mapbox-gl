<script lang="ts" setup>
import { onMounted, nextTick, inject, useAttrs, toRefs } from 'vue';
import type { ShallowRef } from 'vue';
import { Map } from 'mapbox-gl';
import type { AnySourceData, AnyLayer } from 'mapbox-gl';

export interface LayerOptions {
  layerIdx?: string;
  sourceId: string;
  sourceData: AnySourceData;
  layerConfig: AnyLayer[];
}

defineEmits(['onMapLayerClick']);
const props = defineProps<LayerOptions>();
const { layerIdx, sourceId, sourceData, layerConfig } = toRefs(props);

const map = inject<ShallowRef<Map>>('map');
const attrs = useAttrs();

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
  if (!!attrs['onMapLayerClick'])
    map.on('click', layerIds, attrs['onMapLayerClick'] as any);
}

onMounted(async () => {
  await nextTick();
  addLayer(map?.value);
});
</script>
