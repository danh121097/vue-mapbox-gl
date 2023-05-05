# Maplibre Map

The `Map` object represents the map on your page. It exposes methods and properties that enable you to programmatically change the map, and fires events as users interact with it.

You create a `Map` by specifying a `container` and other options. Then MapLibre GL JS initializes the map on the page and returns your `Map` object.

## Props

- `options`
  | Name | Description |
  | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | _options.container_ <br/> `HTMLElement` `string` | The HTML element in which MapLibre GL JS will render the map, <br/> or the element's string id . The specified element must have no children. |
  | _options.minZoom_ <br/>`number` <br/>default: `0` | The minimum zoom level of the map (0-24). |
  | _options.maxZoom_ `number` <br/>default: `22` | The maximum zoom level of the map (0-24). |
  | _options.minPitch_ `number` <br/>default: `0` | The minimum pitch of the map (0-85). Values greater than 60 degrees are experimental and may result in rendering issues. If you encounter any, please raise an issue with details in the MapLibre project. |
  | _options.maxPitch_ `number` <br/>default: `60` | The minimum pitch of the map (0-85). Values greater than 60 degrees are experimental and may result in rendering issues. If you encounter any, please raise an issue with details in the MapLibre project. |
  | _options.maxPitch_ `number` <br/>default: `60` | The map's MapLibre style. This must be an a JSON object conforming to the schema described in the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/) , or a URL to such JSON. |
  | _options.hash_ `boolean` `string` <br/>default: `false` | The map's MapLibre style. This must be an a If true , the map's position (zoom, center latitude, center longitude, bearing, and pitch) will be synced with the hash fragment of the page's URL. |
  | _options.interactive_ `boolean` <br/>default: `true` | If `false` , no mouse, touch, or keyboard listeners will be attached to the map, so it will not respond to interaction. |
  | _options.bearingSnap_ `number` <br/>default: `7` | The threshold, measured in degrees, that determines when the map's bearing will snap to north. For example, with a bearingSnap of 7, if the user rotates the map within 7 degrees of north, the map will automatically snap to exact north. |
  | _options.pitchWithRotate_ `boolean` <br/>default: `true` | If `false` , the map's pitch (tilt) control with "drag to rotate" interaction will be disabled. |
  | _options.clickTolerance_ `number` <br/>default: `3` | The max number of pixels a user can shift the mouse pointer during a click for it to be considered a valid click (as opposed to a mouse drag). |
  | _options.attributionControl_ `boolean` <br/>default: `true` | If `true` , an [AttributionControl](https://maplibre.org/maplibre-gl-js-docs/api/markers/#attributioncontrol) will be added to the map. |
  | _options.attributionControl_ `string` `Array<string>` | String or strings to show in an [AttributionControl](https://maplibre.org/maplibre-gl-js-docs/api/markers/#attributioncontrol) . Only applicable if `options.attributionControl` is `true` . |
  | _options.maplibreLogo_ `boolean` <br/>default: `false` | If `true` , the MapLibre logo will be shown. |
  | _options.logoPosition_ `string` <br/>default: `bottom-left` | A string representing the position of the MapLibre wordmark on the map. Valid options are `top-left` , `top-right` , `bottom-left` , `bottom-right` . |
  | _options.failIfMajorPerformanceCaveat_ `boolean` <br/>default: `false` | If `true` , map creation will fail if the performance of MapLibre GL JS would be dramatically worse than expected (i.e. a software renderer would be used). |
  | _options.preserveDrawingBuffer_ `boolean` <br/>default: `false` | If `true` , the map's canvas can be exported to a PNG using `map.getCanvas().toDataURL()` . This is `false` by default as a performance optimization. |
  | _options.antialias_ <br/>`boolean` | If `true` , the gl context will be created with MSAA antialiasing, which can be useful for antialiasing custom layers. this is `false` by default as a performance optimization. |
  | _options.refreshExpiredTiles_<br/> `boolean` <br/>default: `true` | If `false` , the map won't attempt to re-request tiles once they expire per their HTTP `cacheControl / expires headers`. |
  | _options.maxBounds_<br/> `LngLatBoundsLike` | If set, the map will be constrained to the given bounds. |
  | _options.scrollZoom_<br/> `boolean` `Object` <br/> default: `true` | If `true` , the "scroll to zoom" interaction is enabled. An `Object` value is passed as options to [ScrollZoomHandler#enable](https://maplibre.org/maplibre-gl-js-docs/api/handlers/#scrollzoomhandler#enable) . |
  | _options.boxZoom_<br/> `boolean` <br/> default: `true` | If `true` , the "box zoom" interaction is enabled (see [BoxZoomHandler](https://maplibre.org/maplibre-gl-js-docs/api/handlers/#boxzoomhandler) ). |
  | _options.dragRotate_<br/> `boolean` <br/> default: `true` | If `true` , the "drag to rotate" interaction is enabled (see [DragRotateHandler](https://maplibre.org/maplibre-gl-js-docs/api/handlers/#dragrotatehandler) ). |
  | _options.dragPan_<br/> `boolean` `Object` <br/> default: `true` | If `true` , the "drag to pan" interaction is enabled. An Object value is passed as options to [DragPanHandler#enable](https://maplibre.org/maplibre-gl-js-docs/api/handlers/#dragpanhandler#enable) . |
  | _options.keyboard_<br/> `boolean` <br/> default: `true` | If `true` , keyboard shortcuts are enabled (see [KeyboardHandler](https://maplibre.org/maplibre-gl-js-docs/api/handlers/#keyboardhandler) ). |
  | _options.doubleClickZoom_<br/> `boolean` <br/> default: `true` | If `true` , the "double click to zoom" interaction is enabled (see [DoubleClickZoomHandler](https://maplibre.org/maplibre-gl-js-docs/api/handlers/#doubleclickzoomhandler) ). |
  | _options.touchZoomRotate_<br/> `boolean` `Object` <br/> default: `true` | If `true` , the "pinch to rotate and zoom" interaction is enabled. An `Object` value is passed as options to [TouchZoomRotateHandler#enable](https://maplibre.org/maplibre-gl-js-docs/api/handlers/#touchpitchhandler#enable) . |

Full list of `options` you can see on [API page](https://maplibre.org/maplibre-gl-js-docs/api/map/#map-parameters)

## Events

`@initialized`,
`@error`,
`@load`,
`@idle`,
`@remove`,
`@render`,
`@resize`,
`@webglcontextlost`,
`@webglcontextrestored`,
`@dataloading`,
`@data`,
`@tiledataloading`,
`@sourcedataloading`,
`@styledataloading`,
`@sourcedata`,
`@styledata`,
`@boxzoomcancel`,
`@boxzoomstart`,
`@boxzoomend`,
`@touchcancel`,
`@touchmove`,
`@touchend`,
`@touchstart`,
`@click`,
`@contextmenu`,
`@dblclick`,
`@mousemove`,
`@mouseup`,
`@mousedown`,
`@mouseout`,
`@mouseover`,
`@movestart`,
`@move`,
`@moveend`,
`@zoomstart`,
`@zoom`,
`@zoomend`,
`@rotatestart`,
`@rotate`,
`@rotateend`,
`@dragstart`,
`@drag`,
`@dragend`,
`@pitchstart`,
`@pitch`,
`@pitchend`,
`@wheel`,
