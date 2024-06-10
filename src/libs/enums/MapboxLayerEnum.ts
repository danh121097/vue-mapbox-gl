import type { MapLayerEventType } from 'maplibre-gl'
import type { GeolocateEventTypes } from '@libs/types'

export enum MapboxLayerType {
  Background = 'background',
  Circle = 'circle',
  Fill = 'fill',
  FillExtrusion = 'fill-extrusion',
  Line = 'line',
  Raster = 'raster',
  Symbol = 'symbol',
  Heatmap = 'heatmap',
  Hillshade = 'hillshade',
  Sky = 'sky',
  Custom = 'custom'
}

export const MapboxLayerEvents: (keyof MapLayerEventType)[] = [
  'mousedown',
  'mouseup',
  'mouseover',
  'mousemove',
  'click',
  'dblclick',
  'mouseenter',
  'mouseleave',
  'contextmenu',
  'mouseout',
  'touchstart',
  'touchend',
  'touchcancel'
]

export const GeolocateEvents: (keyof GeolocateEventTypes)[] = [
  'geolocate',
  'error',
  'outofmaxbounds',
  'trackuserlocationstart',
  'trackuserlocationend'
]
