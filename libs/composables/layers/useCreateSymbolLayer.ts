import { computed } from 'vue';
import { useCreateLayer, useLogger } from '@libs/composables';
import { filterStylePropertiesByKeys } from '@libs/helpers';
import type {
  CreateLayerActions,
  Nullable,
  SymbolLayout,
  SymbolPaint,
  SymbolLayerStyle,
} from '@libs/types';
import type { MaybeRef } from 'vue';
import type {
  Map,
  SourceSpecification,
  FilterSpecification,
  SymbolLayerSpecification,
  StyleSetterOptions,
} from 'maplibre-gl';

type Layer = SymbolLayerSpecification;
type Layout = SymbolLayout;
type Paint = SymbolPaint;

/**
 * Paint properties for symbol layers
 * Comprehensive list of all supported symbol paint properties
 */
const SYMBOL_PAINT_KEYS: (keyof Paint)[] = [
  'icon-opacity',
  'icon-color',
  'icon-halo-color',
  'icon-halo-width',
  'icon-halo-blur',
  'icon-translate',
  'icon-translate-anchor',
  'text-opacity',
  'text-color',
  'text-halo-color',
  'text-halo-width',
  'text-halo-blur',
  'text-translate',
  'text-translate-anchor',
];

/**
 * Layout properties for symbol layers
 * Comprehensive list of all supported symbol layout properties
 */
const SYMBOL_LAYOUT_KEYS: (keyof Layout)[] = [
  'symbol-placement',
  'symbol-spacing',
  'symbol-avoid-edges',
  'symbol-sort-key',
  'symbol-z-order',
  'icon-allow-overlap',
  'icon-overlap',
  'icon-ignore-placement',
  'icon-optional',
  'icon-rotation-alignment',
  'icon-size',
  'icon-text-fit',
  'icon-text-fit-padding',
  'icon-image',
  'icon-rotate',
  'icon-padding',
  'icon-keep-upright',
  'icon-offset',
  'icon-anchor',
  'icon-pitch-alignment',
  'text-pitch-alignment',
  'text-rotation-alignment',
  'text-field',
  'text-font',
  'text-size',
  'text-max-width',
  'text-line-height',
  'text-letter-spacing',
  'text-justify',
  'text-radial-offset',
  'text-variable-anchor',
  'text-variable-anchor-offset',
  'text-anchor',
  'text-max-angle',
  'text-writing-mode',
  'text-rotate',
  'text-padding',
  'text-keep-upright',
  'text-transform',
  'text-offset',
  'text-allow-overlap',
  'text-overlap',
  'text-ignore-placement',
  'text-optional',
  'visibility',
];

interface CreateSymbolLayerProps {
  map: MaybeRef<Nullable<Map>>;
  source: MaybeRef<string | SourceSpecification | object | null>;
  id?: string;
  beforeId?: string;
  filter?: FilterSpecification;
  style?: SymbolLayerStyle;
  maxzoom?: number;
  minzoom?: number;
  metadata?: object;
  sourceLayer?: string;
  debug?: boolean;
  register?: (actions: CreateLayerActions<Layer>, map: Map) => void;
}

interface SymbolLayerActions extends CreateLayerActions<Layer> {
  setStyle: (styleVal?: SymbolLayerStyle) => void;
  // Icon properties
  setIconOpacity: (opacity: number, options?: StyleSetterOptions) => void;
  setIconColor: (color: string, options?: StyleSetterOptions) => void;
  setIconHaloColor: (color: string, options?: StyleSetterOptions) => void;
  setIconHaloWidth: (width: number, options?: StyleSetterOptions) => void;
  setIconHaloBlur: (blur: number, options?: StyleSetterOptions) => void;
  setIconImage: (image: string, options?: StyleSetterOptions) => void;
  setIconSize: (size: number | string, options?: StyleSetterOptions) => void;
  setIconRotate: (rotation: number, options?: StyleSetterOptions) => void;
  setIconOffset: (
    offset: [number, number],
    options?: StyleSetterOptions,
  ) => void;
  setIconAnchor: (anchor: string, options?: StyleSetterOptions) => void;
  // Text properties
  setTextOpacity: (opacity: number, options?: StyleSetterOptions) => void;
  setTextColor: (color: string, options?: StyleSetterOptions) => void;
  setTextHaloColor: (color: string, options?: StyleSetterOptions) => void;
  setTextHaloWidth: (width: number, options?: StyleSetterOptions) => void;
  setTextHaloBlur: (blur: number, options?: StyleSetterOptions) => void;
  setTextField: (field: string, options?: StyleSetterOptions) => void;
  setTextFont: (font: string[], options?: StyleSetterOptions) => void;
  setTextSize: (size: number | string, options?: StyleSetterOptions) => void;
  setTextRotate: (rotation: number, options?: StyleSetterOptions) => void;
  setTextOffset: (
    offset: [number, number],
    options?: StyleSetterOptions,
  ) => void;
  setTextAnchor: (anchor: string, options?: StyleSetterOptions) => void;
  // Common properties
  setVisibility: (
    visibility: 'visible' | 'none',
    options?: StyleSetterOptions,
  ) => void;
  setSortKey: (sortKey: number, options?: StyleSetterOptions) => void;
}

/**
 * Composable for creating and managing MapLibre GL Symbol Layers
 * Provides reactive symbol layer with error handling, performance optimizations, and enhanced API
 *
 * @param props - Configuration options for the symbol layer
 * @returns Enhanced actions and state for the symbol layer
 */
export function useCreateSymbolLayer(
  props: CreateSymbolLayerProps,
): SymbolLayerActions {
  const { log, logWarn, logError } = useLogger(props.debug ?? false);

  // Memoized style processing for better performance
  const styleConfig = computed(() => {
    const style = props.style || {};
    return {
      paint: filterStylePropertiesByKeys(style, SYMBOL_PAINT_KEYS),
      layout: filterStylePropertiesByKeys(style, SYMBOL_LAYOUT_KEYS),
    };
  });

  const { setLayoutProperty, setPaintProperty, ...actions } =
    useCreateLayer<Layer>({
      map: props.map,
      source: props.source,
      type: 'symbol',
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
            setIconOpacity,
            setIconColor,
            setIconHaloColor,
            setIconHaloWidth,
            setIconHaloBlur,
            setIconImage,
            setIconSize,
            setIconRotate,
            setIconOffset,
            setIconAnchor,
            setTextOpacity,
            setTextColor,
            setTextHaloColor,
            setTextHaloWidth,
            setTextHaloBlur,
            setTextField,
            setTextFont,
            setTextSize,
            setTextRotate,
            setTextOffset,
            setTextAnchor,
            setVisibility,
            setSortKey,
          } as SymbolLayerActions,
          map,
        );
      },
    });

  /**
   * Updates multiple style properties at once with error handling
   * @param styleVal - Style object containing paint and layout properties
   */
  function setStyle(styleVal: SymbolLayerStyle = {}): void {
    if (!styleVal || typeof styleVal !== 'object') return;

    try {
      const styleKeys = Object.keys(styleVal);

      styleKeys.forEach((key) => {
        const typedKey = key as keyof SymbolLayerStyle;
        const value = styleVal[typedKey];

        if (value === undefined) return;

        if (SYMBOL_PAINT_KEYS.includes(typedKey as keyof Paint)) {
          setPaintProperty(key, value, { validate: false });
        } else if (SYMBOL_LAYOUT_KEYS.includes(typedKey as keyof Layout)) {
          setLayoutProperty(key, value, { validate: false });
        }
      });
    } catch (error) {
      logError('Error updating symbol layer style:', error);
    }
  }

  // Icon property setters
  /**
   * Sets the icon opacity with error handling and validation
   * @param opacity - Icon opacity value (0-1)
   * @param options - Style setter options
   */
  function setIconOpacity(
    opacity: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      if (opacity < 0 || opacity > 1) {
        logWarn('Warning: Icon opacity should be between 0 and 1', { opacity });
      }
      setPaintProperty('icon-opacity', opacity, options);
    } catch (error) {
      logError('Error setting icon opacity:', error);
    }
  }

  /**
   * Sets the icon color with error handling
   * @param color - Icon color value
   * @param options - Style setter options
   */
  function setIconColor(
    color: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('icon-color', color, options);
    } catch (error) {
      logError('Error setting icon color:', error);
    }
  }

  /**
   * Sets the icon halo color with error handling
   * @param color - Icon halo color value
   * @param options - Style setter options
   */
  function setIconHaloColor(
    color: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('icon-halo-color', color, options);
    } catch (error) {
      logError('Error setting icon halo color:', error);
    }
  }

  /**
   * Sets the icon halo width with error handling
   * @param width - Icon halo width value
   * @param options - Style setter options
   */
  function setIconHaloWidth(
    width: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('icon-halo-width', width, options);
    } catch (error) {
      logError('Error setting icon halo width:', error);
    }
  }

  /**
   * Sets the icon halo blur with error handling
   * @param blur - Icon halo blur value
   * @param options - Style setter options
   */
  function setIconHaloBlur(
    blur: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('icon-halo-blur', blur, options);
    } catch (error) {
      logError('Error setting icon halo blur:', error);
    }
  }

  /**
   * Sets the icon image with error handling
   * @param image - Icon image name
   * @param options - Style setter options
   */
  function setIconImage(
    image: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('icon-image', image, options);
    } catch (error) {
      logError('Error setting icon image:', error);
    }
  }

  /**
   * Sets the icon size with error handling
   * @param size - Icon size value
   * @param options - Style setter options
   */
  function setIconSize(
    size: number | string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('icon-size', size, options);
    } catch (error) {
      logError('Error setting icon size:', error);
    }
  }

  /**
   * Sets the icon rotation with error handling
   * @param rotation - Icon rotation value in degrees
   * @param options - Style setter options
   */
  function setIconRotate(
    rotation: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('icon-rotate', rotation, options);
    } catch (error) {
      logError('Error setting icon rotation:', error);
    }
  }

  /**
   * Sets the icon offset with error handling
   * @param offset - Icon offset as [x, y] coordinates
   * @param options - Style setter options
   */
  function setIconOffset(
    offset: [number, number],
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      if (!Array.isArray(offset) || offset.length !== 2) {
        logWarn(
          'Warning: Icon offset should be an array of two numbers [x, y]',
          {
            offset,
          },
        );
      }
      setLayoutProperty('icon-offset', offset, options);
      log('Icon offset updated', { offset });
    } catch (error) {
      logError('Error setting icon offset:', error);
    }
  }

  /**
   * Sets the icon anchor with error handling
   * @param anchor - Icon anchor position
   * @param options - Style setter options
   */
  function setIconAnchor(
    anchor: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('icon-anchor', anchor, options);
    } catch (error) {
      logError('Error setting icon anchor:', error);
    }
  }

  // Text property setters
  /**
   * Sets the text opacity with error handling and validation
   * @param opacity - Text opacity value (0-1)
   * @param options - Style setter options
   */
  function setTextOpacity(
    opacity: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      if (opacity < 0 || opacity > 1) {
        logWarn('Warning: Text opacity should be between 0 and 1', { opacity });
      }
      setPaintProperty('text-opacity', opacity, options);
    } catch (error) {
      logError('Error setting text opacity:', error);
    }
  }

  /**
   * Sets the text color with error handling
   * @param color - Text color value
   * @param options - Style setter options
   */
  function setTextColor(
    color: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('text-color', color, options);
    } catch (error) {
      logError('Error setting text color:', error);
    }
  }

  /**
   * Sets the text halo color with error handling
   * @param color - Text halo color value
   * @param options - Style setter options
   */
  function setTextHaloColor(
    color: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('text-halo-color', color, options);
    } catch (error) {
      logError('Error setting text halo color:', error);
    }
  }

  /**
   * Sets the text halo width with error handling
   * @param width - Text halo width value
   * @param options - Style setter options
   */
  function setTextHaloWidth(
    width: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('text-halo-width', width, options);
    } catch (error) {
      logError('Error setting text halo width:', error);
    }
  }

  /**
   * Sets the text halo blur with error handling
   * @param blur - Text halo blur value
   * @param options - Style setter options
   */
  function setTextHaloBlur(
    blur: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setPaintProperty('text-halo-blur', blur, options);
    } catch (error) {
      logError('Error setting text halo blur:', error);
    }
  }

  /**
   * Sets the text field with error handling
   * @param field - Text field value or expression
   * @param options - Style setter options
   */
  function setTextField(
    field: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('text-field', field, options);
    } catch (error) {
      logError('Error setting text field:', error);
    }
  }

  /**
   * Sets the text font with error handling
   * @param font - Array of font names
   * @param options - Style setter options
   */
  function setTextFont(
    font: string[],
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      if (!Array.isArray(font)) {
        logWarn('Warning: Text font should be an array of font names', {
          font,
        });
      }
      setLayoutProperty('text-font', font, options);
    } catch (error) {
      logError('Error setting text font:', error);
    }
  }

  /**
   * Sets the text size with error handling
   * @param size - Text size value
   * @param options - Style setter options
   */
  function setTextSize(
    size: number | string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('text-size', size, options);
    } catch (error) {
      logError('Error setting text size:', error);
    }
  }

  /**
   * Sets the text rotation with error handling
   * @param rotation - Text rotation value in degrees
   * @param options - Style setter options
   */
  function setTextRotate(
    rotation: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('text-rotate', rotation, options);
    } catch (error) {
      logError('Error setting text rotation:', error);
    }
  }

  /**
   * Sets the text offset with error handling
   * @param offset - Text offset as [x, y] coordinates
   * @param options - Style setter options
   */
  function setTextOffset(
    offset: [number, number],
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      if (!Array.isArray(offset) || offset.length !== 2) {
        logWarn(
          'Warning: Text offset should be an array of two numbers [x, y]',
          {
            offset,
          },
        );
      }
      setLayoutProperty('text-offset', offset, options);
    } catch (error) {
      logError('Error setting text offset:', error);
    }
  }

  /**
   * Sets the text anchor with error handling
   * @param anchor - Text anchor position
   * @param options - Style setter options
   */
  function setTextAnchor(
    anchor: string,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('text-anchor', anchor, options);
    } catch (error) {
      logError('Error setting text anchor:', error);
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
      logError('Error setting symbol layer visibility:', error);
    }
  }

  /**
   * Sets the symbol sort key with error handling
   * @param sortKey - Sort key value for layer ordering
   * @param options - Style setter options
   */
  function setSortKey(
    sortKey: number,
    options: StyleSetterOptions = { validate: true },
  ): void {
    try {
      setLayoutProperty('symbol-sort-key', sortKey, options);
    } catch (error) {
      logError('Error setting symbol sort key:', error);
    }
  }

  return {
    ...actions,
    setStyle,
    setLayoutProperty,
    setPaintProperty,
    setIconOpacity,
    setIconColor,
    setIconHaloColor,
    setIconHaloWidth,
    setIconHaloBlur,
    setIconImage,
    setIconSize,
    setIconRotate,
    setIconOffset,
    setIconAnchor,
    setTextOpacity,
    setTextColor,
    setTextHaloColor,
    setTextHaloWidth,
    setTextHaloBlur,
    setTextField,
    setTextFont,
    setTextSize,
    setTextRotate,
    setTextOffset,
    setTextAnchor,
    setVisibility,
    setSortKey,
  };
}
