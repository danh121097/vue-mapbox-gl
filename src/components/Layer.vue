<script lang="ts" setup>
import {
  onMounted,
  onBeforeUnmount,
  nextTick,
  inject,
  toRefs,
  watch,
} from "vue";
import { GeoJSONSource, Map } from "maplibre-gl";
import { mapLayerEvents } from "@constants";
import { MAP_KEY } from "@enums";
import type {
  ColorSpecification,
  DataDrivenPropertyValueSpecification,
  ExpressionSpecification,
  FilterSpecification,
  FormattedSpecification,
  PaddingSpecification,
  PropertyValueSpecification,
  ResolvedImageSpecification,
  SourceSpecification,
} from "maplibre-gl";
// import type {  LayerSpecification } from "@types";
import type { ShallowRef } from "vue";

interface LayerSpecification {
  sourceData: SourceSpecification;
  before?: string;
  id: string;
  type: "fill" | "line" | "circle" | "symbol";
  metadata?: unknown;
  source: string;
  "source-layer"?: string;
  minzoom?: number;
  maxzoom?: number;
  filter?: FilterSpecification;
  layout?: {
    "fill-sort-key"?: DataDrivenPropertyValueSpecification<number>;

    "line-cap"?: PropertyValueSpecification<"butt" | "round" | "square">;
    "line-join"?: DataDrivenPropertyValueSpecification<
      "bevel" | "round" | "miter"
    >;
    "line-miter-limit"?: PropertyValueSpecification<number>;
    "line-round-limit"?: PropertyValueSpecification<number>;
    "line-sort-key"?: DataDrivenPropertyValueSpecification<number>;

    "symbol-placement"?: PropertyValueSpecification<
      "point" | "line" | "line-center"
    >;
    "symbol-spacing"?: PropertyValueSpecification<number>;
    "symbol-avoid-edges"?: PropertyValueSpecification<boolean>;
    "symbol-sort-key"?: DataDrivenPropertyValueSpecification<number>;
    "symbol-z-order"?: PropertyValueSpecification<
      "auto" | "viewport-y" | "source"
    >;
    "icon-allow-overlap"?: PropertyValueSpecification<boolean>;
    "icon-overlap"?: PropertyValueSpecification<
      "never" | "always" | "cooperative"
    >;
    "icon-ignore-placement"?: PropertyValueSpecification<boolean>;
    "icon-optional"?: PropertyValueSpecification<boolean>;
    "icon-rotation-alignment"?: PropertyValueSpecification<
      "map" | "viewport" | "auto"
    >;
    "icon-size"?: DataDrivenPropertyValueSpecification<number>;
    "icon-text-fit"?: PropertyValueSpecification<
      "none" | "width" | "height" | "both"
    >;
    "icon-text-fit-padding"?: PropertyValueSpecification<
      [number, number, number, number]
    >;
    "icon-image"?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    "icon-rotate"?: DataDrivenPropertyValueSpecification<number>;
    "icon-padding"?: DataDrivenPropertyValueSpecification<PaddingSpecification>;
    "icon-keep-upright"?: PropertyValueSpecification<boolean>;
    "icon-offset"?: DataDrivenPropertyValueSpecification<[number, number]>;
    "icon-anchor"?: DataDrivenPropertyValueSpecification<
      | "center"
      | "left"
      | "right"
      | "top"
      | "bottom"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
    >;
    "icon-pitch-alignment"?: PropertyValueSpecification<
      "map" | "viewport" | "auto"
    >;
    "text-pitch-alignment"?: PropertyValueSpecification<
      "map" | "viewport" | "auto"
    >;
    "text-rotation-alignment"?: PropertyValueSpecification<
      "map" | "viewport" | "viewport-glyph" | "auto"
    >;
    "text-field"?: DataDrivenPropertyValueSpecification<FormattedSpecification>;
    "text-font"?: DataDrivenPropertyValueSpecification<Array<string>>;
    "text-size"?: DataDrivenPropertyValueSpecification<number>;
    "text-max-width"?: DataDrivenPropertyValueSpecification<number>;
    "text-line-height"?: PropertyValueSpecification<number>;
    "text-letter-spacing"?: DataDrivenPropertyValueSpecification<number>;
    "text-justify"?: DataDrivenPropertyValueSpecification<
      "auto" | "left" | "center" | "right"
    >;
    "text-radial-offset"?: DataDrivenPropertyValueSpecification<number>;
    "text-variable-anchor"?: PropertyValueSpecification<
      Array<
        | "center"
        | "left"
        | "right"
        | "top"
        | "bottom"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right"
      >
    >;
    "text-anchor"?: DataDrivenPropertyValueSpecification<
      | "center"
      | "left"
      | "right"
      | "top"
      | "bottom"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
    >;
    "text-max-angle"?: PropertyValueSpecification<number>;
    "text-writing-mode"?: PropertyValueSpecification<
      Array<"horizontal" | "vertical">
    >;
    "text-rotate"?: DataDrivenPropertyValueSpecification<number>;
    "text-padding"?: PropertyValueSpecification<number>;
    "text-keep-upright"?: PropertyValueSpecification<boolean>;
    "text-transform"?: DataDrivenPropertyValueSpecification<
      "none" | "uppercase" | "lowercase"
    >;
    "text-offset"?: DataDrivenPropertyValueSpecification<[number, number]>;
    "text-allow-overlap"?: PropertyValueSpecification<boolean>;
    "text-overlap"?: PropertyValueSpecification<
      "never" | "always" | "cooperative"
    >;
    "text-ignore-placement"?: PropertyValueSpecification<boolean>;
    "text-optional"?: PropertyValueSpecification<boolean>;

    "circle-sort-key"?: DataDrivenPropertyValueSpecification<number>;

    visibility?: "visible" | "none";
  };
  paint?: {
    "fill-antialias"?: PropertyValueSpecification<boolean>;
    "fill-opacity"?: DataDrivenPropertyValueSpecification<number>;
    "fill-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    "fill-outline-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    "fill-translate"?: PropertyValueSpecification<[number, number]>;
    "fill-translate-anchor"?: PropertyValueSpecification<"map" | "viewport">;
    "fill-pattern"?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;

    "line-opacity"?: DataDrivenPropertyValueSpecification<number>;
    "line-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    "line-translate"?: PropertyValueSpecification<[number, number]>;
    "line-translate-anchor"?: PropertyValueSpecification<"map" | "viewport">;
    "line-width"?: DataDrivenPropertyValueSpecification<number>;
    "line-gap-width"?: DataDrivenPropertyValueSpecification<number>;
    "line-offset"?: DataDrivenPropertyValueSpecification<number>;
    "line-blur"?: DataDrivenPropertyValueSpecification<number>;
    "line-dasharray"?: PropertyValueSpecification<Array<number>>;
    "line-pattern"?: DataDrivenPropertyValueSpecification<ResolvedImageSpecification>;
    "line-gradient"?: ExpressionSpecification;

    "icon-opacity"?: DataDrivenPropertyValueSpecification<number>;
    "icon-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    "icon-halo-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    "icon-halo-width"?: DataDrivenPropertyValueSpecification<number>;
    "icon-halo-blur"?: DataDrivenPropertyValueSpecification<number>;
    "icon-translate"?: PropertyValueSpecification<[number, number]>;
    "icon-translate-anchor"?: PropertyValueSpecification<"map" | "viewport">;
    "text-opacity"?: DataDrivenPropertyValueSpecification<number>;
    "text-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    "text-halo-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    "text-halo-width"?: DataDrivenPropertyValueSpecification<number>;
    "text-halo-blur"?: DataDrivenPropertyValueSpecification<number>;
    "text-translate"?: PropertyValueSpecification<[number, number]>;
    "text-translate-anchor"?: PropertyValueSpecification<"map" | "viewport">;

    "circle-radius"?: DataDrivenPropertyValueSpecification<number>;
    "circle-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    "circle-blur"?: DataDrivenPropertyValueSpecification<number>;
    "circle-opacity"?: DataDrivenPropertyValueSpecification<number>;
    "circle-translate"?: PropertyValueSpecification<[number, number]>;
    "circle-translate-anchor"?: PropertyValueSpecification<"map" | "viewport">;
    "circle-pitch-scale"?: PropertyValueSpecification<"map" | "viewport">;
    "circle-pitch-alignment"?: PropertyValueSpecification<"map" | "viewport">;
    "circle-stroke-width"?: DataDrivenPropertyValueSpecification<number>;
    "circle-stroke-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>;
    "circle-stroke-opacity"?: DataDrivenPropertyValueSpecification<number>;
  };
}


const emits = defineEmits(mapLayerEvents);
const props = defineProps<LayerSpecification>();
const { sourceData, before, id } = toRefs(props);

const map = inject<ShallowRef<Map>>(MAP_KEY);

watch(sourceData, (value) => {
  const source = map?.value?.getSource(props.source) as GeoJSONSource;
  if (source) source.setData((value as any).data);
});

function addLayer(map?: Map) {
  if (!map) return;

  return new Promise((resolve) => {
    map.addSource(props.source, sourceData.value);
    map.addLayer(
      props,
      before?.value
    );
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
  map?.value.removeLayer(props.id);
  map?.value.removeSource(props.source);
});
</script>
