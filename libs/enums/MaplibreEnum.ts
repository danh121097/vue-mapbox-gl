import type { GeolocateEventTypes, MapEventTypes } from '@libs/types';

export enum MapCreationStatus {
  NotInitialized = 'not-initialized',
  Initializing = 'initializing',
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
  Destroyed = 'destroyed',
}

/**
 * One of the map events `Maplibre` forwards.
 *
 * Spelled out rather than read off `MaplibreEvents` because Vue's SFC compiler
 * resolves emit types syntactically: it cannot follow `(typeof x)[number]` back
 * to an array literal, and a union it cannot resolve is a component with no
 * typed emits at all. The two lists are kept in step by the checks below, which
 * fail to compile if either grows a name the other lacks.
 */
export type MaplibreEvent =
  | 'error'
  | 'load'
  | 'idle'
  | 'remove'
  | 'render'
  | 'resize'
  | 'webglcontextlost'
  | 'webglcontextrestored'
  | 'dataloading'
  | 'data'
  | 'tiledataloading'
  | 'sourcedataloading'
  | 'sourcedata'
  | 'styledata'
  | 'styleimagemissing'
  | 'dataabort'
  | 'sourcedataabort'
  | 'boxzoomcancel'
  | 'boxzoomstart'
  | 'boxzoomend'
  | 'touchcancel'
  | 'touchmove'
  | 'touchend'
  | 'touchstart'
  | 'click'
  | 'contextmenu'
  | 'dblclick'
  | 'mousemove'
  | 'mouseup'
  | 'mousedown'
  | 'mouseout'
  | 'mouseover'
  | 'movestart'
  | 'move'
  | 'moveend'
  | 'zoomstart'
  | 'zoom'
  | 'zoomend'
  | 'rotatestart'
  | 'rotate'
  | 'rotateend'
  | 'dragstart'
  | 'drag'
  | 'dragend'
  | 'pitchstart'
  | 'pitch'
  | 'pitchend'
  | 'wheel'
  | 'terrain';

/**
 * The map events `Maplibre` attaches listeners for at runtime. `as const`
 * keeps the literal names so the exhaustiveness check below can compare them
 * with `MaplibreEvent`.
 */
export const MaplibreEvents = [
  'error',
  'load',
  'idle',
  'remove',
  'render',
  'resize',
  'webglcontextlost',
  'webglcontextrestored',
  'dataloading',
  'data',
  'tiledataloading',
  'sourcedataloading',
  'sourcedata',
  'styledata',
  'styleimagemissing',
  'dataabort',
  'sourcedataabort',
  'boxzoomcancel',
  'boxzoomstart',
  'boxzoomend',
  'touchcancel',
  'touchmove',
  'touchend',
  'touchstart',
  'click',
  'contextmenu',
  'dblclick',
  'mousemove',
  'mouseup',
  'mousedown',
  'mouseout',
  'mouseover',
  'movestart',
  'move',
  'moveend',
  'zoomstart',
  'zoom',
  'zoomend',
  'rotatestart',
  'rotate',
  'rotateend',
  'dragstart',
  'drag',
  'dragend',
  'pitchstart',
  'pitch',
  'pitchend',
  'wheel',
  'terrain',
] as const satisfies readonly MaplibreEvent[];

/**
 * Proves every name in `MaplibreEvent` is a real maplibre event. `satisfies`
 * used to carry this on the array; it now carries the narrower claim below, so
 * the tie back to maplibre's own event map is made here instead.
 */
const _everyMaplibreEventIsReal: Exclude<
  MaplibreEvent,
  keyof MapEventTypes
> extends never
  ? true
  : never = true;
void _everyMaplibreEventIsReal;

/**
 * Proves the union and the array name the same events. The `satisfies` above
 * covers one direction -- no listener for an event the union omits -- and this
 * covers the other: an event in the union that nothing listens for would be
 * emitted in the types and never at runtime, which is how three phantom events
 * reached the published surface.
 */
const _everyMaplibreEventIsListenedFor: Exclude<
  MaplibreEvent,
  (typeof MaplibreEvents)[number]
> extends never
  ? true
  : never = true;
void _everyMaplibreEventIsListenedFor;

export const GeolocateEvents = [
  'geolocate',
  'error',
  'outofmaxbounds',
  'trackuserlocationstart',
  'trackuserlocationend',
] as const satisfies readonly (keyof GeolocateEventTypes)[];
