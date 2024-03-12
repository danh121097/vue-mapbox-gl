export type GeoControlEvents =
  | 'geolocate'
  | 'error'
  | 'outofmaxbounds'
  | 'trackuserlocationend'
  | 'trackuserlocationstart';

export const geolocateControlEvents: GeoControlEvents[] = [
  'geolocate',
  'error',
  'outofmaxbounds',
  'trackuserlocationstart',
  'trackuserlocationend'
];
