import type { App } from 'vue'
export * from '@libs/hooks'
export * from '@libs/types'
export * from '@libs/helpers'
import 'maplibre-gl/dist/maplibre-gl.css'

import {
  Mapbox,
  GeoJsonSource,
  BackgroundLayer,
  CircleLayer,
  CustomLayer,
  FillExtrusionLayer,
  FillLayer,
  HeatmapLayer,
  HillshadeLayer,
  LineLayer,
  RasterLayer,
  SymbolLayer,
  AttributionControl,
  FullscreenControl,
  GeolocateControl,
  NavigationControl,
  ScaleControl,
  Marker,
  Popup,
  Image
} from '@libs/components'

const plugin = {
  install(
    app: App,
    options: {
      accessToken?: string
    }
  ) {
    app.component('Mapbox', Mapbox)

    app.component('GeoJsonSource', GeoJsonSource)

    app.component('BackgroundLayer', BackgroundLayer)
    app.component('CircleLayer', CircleLayer)
    app.component('CustomLayer', CustomLayer)
    app.component('FillExtrusionLayer', FillExtrusionLayer)
    app.component('FillLayer', FillLayer)
    app.component('HeatmapLayer', HeatmapLayer)
    app.component('HillshadeLayer', HillshadeLayer)
    app.component('LineLayer', LineLayer)
    app.component('RasterLayer', RasterLayer)
    app.component('SymbolLayer', SymbolLayer)

    app.component('AttributionControl', AttributionControl)
    app.component('FullscreenControl', FullscreenControl)
    app.component('GeolocateControl', GeolocateControl)
    app.component('NavigationControl', NavigationControl)
    app.component('ScaleControl', ScaleControl)

    // eslint-disable-next-line vue/no-reserved-component-names
    app.component('Marker', Marker)
    app.component('Popup', Popup)

    // eslint-disable-next-line vue/no-reserved-component-names
    app.component('Image', Image)
  }
}

export {
  Mapbox,
  GeoJsonSource,
  BackgroundLayer,
  CircleLayer,
  CustomLayer,
  FillExtrusionLayer,
  FillLayer,
  HeatmapLayer,
  HillshadeLayer,
  LineLayer,
  RasterLayer,
  SymbolLayer,
  AttributionControl,
  FullscreenControl,
  GeolocateControl,
  NavigationControl,
  ScaleControl,
  Marker,
  Popup,
  Image
}

export default plugin
