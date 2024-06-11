import { nanoid } from 'nanoid';
import type { LngLatLike, Map } from 'maplibre-gl';
import maplibre from 'maplibre-gl';

export function getNanoid(id?: string) {
  if (id) return id;
  return nanoid();
}

export function getVersion() {
  return maplibre.getVersion();
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

export function lngLatLikeHasValue(lngLatLike?: LngLatLike) {
  if (!lngLatLike) return false;

  if (Array.isArray(lngLatLike)) {
    return (
      lngLatLike.length >= 2 &&
      lngLatLike[0] !== undefined &&
      lngLatLike[1] !== undefined
    );
  }

  if (typeof lngLatLike === 'object') {
    return (
      ((lngLatLike as any).lng !== undefined ||
        (lngLatLike as any).lon !== undefined) &&
      lngLatLike.lat !== undefined
    );
  }
}
