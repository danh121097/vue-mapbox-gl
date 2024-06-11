import { useCreateLayer } from '@libs/composables';
import { filterStylePropertiesByKeys } from '@libs/helpers';
import type {
  CreateLayerActions,
  Nullable,
  CircleLayout,
  CirclePaint,
  CircleLayerStyle,
} from '@libs/types';
import type { MaybeRef } from 'vue';
import type {
  Map,
  SourceSpecification,
  FilterSpecification,
  CircleLayerSpecification,
} from 'maplibre-gl';

type Layer = CircleLayerSpecification;
type Layout = CircleLayout;
type Paint = CirclePaint;

const paintKeys: (keyof Paint)[] = [
  'circle-radius',
  'circle-color',
  'circle-blur',
  'circle-opacity',
  'circle-translate',
  'circle-translate-anchor',
  'circle-pitch-scale',
  'circle-pitch-alignment',
  'circle-stroke-width',
  'circle-stroke-color',
  'circle-stroke-opacity',
];
const layoutKeys: (keyof Layout)[] = ['circle-sort-key', 'visibility'];

interface CreateCircleLayerProps {
  map: MaybeRef<Nullable<Map>>;
  source: MaybeRef<string | SourceSpecification | object | null>;
  id?: string;
  beforeId?: string;
  filter?: FilterSpecification;
  style?: CircleLayerStyle;
  maxzoom?: number;
  minzoom?: number;
  metadata?: object;
  sourceLayer?: string;
  register?: (actions: CreateLayerActions<Layer>, map: Map) => void;
}

export function useCreateCircleLayer(props: CreateCircleLayerProps) {
  const style = props.style || {};
  const paint: Paint = filterStylePropertiesByKeys(style, paintKeys);
  const layout: Layout = filterStylePropertiesByKeys(style, layoutKeys);

  const { setLayoutProperty, setPaintProperty, ...actions } =
    useCreateLayer<Layer>({
      map: props.map,
      source: props.source,
      type: 'circle',
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
        props.register?.(
          {
            ...actions,
            setStyle,
          },
          map,
        );
      },
    });

  function setStyle(styleVal: CircleLayerStyle = {}) {
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
