import type { MapLayerEventType } from 'maplibre-gl';

export const MapboxLayerEvents: (keyof MapLayerEventType)[] = [
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'mouseover',
  'mouseout',
  'contextmenu',
  'touchstart',
  'touchend',
  'touchcancel',
];
