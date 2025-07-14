// Import CSS styles
import './style.css';

// Export all composables
export * from './composables';

// Export all enums
export * from './enums';

// Export all helpers
export * from './helpers';

// Export all types and interfaces
export * from './types';

// Export all components
export * from './components';

// Re-export comprehensive MapLibre GL types and interfaces for convenience
// Note: Classes are not re-exported to reduce bundle size
// Users should import them directly from 'maplibre-gl' if needed
export type {
  // ===== CORE TYPES =====
  MapOptions,
  LngLatLike,
  LngLatBoundsLike,
  PointLike,
  PaddingOptions,
  CameraOptions,
  AnimationOptions,
  RequestParameters,
  GetResourceResponse,
  AddProtocolAction,
  Config,

  // ===== COORDINATE & GEOMETRY TYPES =====
  IMercatorCoordinate,
  Padding,

  // ===== STYLE SPECIFICATION TYPES =====
  StyleSpecification,
  LayerSpecification,
  SourceSpecification,
  FilterSpecification,
  ExpressionSpecification,
  TransitionSpecification,
  PropertyValueSpecification,
  DataDrivenPropertyValueSpecification,
  StylePropertySpecification,
  StylePropertyExpression,
  ProjectionSpecification,
  SkySpecification,
  SpriteSpecification,
  StateSpecification,

  // ===== BOUNDS AND CAMERA TYPES =====
  CameraForBoundsOptions,
  FitBoundsOptions,

  // ===== EVENT TYPES =====
  MapEventType,
  MapLayerEventType,
  MapSourceDataEvent,
  MapContextEvent,
  MapDataEvent,
  MapLibreZoomEvent,

  // ===== FEATURE TYPES =====
  MapGeoJSONFeature,
  QueryRenderedFeaturesOptions,
  QuerySourceFeatureOptions,
  FeatureIdentifier,
  Feature,
  FeatureState,
  FeatureFilter,

  // ===== SOURCE TYPES =====
  GeoJSONSourceSpecification,
  VectorSourceSpecification,
  RasterSourceSpecification,
  RasterDEMSourceSpecification,
  ImageSourceSpecification,
  VideoSourceSpecification,
  CanvasSourceSpecification,
  SourceExpression,

  // ===== LAYER SPECIFICATION TYPES =====
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
  CircleLayerSpecification,
  HeatmapLayerSpecification,
  FillExtrusionLayerSpecification,
  RasterLayerSpecification,
  HillshadeLayerSpecification,
  BackgroundLayerSpecification,

  // ===== CONTROL TYPES =====
  ControlPosition,
  IControl,

  // ===== TERRAIN & LIGHTING TYPES =====
  TerrainSpecification,
  LightSpecification,

  // ===== EXPRESSION & FORMATTING TYPES =====
  CompositeExpression,
  InterpolationType,
  GlobalProperties,
  PromoteIdSpecification,
  VariableAnchorOffsetCollection,

  // ===== COLOR & STYLING TYPES =====
  ColorArray,
  NumberArray,
  ResolvedImage,

  // ===== DIFF & OPERATIONS TYPES =====
  DiffCommand,
  DiffOperations,

  // ===== TILE & CANONICAL TYPES =====
  ICanonicalTileID,

  // ===== STYLE IMAGE TYPES =====
  StyleImageInterface,
  StyleImageData,
  StyleImageMetadata,
  StyleImage,
  SpriteOnDemandStyleImage,

  // ===== ERROR TYPES =====
  ErrorLike,
} from 'maplibre-gl';

// Re-export essential MapLibre GL classes for convenience
// These are the main classes users typically need
export {
  // ===== CORE CLASSES =====
  Map,
  LngLat,
  LngLatBounds,
  Point,
  MercatorCoordinate,

  // ===== CONTROL CLASSES =====
  NavigationControl,
  GeolocateControl,
  ScaleControl,
  FullscreenControl,
  AttributionControl,

  // ===== SOURCE CLASSES =====
  GeoJSONSource,
  VectorTileSource,
  RasterTileSource,
  RasterDEMTileSource,
  ImageSource,
  VideoSource,
  CanvasSource,

  // ===== MARKER & POPUP CLASSES =====
  // Marker,
  // Popup,

  // ===== EVENT CLASSES =====
  MapMouseEvent,
  MapTouchEvent,
  MapWheelEvent,
  ErrorEvent,
  Event,

  // ===== UTILITY CLASSES =====
  EdgeInsets,

  // ===== STYLE & FORMATTING CLASSES =====
  Color,
  Formatted,
  FormattedSection,

  // ===== ERROR CLASSES =====
  AJAXError,
} from 'maplibre-gl';
