import { describe, expect, it } from 'vitest';
import {
  extractTemplateAttributes,
  toCamelCase,
} from '../extract-template-attributes';

const COMPONENTS = new Set(['Maplibre', 'Marker', 'GeoJsonSource']);

function attributes(code: string) {
  return extractTemplateAttributes(code, COMPONENTS).map((attribute) => [
    attribute.component,
    attribute.prop,
    attribute.line,
  ]);
}

describe('extractTemplateAttributes', () => {
  it('maps a kebab-case binding to the prop name Vue puts on $props', () => {
    expect(
      attributes(`<template>
  <GeoJsonSource :source-id="id" />
</template>`),
    ).toEqual([['GeoJsonSource', 'sourceId', 1]]);
  });

  it('maps a handler to its emit name', () => {
    expect(
      attributes(`<template>
  <Maplibre @map-load="onLoad" />
</template>`),
    ).toEqual([['Maplibre', 'onMapLoad', 1]]);
  });

  it('leaves native DOM events alone, since fallthrough makes them real', () => {
    expect(
      attributes(`<template>
  <Marker @click="onClick" @dblclick="onOpen" />
</template>`),
    ).toEqual([]);
  });

  it('reads past a `>` inside an attribute value', () => {
    expect(
      attributes(`<template>
  <Maplibre :register="(a) => a.isMapReady" :debug="true" />
</template>`),
    ).toEqual([
      ['Maplibre', 'register', 1],
      ['Maplibre', 'debug', 1],
    ]);
  });

  it('never reads a name out of an attribute value', () => {
    // `style="width: 100%"` would otherwise report a `width` prop, and
    // `:draggable="true"` a `true` one.
    expect(
      attributes(`<template>
  <Marker style="width: 100%" :draggable="true" />
</template>`),
    ).toEqual([['Marker', 'draggable', 1]]);
  });

  it('ignores the script block, where `<Marker` is a type argument', () => {
    expect(
      attributes(`<template>
  <Maplibre :options="o" />
</template>

<script setup lang="ts">
const marker = ref<Marker | null>(null);
</script>`),
    ).toEqual([['Maplibre', 'options', 1]]);
  });

  it('ignores attributes that are legal on any component', () => {
    expect(
      attributes(`<template>
  <Marker class="a" style="b" ref="c" v-if="d" data-x="e" />
</template>`),
    ).toEqual([]);
  });

  it('counts the line of each attribute, not of its tag', () => {
    expect(
      attributes(`<template>
  <Maplibre
    :options="o"
    :debug="true"
  />
</template>`),
    ).toEqual([
      ['Maplibre', 'options', 2],
      ['Maplibre', 'debug', 3],
    ]);
  });
});

describe('toCamelCase', () => {
  it('turns a kebab-case attribute into its prop name', () => {
    expect(toCamelCase('cluster-max-zoom')).toBe('clusterMaxZoom');
    expect(toCamelCase('lnglat')).toBe('lnglat');
  });
});
