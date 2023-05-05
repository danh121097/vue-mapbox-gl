# Maplibre GeolocateControl

A `GeolocateControl` control provides a button that uses the browser's geolocation API to locate the user on the map.

Not all browsers support geolocation, and some users may disable the feature. Geolocation support for modern browsers including Chrome requires sites to be served over HTTPS. If geolocation support is not available, the GeolocateControl will show as disabled.

The zoom level applied will depend on the accuracy of the geolocation provided by the device.

The GeolocateControl has two modes. If `trackUserLocation` is `false` (default) the control acts as a button, which when pressed will set the map's camera to target the user location. If the user moves, the map won't update. This is most suited for the desktop. If `trackUserLocation` is `true` the control acts as a toggle button that when active the user's location is actively monitored for changes. In this mode the GeolocateControl has three interaction states:

active - the map's camera automatically updates as the user's location changes, keeping the location dot in the center. Initial state and upon clicking the `GeolocateControl` button.
passive - the user's location dot automatically updates, but the map's camera does not. Occurs upon the user initiating a map movement.
disabled - occurs if Geolocation is not available, disabled or denied.
These interaction states can't be controlled programmatically, rather they are set based on user interactions.

## Props

- `position?`: `top-right | top-left | bottom-right | bottom-left`
- `options?` <br/>
  > _Here is default in GeoControl component_
  ```
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true,
  showUserHeading: false,
  showAccuracyCircle: false
  ```
  | Name                                        | Description                                                                                                                                                                                                                                                                   |
  | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | _options.positionOptions_ <br/> `Object`    | A Geolocation API [PositionOptions](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) object.                                                                                                                                                  |
  | _options.fitBoundsOptions_ <br/> `Object`   | A [Map#fitBounds](https://maplibre.org/maplibre-gl-js-docs/api/map/#map#fitbounds) options object to use when the map is panned and zoomed to the user's location. The default is to use a `maxZoom` of 15 to limit how far the map will zoom in for very accurate locations. |
  | _options.trackUserLocation_ <br/> `Object`  | If `true` the Geolocate Control becomes a toggle button and when active the map will receive updates to the user's location as it changes.                                                                                                                                    |
  | _options.showAccuracyCircle_ <br/> `Object` | By default, if showUserLocation is `true` , a transparent circle will be drawn around the user location indicating the accuracy (95% confidence level) of the user's location. Set to `false` to disable. Always disabled when showUserLocation is `false` .                  |
  | _options.showUserLocation_ <br/> `Object`   | By default a dot will be shown on the map at the user's location. Set to `false` to disable.                                                                                                                                                                                  |

Full list of `options` you can see on [API page](https://maplibre.org/maplibre-gl-js-docs/api/markers/#geolocatecontrol)

## Events

`@geolocate`,
`@error`,
`@outofmaxbounds`,
`@trackuserlocationstart`,
`@trackuserlocationend`,
`@initialized`
