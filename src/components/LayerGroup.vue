<script lang="ts" setup>
import { Layer } from '@components';

import type { SourceSpecification, LayerSpecification } from 'maplibre-gl';

interface Props {
  layers: {
    sourceId: string;
    layerId: string;
    source: SourceSpecification;
    layer: LayerSpecification;
    before?: string;
  }[];
}

defineProps<Props>();
</script>

<template>
  <Layer
    v-for="{ sourceId, layerId, source, layer, before } in layers"
    :key="layerId"
    :source-id="sourceId"
    :layer-id="layerId"
    :source="source"
    :layer="layer"
    :before="before"
  />
</template>
