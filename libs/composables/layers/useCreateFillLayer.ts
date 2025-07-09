import { computed } from 'vue';
import { useCreateLayer, useLogger } from '@libs/composables';
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
  StyleSetterOptions,
} from 'maplibre-gl';

type Layer = FillLayerSpecification;
type Layout = FillLayout;
type Paint = FillPaint;

/**
 * Paint properties for fill layers
 * Comprehensive list of all supported fill paint properties
 */
const FILL_PAINT_KEYS: (keyof Paint)[] = [
  'fill-antialias',
  'fill-opacity',
  'fill-color',
  'fill-outline-color',
  'fill-translate',
  'fill-translate-anchor',
  'fill-pattern',
];

/**
 * Layout properties for fill layers
 * Comprehensive list of all supported fill layout properties
 */
const FILL_LAYOUT_KEYS: (keyof Layout)[] = ['fill-sort-key', 'visibility'];

interface CreateFillLayerProps {
  map: MaybeRef<Nullable<Map>>;
  source: MaybeRef<string | SourceSpecification | object | null>;
  id?: string;
  beforeId?: string;
  filter?: FilterSpecification;
  style?: FillLayerStyle;
  maxzoom?: number;
  minzoom?: number;
  metadata?: object;
  sourceLayer?: string;
  debug?: boolean;
  register?: (actions: CreateLayerActions<Layer>, map: Map) => void;
}

interface FillLayerActions extends CreateLayerActions<Layer> {
  setStyle: (styleVal?: FillLayerStyle) => void;
  setOpacity: (opacity: number, options?: StyleSetterOptions) => void;
  setColor: (color: string, options?: StyleSetterOptions) => void;
  setOutlineColor: (color: string, options?: StyleSetterOptions) => void;
  setPattern: (pattern: string, options?: StyleSetterOptions) => void;
  setAntialias: (antialias: boolean, options?: StyleSetterOptions) => void;
  setVisibility: (
    visibility: 'visible' | 'none',
    options?: StyleSetterOptions,
  ) => void;
  setSortKey: (sortKey: number, options?: StyleSetterOptions) => void;
}

/**
 * Composable for creating and managing MapLibre GL Fill Layers
 * Provides reactive fill layer with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for the fill layer
 * @returns Enhanced actions and state for the fill layer
 */
export function useCreateFillLayer(
  props: CreateFillLayerProps,
): FillLayerActions {
  const { logWarn, logError } = useLogger(props.debug ?? false);

  // Memoized style processing for better performance
  const styleConfig = computed(() => {
    const style = props.style || {};
    return {
      paint: filterStylePropertiesByKeys(style, FILL_PAINT_KEYS),
      layout: filterStylePropertiesByKeys(style, FILL_LAYOUT_KEYS),
    };
  });

  const { setLayoutProperty, setPaintProperty, ...actions } =
    useCreateLayer<Layer>({
      map: props.map,
      source: props.source,
      type: 'fill',
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
            setOutlineColor,
            setPattern,
            setAntialias,
            setVisibility,
            setSortKey,
          } as FillLayerActions,
          map,
        );
      },
    });

  /**
   * Updates multiple style properties at once with error handling
   * @param styleVal - Style object containing paint and layout properties
   */
  function setStyle(styleVal: FillLayerStyle = {}): void {
    try {
      const styleKeys = Object.keys(styleVal);

      styleKeys.forEach((key) => {
        const typedKey = key as keyof FillLayerStyle;
        const value = styleVal[typedKey];

        if (value === undefined) return;

        if (FILL_PAINT_KEYS.includes(typedKey as keyof Paint)) {
          setPaintProperty(key, value, { validate: false });
        } else if (FILL_LAYOUT_KEYS.includes(typedKey as keyof Layout)) {
          setLayoutProperty(key, value, { validate: false });
        }
      });
    } catch (error) {
      logError('Error updating fill layer style:', error);
    }
  }

  /**
   * Sets the fill opacity with error handling and validation
   * @param opacity - Fill opacity value (0-1)
   * @param options - Style setter options
   */
  function setOpacity(
    opacity: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      if (opacity < 0 || opacity > 1) {
        logWarn('Warning: Fill opacity should be between 0 and 1', { opacity });
      }
      setPaintProperty('fill-opacity', opacity, options);
    } catch (error) {
      logError('Error setting fill opacity:', error);
    }
  }

  /**
   * Sets the fill color with error handling
   * @param color - Fill color value
   * @param options - Style setter options
   */
  function setColor(
    color: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('fill-color', color, options);
    } catch (error) {
      logError('Error setting fill color:', error);
    }
  }

  /**
   * Sets the fill outline color with error handling
   * @param color - Outline color value
   * @param options - Style setter options
   */
  function setOutlineColor(
    color: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('fill-outline-color', color, options);
    } catch (error) {
      logError('Error setting fill outline color:', error);
    }
  }

  /**
   * Sets the fill pattern with error handling
   * @param pattern - Pattern image name
   * @param options - Style setter options
   */
  function setPattern(
    pattern: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('fill-pattern', pattern, options);
    } catch (error) {
      logError('Error setting fill pattern:', error);
    }
  }

  /**
   * Sets the fill antialias with error handling
   * @param antialias - Antialias boolean value
   * @param options - Style setter options
   */
  function setAntialias(
    antialias: boolean,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('fill-antialias', antialias, options);
    } catch (error) {
      logError('Error setting fill antialias:', error);
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
      logError('Error setting fill layer visibility:', error);
    }
  }

  /**
   * Sets the fill sort key with error handling
   * @param sortKey - Sort key value for layer ordering
   * @param options - Style setter options
   */
  function setSortKey(
    sortKey: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('fill-sort-key', sortKey, options);
    } catch (error) {
      logError('Error setting fill sort key:', error);
    }
  }

  return {
    ...actions,
    setStyle,
    setLayoutProperty,
    setPaintProperty,
    setOpacity,
    setColor,
    setOutlineColor,
    setPattern,
    setAntialias,
    setVisibility,
    setSortKey,
  };
}
