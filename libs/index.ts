// import type { App } from 'vue'
// import 'mapbox-gl/dist/mapbox-gl.css'
// import mapboxgl from 'mapbox-gl'
// export * from '@/hooks'
// export * from '@/types'

export * from '@libs/composables';
export * from '@libs/enums';
import { Mapbox, GeolocateControl } from '@libs/components';

export { Mapbox, GeolocateControl };

// import Mapbox from '@/components/Mapbox.vue'
// import CanvasSource from '@/components/Sources/CanvasSource.vue'
// import GeoJsonSource from '@/components/Sources/GeoJsonSource.vue'
// import ImageSource from '@/components/Sources/ImageSource.vue'
// import RasterDemSource from '@/components/Sources/RasterDemSource.vue'
// import RasterSource from '@/components/Sources/RasterSource.vue'
// import VectorTileSource from '@/components/Sources/VectorTileSource.vue'
// import VideoSource from '@/components/Sources/VideoSource.vue'

// import BackgroundLayer from '@/components/Layers/BackgroundLayer.vue'
// import CircleLayer from '@/components/Layers/CircleLayer.vue'
// import CustomLayer from '@/components/Layers/CustomLayer.vue'
// import FillExtrusionLayer from '@/components/Layers/FillExtrusionLayer.vue'
// import FillLayer from '@/components/Layers/FillLayer.vue'
// import HeatmapLayer from '@/components/Layers/HeatmapLayer.vue'
// import HillshadeLayer from '@/components/Layers/HillshadeLayer.vue'
// import LineLayer from '@/components/Layers/LineLayer.vue'
// import RasterLayer from '@/components/Layers/RasterLayer.vue'
// import SkyLayer from '@/components/Layers/SkyLayer.vue'
// import SymbolLayer from '@/components/Layers/SymbolLayer.vue'

// import AttributionControl from '@/components/Controls/AttributionControl.vue'
// import CustomControl from '@/components/Controls/CustomControl.vue'
// import FullscreenControl from '@/components/Controls/FullscreenControl.vue'
// import GeolocateControl from '@/components/Controls/GeolocateControl.vue'
// import NavigationControl from '@/components/Controls/NavigationControl.vue'
// import ScaleControl from '@/components/Controls/ScaleControl.vue'

// import Marker from '@/components/Commons/Marker.vue'
// import Popup from '@/components/Commons/Popup.vue'

// import Image from '@/components/Commons/Image.vue'
// import Fog from '@/components/Commons/Fog.vue'
// import Light from '@/components/Commons/Light.vue'
// import Terrain from '@/components/Commons/Terrain.vue'

// const plugin = {
//   install(
//     app: App,
//     options: {
//       accessToken?: string
//     }
//   ) {
//     if (options && options.accessToken) {
//       mapboxgl.accessToken = options.accessToken
//     }
//     app.component('Mapbox', Mapbox)
//     app.component('ImageSource', ImageSource)
//     app.component('VideoSource', VideoSource)
//     app.component('VectorTileSource', VectorTileSource)
//     app.component('GeoJsonSource', GeoJsonSource)
//     app.component('RasterSource', RasterSource)
//     app.component('RasterDemSource', RasterDemSource)
//     app.component('CanvasSource', CanvasSource)

//     app.component('BackgroundLayer', BackgroundLayer)
//     app.component('CircleLayer', CircleLayer)
//     app.component('CustomLayer', CustomLayer)
//     app.component('FillExtrusionLayer', FillExtrusionLayer)
//     app.component('FillLayer', FillLayer)
//     app.component('HeatmapLayer', HeatmapLayer)
//     app.component('HillshadeLayer', HillshadeLayer)
//     app.component('LineLayer', LineLayer)
//     app.component('RasterLayer', RasterLayer)
//     app.component('SkyLayer', SkyLayer)
//     app.component('SymbolLayer', SymbolLayer)

//     app.component('AttributionControl', AttributionControl)
//     app.component('CustomControl', CustomControl)
//     app.component('FullscreenControl', FullscreenControl)
//     app.component('GeolocateControl', GeolocateControl)
//     app.component('NavigationControl', NavigationControl)
//     app.component('ScaleControl', ScaleControl)

//     // eslint-disable-next-line vue/no-reserved-component-names
//     app.component('Marker', Marker)
//     app.component('Popup', Popup)

//     // eslint-disable-next-line vue/no-reserved-component-names
//     app.component('Image', Image)
//     app.component('Fog', Fog)
//     app.component('Light', Light)
//     app.component('Terrain', Terrain)
//   }
// }

// export {
//   Mapbox,
//   ImageSource,
//   VectorTileSource,
//   VideoSource,
//   GeoJsonSource,
//   RasterSource,
//   RasterDemSource,
//   CanvasSource,
//   BackgroundLayer,
//   CircleLayer,
//   CustomLayer,
//   FillExtrusionLayer,
//   FillLayer,
//   HeatmapLayer,
//   HillshadeLayer,
//   LineLayer,
//   RasterLayer,
//   SkyLayer,
//   SymbolLayer,
//   AttributionControl,
//   CustomControl,
//   FullscreenControl,
//   GeolocateControl,
//   NavigationControl,
//   ScaleControl,
//   Marker,
//   Popup,
//   Image,
//   Fog,
//   Light,
//   Terrain
// }

// export default plugin
