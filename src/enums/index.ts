export const MAP_KEY = 'map';
export const DEFAULT_MAP_OPTIONS = { container: 'mapContainer' };
export const DEFAULT_GEO_CONTROL_OPTIONS = {
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true,
  showUserHeading: false,
  showAccuracyCircle: false
};
export type Units =
  | 'meters'
  | 'millimeters'
  | 'centimeters'
  | 'kilometers'
  | 'acres'
  | 'miles'
  | 'nauticalmiles'
  | 'inches'
  | 'yards'
  | 'feet'
  | 'radians'
  | 'degrees'
  | 'hectares';
