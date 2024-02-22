export interface MapAsset {
  path: string;
  name: string;
}

export interface StyleFunction {
  stops?: any[][] | undefined;
  property?: string | undefined;
  base?: number | undefined;
  type?: 'identity' | 'exponential' | 'interval' | 'categorical' | undefined;
  default?: any;
  colorSpace?: 'rgb' | 'lab' | 'hcl' | undefined;
}

type ExpressionName =
  // Types
  | 'array'
  | 'boolean'
  | 'collator'
  | 'format'
  | 'literal'
  | 'number'
  | 'number-format'
  | 'object'
  | 'string'
  | 'image'
  | 'to-boolean'
  | 'to-color'
  | 'to-number'
  | 'to-string'
  | 'typeof'
  // Feature data
  | 'feature-state'
  | 'geometry-type'
  | 'id'
  | 'line-progress'
  | 'properties'
  // Lookup
  | 'at'
  | 'get'
  | 'has'
  | 'in'
  | 'index-of'
  | 'length'
  | 'slice'
  // Decision
  | '!'
  | '!='
  | '<'
  | '<='
  | '=='
  | '>'
  | '>='
  | 'all'
  | 'any'
  | 'case'
  | 'match'
  | 'coalesce'
  | 'within'
  // Ramps, scales, curves
  | 'interpolate'
  | 'interpolate-hcl'
  | 'interpolate-lab'
  | 'step'
  // Variable binding
  | 'let'
  | 'var'
  // String
  | 'concat'
  | 'downcase'
  | 'is-supported-script'
  | 'resolved-locale'
  | 'upcase'
  // Color
  | 'rgb'
  | 'rgba'
  | 'to-rgba'
  // Math
  | '-'
  | '*'
  | '/'
  | '%'
  | '^'
  | '+'
  | 'abs'
  | 'acos'
  | 'asin'
  | 'atan'
  | 'ceil'
  | 'cos'
  | 'e'
  | 'floor'
  | 'ln'
  | 'ln2'
  | 'log10'
  | 'log2'
  | 'max'
  | 'min'
  | 'pi'
  | 'round'
  | 'sin'
  | 'sqrt'
  | 'tan'
  // Zoom, Heatmap
  | 'zoom'
  | 'heatmap-density';

type Expression = [ExpressionName, ...any[]];

export namespace Vue3MapBox {
  export interface PaintFill {
    'fill-antialias'?: boolean;
    'fill-opacity'?: number;
    'fill-color'?: string;
    'fill-outline-color'?: string;
    'fill-translate'?: [number, number];
    'fill-translate-anchor'?: 'map' | 'viewport';
    'fill-pattern'?: string;
  }

  export interface PaintLine {
    'line-opacity'?: number | StyleFunction | Expression | undefined | any[];
    'line-color'?: string;
    'line-translate'?: [number, number];
    'line-translate-anchor'?: 'map' | 'viewport';
    'line-width'?: number | StyleFunction | Expression | undefined | any[];
    'line-gap-width'?: number;
    'line-offset'?: number;
    'line-blur'?: number;
    'line-dasharray'?: Array<number>;
    'line-pattern'?: string;
    'line-gradient'?: unknown;
  }

  export interface PaintSymbol {
    'icon-opacity'?: number;
    'icon-color'?: string;
    'icon-halo-color'?: string;
    'icon-halo-width'?: number;
    'icon-halo-blur'?: number;
    'icon-translate'?: [number, number];
    'icon-translate-anchor'?: 'map' | 'viewport';
    'text-opacity'?: number;
    'text-color'?: string;
    'text-halo-color'?: string;
    'text-halo-width'?: number;
    'text-halo-blur'?: number;
    'text-translate'?: [number, number];
    'text-translate-anchor'?: 'map' | 'viewport';
  }

  export interface PaintCircle {
    'circle-radius'?: number;
    'circle-color'?: string;
    'circle-blur'?: number;
    'circle-opacity'?: number;
    'circle-translate'?: [number, number];
    'circle-translate-anchor'?: 'map' | 'viewport';
    'circle-pitch-scale'?: 'map' | 'viewport';
    'circle-pitch-alignment'?: 'map' | 'viewport';
    'circle-stroke-width'?: number;
    'circle-stroke-color'?: string;
    'circle-stroke-opacity'?: number;
  }

  export interface LayoutFill {
    'fill-sort-key'?: number;
    visibility?: 'visible' | 'none';
  }

  export interface LayoutLine {
    'line-cap'?: 'butt' | 'round' | 'square';
    'line-join'?: 'bevel' | 'round' | 'miter';
    'line-miter-limit'?: number;
    'line-round-limit'?: number;
    'line-sort-key'?: number;
    visibility?: 'visible' | 'none';
  }

  export interface LayoutSymbol {
    'symbol-placement'?: 'point' | 'line' | 'line-center';
    'symbol-spacing'?: number;
    'symbol-avoid-edges'?: boolean;
    'symbol-sort-key'?: number;
    'symbol-z-order'?: 'auto' | 'viewport-y' | 'source';
    'icon-allow-overlap'?: boolean;
    'icon-overlap'?: 'never' | 'always' | 'cooperative';
    'icon-ignore-placement'?: boolean;
    'icon-optional'?: boolean;
    'icon-rotation-alignment'?: 'map' | 'viewport' | 'auto';
    'icon-size'?: number;
    'icon-text-fit'?: 'none' | 'width' | 'height' | 'both';
    'icon-text-fit-padding'?: [number, number, number, number];
    'icon-image'?: string;
    'icon-rotate'?: number;
    'icon-padding'?: number | number[];
    'icon-keep-upright'?: boolean;
    'icon-offset'?: [number, number];
    'icon-anchor'?:
      | 'center'
      | 'left'
      | 'right'
      | 'top'
      | 'bottom'
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right';
    'icon-pitch-alignment'?: 'map' | 'viewport' | 'auto';
    'text-pitch-alignment'?: 'map' | 'viewport' | 'auto';
    'text-rotation-alignment'?: 'map' | 'viewport' | 'viewport-glyph' | 'auto';
    'text-field'?: string;
    'text-font'?: Array<string>;
    'text-size'?: number;
    'text-max-width'?: number;
    'text-line-height'?: number;
    'text-letter-spacing'?: number;
    'text-justify'?: 'auto' | 'left' | 'center' | 'right';
    'text-radial-offset'?: number;
    'text-variable-anchor'?: Array<
      | 'center'
      | 'left'
      | 'right'
      | 'top'
      | 'bottom'
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right'
    >;
    'text-anchor'?:
      | 'center'
      | 'left'
      | 'right'
      | 'top'
      | 'bottom'
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right';
    'text-max-angle'?: number;
    'text-writing-mode'?: Array<'horizontal' | 'vertical'>;
    'text-rotate'?: number;
    'text-padding'?: number;
    'text-keep-upright'?: boolean;
    'text-transform'?: 'none' | 'uppercase' | 'lowercase';
    'text-offset'?: [number, number];
    'text-allow-overlap'?: boolean;
    'text-overlap'?: 'never' | 'always' | 'cooperative';
    'text-ignore-placement'?: boolean;
    'text-optional'?: boolean;
    visibility?: 'visible' | 'none';
  }

  export interface LayoutCircle {
    'circle-sort-key'?: number;
    visibility?: 'visible' | 'none';
  }
  export type LayerType = 'fill' | 'line' | 'circle' | 'symbol';

  export type PaintSpecification =
    | PaintCircle
    | PaintFill
    | PaintLine
    | PaintSymbol;

  export type LayoutSpecification =
    | LayoutCircle
    | LayoutFill
    | LayoutLine
    | LayoutSymbol;
}
