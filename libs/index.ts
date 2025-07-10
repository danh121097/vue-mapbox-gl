// Import CSS for convenience
import 'maplibre-gl/dist/maplibre-gl.css';

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

// Re-export MapLibre GL types and classes for convenience (excluding conflicting names)
export {
  Map,
  LngLat,
  LngLatBounds,
  Point,
  MercatorCoordinate,
  EdgeInsets,
  CanvasSource,
  GeoJSONSource,
  ImageSource,
  RasterDEMTileSource,
  RasterTileSource,
  VectorTileSource,
  VideoSource,
  // Controls (excluding conflicting ones)
  AttributionControl,
  FullscreenControl,
  NavigationControl,
  ScaleControl,
  // Events and other utilities
  Evented,
  // Style and layer related
  Style,
  // Types
  type MapOptions,
  type LngLatLike,
  type LngLatBoundsLike,
  type PointLike,
  type PaddingOptions,
  type CameraOptions,
  type AnimationOptions,
  type StyleSpecification,
  type LayerSpecification,
  type SourceSpecification,
  type FilterSpecification,
  type ExpressionSpecification,
  type TransitionSpecification,
  type PropertyValueSpecification,
  type DataDrivenPropertyValueSpecification,
  type CameraForBoundsOptions,
  type FitBoundsOptions,
  type MapEventType,
  type MapLayerEventType,
  type MapSourceDataEvent,
  type MapContextEvent,
  type MapDataEvent,
  type MapMouseEvent,
  type MapTouchEvent,
  type MapWheelEvent,
  type MapLibreZoomEvent,
  type MapGeoJSONFeature,
  type QueryRenderedFeaturesOptions,
  type QuerySourceFeatureOptions,
  type FeatureIdentifier,
} from 'maplibre-gl';
