<script lang="ts" setup>
import { Layer } from '@components';
import { LayerConfig } from '@types';

import type { SourceSpecification } from 'maplibre-gl';

interface Props {
  layers: Omit<LayerConfig, 'source'>[];
  source: SourceSpecification;
}

defineProps<Props>();
</script>

<template>
  <Layer
    v-for="layer in layers"
    :key="layer.id"
    v-bind="{ ...layer, source }"
  />
</template>
