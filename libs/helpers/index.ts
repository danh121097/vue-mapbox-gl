import { nanoid } from 'nanoid';
import type { LngLatLike, Map } from 'maplibre-gl';
import { getVersion } from 'maplibre-gl';

export function getNanoid(id?: string) {
  if (id) return id;
  return nanoid();
}

export function getMainVersion(): number {
  return parseInt(getVersion().split('.')[0], 10);
}

export function hasSource(map: Map, sourceId: string): boolean {
  return !!map.style && !!map.getSource(sourceId);
}

export function hasLayer(map: Map, sourceId: string): boolean {
  return !!map.style && !!map.getLayer(sourceId);
}

export function lngLatLikeHasValue(lngLatLike?: LngLatLike): boolean {
  if (lngLatLike) {
    if (Array.isArray(lngLatLike)) {
      return (
        lngLatLike.length >= 2 &&
        lngLatLike[0] !== undefined &&
        lngLatLike[1] !== undefined
      );
    }

    if (typeof lngLatLike === 'object') {
      if ('lat' in lngLatLike && ('lng' in lngLatLike || 'lon' in lngLatLike)) {
        const { lat } = lngLatLike;
        const lng = 'lng' in lngLatLike ? lngLatLike.lng : undefined;
        const lon = 'lon' in lngLatLike ? lngLatLike.lon : undefined;
        return (lng !== undefined || lon !== undefined) && lat !== undefined;
      }
    }
  }

  return false;
}

export function filterStylePropertiesByKeys<T extends Record<string, any>>(
  style: Record<string, any>,
  keys: (keyof T)[],
): T {
  return Object.fromEntries(
    Object.entries(style).filter(([key]) => keys.includes(key as keyof T)),
  ) as T;
}
