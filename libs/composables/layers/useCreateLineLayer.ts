import { computed } from 'vue';
import { useCreateLayer, useLogger } from '@libs/composables';
import { filterStylePropertiesByKeys } from '@libs/helpers';
import type {
  CreateLayerActions,
  Nullable,
  LineLayout,
  LinePaint,
  LineLayerStyle,
} from '@libs/types';
import type { MaybeRef } from 'vue';
import type {
  Map,
  SourceSpecification,
  FilterSpecification,
  LineLayerSpecification,
  StyleSetterOptions,
} from 'maplibre-gl';

type Layer = LineLayerSpecification;
type Layout = LineLayout;
type Paint = LinePaint;

/**
 * Paint properties for line layers
 * Comprehensive list of all supported line paint properties
 */
const LINE_PAINT_KEYS: (keyof Paint)[] = [
  'line-opacity',
  'line-color',
  'line-translate',
  'line-translate-anchor',
  'line-width',
  'line-gap-width',
  'line-offset',
  'line-blur',
  'line-dasharray',
  'line-pattern',
  'line-gradient',
];

/**
 * Layout properties for line layers
 * Comprehensive list of all supported line layout properties
 */
const LINE_LAYOUT_KEYS: (keyof Layout)[] = [
  'line-cap',
  'line-join',
  'line-miter-limit',
  'line-round-limit',
  'line-sort-key',
  'visibility',
];

interface CreateLineLayerProps {
  map: MaybeRef<Nullable<Map>>;
  source: MaybeRef<string | SourceSpecification | object | null>;
  id?: string;
  beforeId?: string;
  filter?: FilterSpecification;
  style?: LineLayerStyle;
  maxzoom?: number;
  minzoom?: number;
  metadata?: object;
  sourceLayer?: string;
  debug?: boolean;
  register?: (actions: CreateLayerActions<Layer>, map: Map) => void;
}

interface LineLayerActions extends CreateLayerActions<Layer> {
  setStyle: (styleVal?: LineLayerStyle) => void;
  setOpacity: (opacity: number, options?: StyleSetterOptions) => void;
  setColor: (color: string, options?: StyleSetterOptions) => void;
  setWidth: (width: number | string, options?: StyleSetterOptions) => void;
  setGapWidth: (gapWidth: number, options?: StyleSetterOptions) => void;
  setOffset: (offset: number, options?: StyleSetterOptions) => void;
  setBlur: (blur: number, options?: StyleSetterOptions) => void;
  setDashArray: (dashArray: number[], options?: StyleSetterOptions) => void;
  setPattern: (pattern: string, options?: StyleSetterOptions) => void;
  setGradient: (gradient: string, options?: StyleSetterOptions) => void;
  setCap: (
    cap: 'butt' | 'round' | 'square',
    options?: StyleSetterOptions,
  ) => void;
  setJoin: (
    join: 'bevel' | 'round' | 'miter',
    options?: StyleSetterOptions,
  ) => void;
  setVisibility: (
    visibility: 'visible' | 'none',
    options?: StyleSetterOptions,
  ) => void;
  setSortKey: (sortKey: number, options?: StyleSetterOptions) => void;
}

/**
 * Composable for creating and managing MapLibre GL Line Layers
 * Provides reactive line layer with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for the line layer
 * @returns Enhanced actions and state for the line layer
 */
export function useCreateLineLayer(
  props: CreateLineLayerProps,
): LineLayerActions {
  const { logError, logWarn } = useLogger(props.debug ?? false);

  // Memoized style processing for better performance
  const styleConfig = computed(() => {
    const style = props.style || {};
    return {
      paint: filterStylePropertiesByKeys(style, LINE_PAINT_KEYS),
      layout: filterStylePropertiesByKeys(style, LINE_LAYOUT_KEYS),
    };
  });

  const { setLayoutProperty, setPaintProperty, ...actions } =
    useCreateLayer<Layer>({
      map: props.map,
      source: props.source,
      type: 'line',
      id: props.id,
      beforeId: props.beforeId,
      filter: props.filter,
      layout: styleConfig.value.layout as any,
      paint: styleConfig.value.paint as any,
      maxzoom: props.maxzoom,
      minzoom: props.minzoom,
      metadata: props.metadata,
      sourceLayer: props.sourceLayer,
      debug: props.debug,
      register: (actions, map) => {
        props.register?.(
          {
            ...actions,
            setStyle,
            setOpacity,
            setColor,
            setWidth,
            setGapWidth,
            setOffset,
            setBlur,
            setDashArray,
            setPattern,
            setGradient,
            setCap,
            setJoin,
            setVisibility,
            setSortKey,
          } as LineLayerActions,
          map,
        );
      },
    });

  /**
   * Updates multiple style properties at once with error handling
   * @param styleVal - Style object containing paint and layout properties
   */
  function setStyle(styleVal: LineLayerStyle = {}): void {
    if (!styleVal || typeof styleVal !== 'object') return;

    try {
      const styleKeys = Object.keys(styleVal);

      styleKeys.forEach((key) => {
        const typedKey = key as keyof LineLayerStyle;
        const value = styleVal[typedKey];

        if (value === undefined) return;

        if (LINE_PAINT_KEYS.includes(typedKey as keyof Paint)) {
          setPaintProperty(key, value, { validate: false });
        } else if (LINE_LAYOUT_KEYS.includes(typedKey as keyof Layout)) {
          setLayoutProperty(key, value, { validate: false });
        }
      });
    } catch (error) {
      logError('Error updating line layer style:', error);
    }
  }

  /**
   * Sets the line opacity with error handling and validation
   * @param opacity - Line opacity value (0-1)
   * @param options - Style setter options
   */
  function setOpacity(
    opacity: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      if (opacity < 0 || opacity > 1) {
        logWarn('Warning: Line opacity should be between 0 and 1', { opacity });
      }
      setPaintProperty('line-opacity', opacity, options);
    } catch (error) {
      logError('Error setting line opacity:', error);
    }
  }

  /**
   * Sets the line color with error handling
   * @param color - Line color value
   * @param options - Style setter options
   */
  function setColor(
    color: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('line-color', color, options);
    } catch (error) {
      logError('Error setting line color:', error);
    }
  }

  /**
   * Sets the line width with error handling
   * @param width - Line width value
   * @param options - Style setter options
   */
  function setWidth(
    width: number | string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('line-width', width, options);
    } catch (error) {
      logError('Error setting line width:', error);
    }
  }

  /**
   * Sets the line gap width with error handling
   * @param gapWidth - Gap width value for creating line outlines
   * @param options - Style setter options
   */
  function setGapWidth(
    gapWidth: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('line-gap-width', gapWidth, options);
    } catch (error) {
      logError('Error setting line gap width:', error);
    }
  }

  /**
   * Sets the line offset with error handling
   * @param offset - Line offset value
   * @param options - Style setter options
   */
  function setOffset(
    offset: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('line-offset', offset, options);
    } catch (error) {
      logError('Error setting line offset:', error);
    }
  }

  /**
   * Sets the line blur with error handling
   * @param blur - Line blur value
   * @param options - Style setter options
   */
  function setBlur(
    blur: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('line-blur', blur, options);
    } catch (error) {
      logError('Error setting line blur:', error);
    }
  }

  /**
   * Sets the line dash array with error handling
   * @param dashArray - Array of dash lengths for creating dashed lines
   * @param options - Style setter options
   */
  function setDashArray(
    dashArray: number[],
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      if (!Array.isArray(dashArray)) {
        logWarn('Warning: Dash array should be an array of numbers', {
          dashArray,
        });
      }
      setPaintProperty('line-dasharray', dashArray, options);
    } catch (error) {
      logError('Error setting line dash array:', error);
    }
  }

  /**
   * Sets the line pattern with error handling
   * @param pattern - Pattern image name
   * @param options - Style setter options
   */
  function setPattern(
    pattern: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('line-pattern', pattern, options);
    } catch (error) {
      logError('Error setting line pattern:', error);
    }
  }

  /**
   * Sets the line gradient with error handling
   * @param gradient - Gradient expression for line coloring
   * @param options - Style setter options
   */
  function setGradient(
    gradient: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('line-gradient', gradient, options);
    } catch (error) {
      logError('Error setting line gradient:', error);
    }
  }

  /**
   * Sets the line cap style with error handling
   * @param cap - Line cap style ('butt' | 'round' | 'square')
   * @param options - Style setter options
   */
  function setCap(
    cap: 'butt' | 'round' | 'square',
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('line-cap', cap, options);
    } catch (error) {
      logError('Error setting line cap:', error);
    }
  }

  /**
   * Sets the line join style with error handling
   * @param join - Line join style ('bevel' | 'round' | 'miter')
   * @param options - Style setter options
   */
  function setJoin(
    join: 'bevel' | 'round' | 'miter',
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('line-join', join, options);
    } catch (error) {
      logError('Error setting line join:', error);
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
      logError('Error setting line layer visibility:', error);
    }
  }

  /**
   * Sets the line sort key with error handling
   * @param sortKey - Sort key value for layer ordering
   * @param options - Style setter options
   */
  function setSortKey(
    sortKey: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('line-sort-key', sortKey, options);
    } catch (error) {
      logError('Error setting line sort key:', error);
    }
  }

  return {
    ...actions,
    setStyle,
    setLayoutProperty,
    setPaintProperty,
    setOpacity,
    setColor,
    setWidth,
    setGapWidth,
    setOffset,
    setBlur,
    setDashArray,
    setPattern,
    setGradient,
    setCap,
    setJoin,
    setVisibility,
    setSortKey,
  };
}
