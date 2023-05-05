# Maplibre Popup

## Props

- `lngLat`: `LngLatLike` | `[number, number]`
- `offset?`: `number`
  > posisition `transformTranslate` from `lngLat`
- `className?`: `string`
- `marker?`: `Marker`
  > if `marker` popup will added to Marker
- `units?`: `meters` | `millimeters` | `centimeters` | `kilometers` | `acres` | `miles` | `nauticalmiles` | `inches` | `yards` | `feet` | `radians` | `degrees` | `hectares`

  > `offset` equivalent compensation <br/>
  > default: `meters`

- `options?`
  | Name | Description |
  | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | _options.closeButton_ <br/> `boolean` | If `true` , a close button will appear in the top right corner of the popup. |
  | _options.closeOnClick_ <br/> `boolean` | If `true` , the popup will closed when the map is clicked. |
  | _options.closeOnMove_ <br/> `boolean` | If `true` , the popup will closed when the map moves. |

Full list of `options` you can see on [API page](https://maplibre.org/maplibre-gl-js-docs/api/markers/#popup)

## Events

`@added`,
`@removed`,
`@open`,
`@close`
