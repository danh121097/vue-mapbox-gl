import { useCreateLayer } from '@libs/composables';
import { filterStylePropertiesByKeys } from '@libs/helpers';
import type {
  CreateLayerActions,
  Nullable,
  FillLayout,
  FillPaint,
  FillLayerStyle,
} from '@libs/types';
import type { MaybeRef } from 'vue';
import type {
  Map,
  SourceSpecification,
  FilterSpecification,
  FillLayerSpecification,
} from 'maplibre-gl';

type Layer = FillLayerSpecification;
type Layout = FillLayout;
type Paint = FillPaint;

const paintKeys: (keyof Paint)[] = [
  'fill-antialias',
  'fill-opacity',
  'fill-color',
  'fill-outline-color',
  'fill-translate',
  'fill-translate-anchor',
  'fill-pattern',
];

const layoutKeys: (keyof Layout)[] = ['fill-sort-key', 'visibility'];

interface CreateFillLayerProps {
  map: MaybeRef<Nullable<Map>>;
  source: MaybeRef<string | SourceSpecification | object | null>;
  renderingMode?: string;
  id?: string;
  beforeId?: string;
  filter?: FilterSpecification;
  style?: FillLayerStyle;
  maxzoom?: number;
  minzoom?: number;
  metadata?: object;
  sourceLayer?: string;
  register?: (actions: CreateLayerActions<Layer>, map: Map) => void;
}

export function useCreateFillLayer(props: CreateFillLayerProps) {
  const style = props.style || {};
  const paint: Paint = filterStylePropertiesByKeys(style, paintKeys);
  const layout: Layout = filterStylePropertiesByKeys(style, layoutKeys);

  const { setLayoutProperty, setPaintProperty, ...actions } =
    useCreateLayer<Layer>({
      map: props.map,
      source: props.source,
      type: 'fill',
      id: props.id,
      beforeId: props.beforeId,
      filter: props.filter,
      layout: layout,
      paint: paint,
      maxzoom: props.maxzoom,
      minzoom: props.minzoom,
      metadata: props.metadata,
      sourceLayer: props.sourceLayer,
      register: (actions, map) => {
        props.register?.(actions, map);
      },
    });

  function setStyle(styleVal: FillLayerStyle = {}) {
    Object.keys(styleVal).forEach((key) => {
      if (paintKeys.includes(key as keyof Paint))
        setPaintProperty(key, styleVal[key as keyof Paint], {
          validate: false,
        });

      if (layoutKeys.includes(key as keyof Layout))
        setLayoutProperty(key, styleVal[key as keyof Layout], {
          validate: false,
        });
    });
  }

  return {
    ...actions,
    setStyle,
    setLayoutProperty,
    setPaintProperty,
  };
}
