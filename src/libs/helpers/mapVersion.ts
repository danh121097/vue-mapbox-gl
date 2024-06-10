import maplibre from 'maplibre-gl'

export function getVersion() {
  return maplibre.getVersion()
}

export function getMainVersion() {
  return parseInt(getVersion().split('.')[0], 10)
}
