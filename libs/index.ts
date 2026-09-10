// Styles are not imported here. MapLibre's own stylesheet is a peer concern:
// consumers import 'maplibre-gl/dist/maplibre-gl.css' themselves, as MapLibre's
// docs instruct. This package's own rules ship as
// 'vue3-maplibre-gl/dist/style.css', the path the docs use throughout, and
// 'vue3-maplibre-gl/dist/style-with-maplibre.css' is the two of them combined
// for consumers who would rather import one file.

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

// Re-export the commonly used public MapLibre GL types directly.
export type {
  AddProtocolAction,
  Alignment,
  AnimationOptions,
  AttributionControlOptions,
  CameraForBoundsOptions,
  CameraOptions,
  CanvasSourceSpecification,
  CircleLayerSpecification,
  Config,
  CompleteMapOptions,
  ControlPosition,
  EaseToOptions,
  ErrorLike,
  Feature,
  FeatureFilter,
  FeatureIdentifier,
  FeatureState,
  FillLayerSpecification,
  FilterSpecification,
  FitBoundsOptions,
  FlyToOptions,
  FullscreenControlOptions,
  GeoJSONFeature,
  GeoJSONFeatureId,
  GeoJSONSourceSpecification,
  GeolocateControlOptions,
  GetResourceResponse,
  ICanonicalTileID,
  IControl,
  IMercatorCoordinate,
  ImageSourceSpecification,
  InterpolationType,
  JumpToOptions,
  LayerSpecification,
  LineLayerSpecification,
  LngLatBoundsLike,
  LngLatLike,
  MapContextEvent,
  MapDataEvent,
  MapEventType,
  MapGeoJSONFeature,
  MapLayerEventType,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  MapLibreEvent,
  MapLibreZoomEvent,
  MapOptions,
  MapProjectionEvent,
  MapSourceDataEvent,
  MapSourceDataType,
  MapStyleDataEvent,
  MapStyleImageMissingEvent,
  MapTerrainEvent,
  MarkerOptions,
  NavigationControlOptions,
  Padding,
  PaddingOptions,
  PointLike,
  PopupOptions,
  ProjectionSpecification,
  PropertyValueSpecification,
  QueryRenderedFeaturesOptions,
  QuerySourceFeatureOptions,
  RasterDEMSourceSpecification,
  RasterSourceSpecification,
  RequestParameters,
  ResolvedImage,
  ScaleControlOptions,
  SkySpecification,
  SourceExpression,
  SourceSpecification,
  SpriteOnDemandStyleImage,
  SpriteSpecification,
  StateSpecification,
  StyleImage,
  StyleImageData,
  StyleImageInterface,
  StyleImageMetadata,
  StyleOptions,
  StylePropertyExpression,
  StylePropertySpecification,
  StyleSetterOptions,
  StyleSpecification,
  SymbolLayerSpecification,
  StyleSwapOptions,
  TerrainSpecification,
  TransitionSpecification,
  UpdateImageOptions,
  VariableAnchorOffsetCollection,
  VectorSourceSpecification,
  VideoSourceSpecification,
} from 'maplibre-gl';

// MapLibre GL classes are values *and* types. Their runtime side moved to the
// 'vue3-maplibre-gl/maplibre' subpath (see below), but the type side stays here:
// a type export is erased at compile time, so it costs a consumer nothing and
// `import type { Map } from 'vue3-maplibre-gl'` keeps working.
export type {
  AJAXError,
  AttributionControl,
  BoxZoomHandler,
  CanvasSource,
  Color,
  CooperativeGesturesHandler,
  DoubleClickZoomHandler,
  DragPanHandler,
  DragRotateHandler,
  EdgeInsets,
  ErrorEvent,
  Event,
  Evented,
  Formatted,
  FormattedSection,
  FullscreenControl,
  GeoJSONSource,
  GeolocateControl,
  GlobeControl,
  Hash,
  ImageSource,
  KeyboardHandler,
  LngLat,
  LngLatBounds,
  LogoControl,
  Map,
  MapMouseEvent,
  MapTouchEvent,
  MapWheelEvent,
  MercatorCoordinate,
  NavigationControl,
  Point,
  RasterDEMTileSource,
  RasterTileSource,
  ScaleControl,
  ScrollZoomHandler,
  Style,
  TerrainControl,
  TwoFingersTouchPitchHandler,
  TwoFingersTouchRotateHandler,
  TwoFingersTouchZoomHandler,
  TwoFingersTouchZoomRotateHandler,
  VectorTileSource,
  VideoSource,
} from 'maplibre-gl';

// `Marker` and `Popup` are Vue components at this package's root, so the
// upstream classes keep the aliases they have always had.
export type {
  Marker as MaplibreMarker,
  Popup as MaplibrePopup,
} from 'maplibre-gl';

// Only the *runtime* MapLibre surface (the `maplibregl` namespace, the classes
// as constructors, `addProtocol`, …) lives on the dedicated
// 'vue3-maplibre-gl/maplibre' subpath, so importing a single component from the
// root does not pin the whole upstream runtime into the module graph.
