<script lang="ts" setup>
import { Layer } from '@components';
import type { Vue3MapBox } from '@types';
import type { SourceSpecification } from 'maplibre-gl';

interface LayerOptions {
  sourceId: string;
  id: string;
  source: SourceSpecification;
  paint?: Vue3MapBox.PaintSpecification;
  layout?: Vue3MapBox.LayoutSpecification;
  type: Vue3MapBox.LayerType;
  before?: string;
}

interface Props {
  layers: Omit<LayerOptions, 'source' | 'sourceId'>[];
  source: SourceSpecification;
  sourceId: string;
}

defineProps<Props>();
</script>

<template>
  <Layer
    v-for="layer in layers"
    :key="layer.id"
    v-bind="{ ...layer, source, sourceId }"
  />
</template>
