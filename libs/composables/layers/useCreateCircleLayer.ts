import { computed } from 'vue';
import { useCreateLayer, useLogger } from '@libs/composables';
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
  StyleSetterOptions,
} from 'maplibre-gl';

type Layer = CircleLayerSpecification;
type Layout = CircleLayout;
type Paint = CirclePaint;

/**
 * Paint properties for circle layers
 * Comprehensive list of all supported circle paint properties
 */
const CIRCLE_PAINT_KEYS: (keyof Paint)[] = [
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

/**
 * Layout properties for circle layers
 * Comprehensive list of all supported circle layout properties
 */
const CIRCLE_LAYOUT_KEYS: (keyof Layout)[] = ['circle-sort-key', 'visibility'];

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
  debug?: boolean;
  register?: (actions: CreateLayerActions<Layer>, map: Map) => void;
}

interface CircleLayerActions extends CreateLayerActions<Layer> {
  setStyle: (styleVal?: CircleLayerStyle) => void;
  setRadius: (radius: number | string, options?: StyleSetterOptions) => void;
  setColor: (color: string, options?: StyleSetterOptions) => void;
  setOpacity: (opacity: number, options?: StyleSetterOptions) => void;
  setStrokeWidth: (width: number, options?: StyleSetterOptions) => void;
  setStrokeColor: (color: string, options?: StyleSetterOptions) => void;
  setStrokeOpacity: (opacity: number, options?: StyleSetterOptions) => void;
  setVisibility: (
    visibility: 'visible' | 'none',
    options?: StyleSetterOptions,
  ) => void;
}

/**
 * Composable for creating and managing MapLibre GL Circle Layers
 * Provides reactive circle layer with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for the circle layer
 * @returns Enhanced actions and state for the circle layer
 */
export function useCreateCircleLayer(
  props: CreateCircleLayerProps,
): CircleLayerActions {
  const { logError, logWarn } = useLogger(props.debug ?? false);

  // Memoized style processing for better performance
  const styleConfig = computed(() => {
    const style = props.style || {};
    return {
      paint: filterStylePropertiesByKeys(style, CIRCLE_PAINT_KEYS),
      layout: filterStylePropertiesByKeys(style, CIRCLE_LAYOUT_KEYS),
    };
  });

  const { setLayoutProperty, setPaintProperty, ...actions } =
    useCreateLayer<Layer>({
      map: props.map,
      source: props.source,
      type: 'circle',
      id: props.id,
      beforeId: props.beforeId,
      filter: props.filter,
      layout: styleConfig.value.layout as any,
      paint: styleConfig.value.paint as any,
      maxzoom: props.maxzoom,
      minzoom: props.minzoom,
      metadata: props.metadata,
      sourceLayer: props.sourceLayer,
      register: (actions, map) => {
        props.register?.(
          {
            ...actions,
            setStyle,
            setRadius,
            setColor,
            setOpacity,
            setStrokeWidth,
            setStrokeColor,
            setStrokeOpacity,
            setVisibility,
          } as CircleLayerActions,
          map,
        );
      },
    });

  /**
   * Updates multiple style properties at once with error handling
   * @param styleVal - Style object containing paint and layout properties
   */
  function setStyle(styleVal: CircleLayerStyle = {}): void {
    if (!styleVal || typeof styleVal !== 'object') return;

    try {
      const styleKeys = Object.keys(styleVal);

      styleKeys.forEach((key) => {
        const typedKey = key as keyof CircleLayerStyle;
        const value = styleVal[typedKey];

        if (value === undefined) return;

        if (CIRCLE_PAINT_KEYS.includes(typedKey as keyof Paint)) {
          setPaintProperty(key, value, { validate: false });
        } else if (CIRCLE_LAYOUT_KEYS.includes(typedKey as keyof Layout)) {
          setLayoutProperty(key, value, { validate: false });
        }
      });
    } catch (error) {
      logError('Error updating circle layer style:', error);
    }
  }

  /**
   * Sets the circle radius with error handling
   * @param radius - Circle radius value
   * @param options - Style setter options
   */
  function setRadius(
    radius: number | string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('circle-radius', radius, options);
    } catch (error) {
      logError('Error setting circle radius:', error);
    }
  }

  /**
   * Sets the circle color with error handling
   * @param color - Circle color value
   * @param options - Style setter options
   */
  function setColor(
    color: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('circle-color', color, options);
    } catch (error) {
      logError('Error setting circle color:', error);
    }
  }

  /**
   * Sets the circle opacity with error handling
   * @param opacity - Circle opacity value (0-1)
   * @param options - Style setter options
   */
  function setOpacity(
    opacity: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      if (opacity < 0 || opacity > 1) {
        logWarn('Warning: Circle opacity should be between 0 and 1', {
          opacity,
        });
      }
      setPaintProperty('circle-opacity', opacity, options);
    } catch (error) {
      logError('Error setting circle opacity:', error);
    }
  }

  /**
   * Sets the circle stroke width with error handling
   * @param width - Stroke width value
   * @param options - Style setter options
   */
  function setStrokeWidth(
    width: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('circle-stroke-width', width, options);
    } catch (error) {
      logError('Error setting circle stroke width:', error);
    }
  }

  /**
   * Sets the circle stroke color with error handling
   * @param color - Stroke color value
   * @param options - Style setter options
   */
  function setStrokeColor(
    color: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('circle-stroke-color', color, options);
    } catch (error) {
      logError('Error setting circle stroke color:', error);
    }
  }

  /**
   * Sets the circle stroke opacity with error handling
   * @param opacity - Stroke opacity value (0-1)
   * @param options - Style setter options
   */
  function setStrokeOpacity(
    opacity: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      if (opacity < 0 || opacity > 1) {
        logWarn('Warning: Circle stroke opacity should be between 0 and 1', {
          opacity,
        });
      }
      setPaintProperty('circle-stroke-opacity', opacity, options);
    } catch (error) {
      logError('Error setting circle stroke opacity:', error);
    }
  }

  /**
   * Sets the layer visibility with error handling
   * @param visibility - Visibility value ('visible' | 'none')
   * @param options - Style setter options
   */
  function setVisibility(
    visibility: 'visible' | 'none',
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('visibility', visibility, options);
    } catch (error) {
      logError('Error setting circle layer visibility:', error);
    }
  }

  return {
    ...actions,
    setStyle,
    setLayoutProperty,
    setPaintProperty,
    setRadius,
    setColor,
    setOpacity,
    setStrokeWidth,
    setStrokeColor,
    setStrokeOpacity,
    setVisibility,
  };
}
