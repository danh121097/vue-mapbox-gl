export type GeoControlEvents =
  | 'geolocate'
  | 'error'
  | 'outofmaxbounds'
  | 'trackuserlocationstart'
  | 'trackuserlocationend'
  | 'initialized';

export const geolocateControlEvents: GeoControlEvents[] = [
  'geolocate',
  'error',
  'outofmaxbounds',
  'trackuserlocationstart',
  'trackuserlocationend',
  'initialized'
];
