import { useCreateLayer } from '@libs/hooks'
import { filterStylePropertiesByKeys } from '@libs/helpers'
import { MapboxLayerType } from '@libs/enums'
import type {
  Map,
  FilterSpecification,
  SourceSpecification,
  LineLayerSpecification
} from 'maplibre-gl'
import type {
  CreateLayerActions,
  Nullable,
  LineLayout,
  LinePaint,
  LineLayerStyle,
  AnySourceImpl
} from '@libs/types'
import type { MaybeRef } from 'vue'

type Layer = LineLayerSpecification
type Layout = LineLayout
type Paint = LinePaint

const paintKeys: (keyof Paint)[] = [
  'line-opacity',
  'line-color',
  'line-translate',
  'line-translate-anchor',
  'line-width',
  'line-gap-width',
  'line-offset',
  'line-blur',
  'line-dasharray',
  'line-pattern',
  'line-gradient'
]

const layoutKeys: (keyof Layout)[] = [
  'line-cap',
  'line-join',
  'line-miter-limit',
  'line-round-limit',
  'line-sort-key',
  'visibility'
]

interface CreateLineLayerProps {
  map: MaybeRef<Nullable<Map>>
  source: MaybeRef<string | AnySourceImpl | SourceSpecification | object | null>
  renderingMode?: string
  slot?: 'bottom' | 'middle' | 'top'
  id?: string
  beforeId?: string
  filter?: FilterSpecification
  style?: LineLayerStyle
  maxzoom?: number
  minzoom?: number
  metadata?: object
  sourceLayer?: string
  register?: (actions: CreateLayerActions<Layer>, map: Map) => void
}

export function useCreateLineLayer(props: CreateLineLayerProps) {
  props.style = props.style || {}

  const layerType = MapboxLayerType.Line
  const paint: Paint = filterStylePropertiesByKeys(props.style, paintKeys)
  const layout: Layout = filterStylePropertiesByKeys(props.style, layoutKeys)

  const { setLayoutProperty, setPaintProperty, ...actions } = useCreateLayer<Layer>({
    map: props.map,
    source: props.source,
    type: layerType,
    id: props.id,
    beforeId: props.beforeId,
    filter: props.filter,
    layout: layout,
    paint: paint,
    renderingMode: props.renderingMode,
    slot: props.slot,
    maxzoom: props.maxzoom,
    minzoom: props.minzoom,
    metadata: props.metadata,
    sourceLayer: props.sourceLayer,
    register: (actions, map) => {
      props.register?.(
        {
          ...actions,
          setStyle
        },
        map
      )
    }
  })

  function setStyle(styleVal: LineLayerStyle = {}) {
    Object.keys(styleVal).forEach(key => {
      if (paintKeys.includes(key as keyof Paint))
        setPaintProperty(key, styleVal[key as keyof Paint], { validate: false })

      if (layoutKeys.includes(key as keyof Layout))
        setLayoutProperty(key, styleVal[key as keyof Layout], {
          validate: false
        })
    })
  }

  return {
    ...actions,
    setStyle,
    setLayoutProperty,
    setPaintProperty
  }
}
