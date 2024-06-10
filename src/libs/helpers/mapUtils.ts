import type { LngLatLike, Map } from 'maplibre-gl'

export function hasSource(map: Map, sourceId: string): boolean {
  return !!(map as any).style && !!map.getSource(sourceId)
}

export function hasLayer(map: Map, sourceId: string) {
  return (map as any).style && map.getLayer(sourceId)
}

export function lngLatLikeHasValue(lngLatLike?: LngLatLike): lngLatLike is LngLatLike {
  if (lngLatLike) {
    if (Array.isArray(lngLatLike))
      return lngLatLike.length >= 2 && lngLatLike[0] !== undefined && lngLatLike[1] !== undefined

    if (String.prototype.toString.call(lngLatLike) === '[object Object]')
      return (
        ((lngLatLike as any).lng !== undefined || (lngLatLike as any).lon !== undefined) &&
        lngLatLike.lat !== undefined
      )
  }
  return false
}
