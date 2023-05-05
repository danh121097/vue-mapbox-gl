# Maplibre Marker

## Props

- `lngLat`: `LngLatLike` | `[number number]`
- `className?`: `string`
- `cursor?`: `string`
- `options?`
  | Name | Description |
  | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | _options.element_ <br/> `HTMLElement` | DOM element to use as a marker. The default is a light blue, droplet-shaped SVG marker. |
  | _options.anchor_ `string` <br/>default: `center` | A string indicating the part of the Marker that should be positioned closest to the coordinate set via [Marker#setLngLat](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker#setlnglat) . Options are `center` `top` `bottom` `left` `right` `top-left` `top-right` `bottom-left` `bottom-right` . |
  | _options.offset_ `PointLike` | The offset in pixels as a [PointLike](https://maplibre.org/maplibre-gl-js-docs/api/geography/#pointlike) object to apply relative to the element's center. Negatives indicate left and up. |

Full list of `options` you can see on [API page](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker)

## Events

`@added`,
`@update:coordinates`,
`@removed`,
`@dragstart`,
`@drag`,
`@dragend`,
`@click`,
`@mouseenter`,
`@mouseleave`

Full list of `events` you can see on [API page](https://maplibre.org/maplibre-gl-js-docs/api/markers/#marker-events)
