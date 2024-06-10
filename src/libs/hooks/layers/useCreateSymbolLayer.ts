import { useCreateLayer } from '@libs/hooks'
import { filterStylePropertiesByKeys } from '@libs/helpers'
import { MapboxLayerType } from '@libs/enums'
import type {
  Map,
  FilterSpecification,
  SourceSpecification,
  SymbolLayerSpecification
} from 'maplibre-gl'
import type {
  CreateLayerActions,
  Nullable,
  SymbolLayout,
  SymbolPaint,
  SymbolLayerStyle,
  AnySourceImpl
} from '@libs/types'
import type { MaybeRef } from 'vue'

type Layer = SymbolLayerSpecification
type Layout = SymbolLayout
type Paint = SymbolPaint

const paintKeys: (keyof Paint)[] = [
  'icon-opacity',
  'icon-color',
  'icon-halo-color',
  'icon-halo-width',
  'icon-halo-blur',
  'icon-translate',
  'icon-translate-anchor',
  'text-opacity',
  'text-color',
  'text-halo-color',
  'text-halo-width',
  'text-halo-blur',
  'text-translate',
  'text-translate-anchor'
]

const layoutKeys: (keyof Layout)[] = [
  'symbol-placement',
  'symbol-spacing',
  'symbol-avoid-edges',
  'symbol-sort-key',
  'symbol-z-order',
  'icon-allow-overlap',
  'icon-overlap',
  'icon-ignore-placement',
  'icon-optional',
  'icon-rotation-alignment',
  'icon-size',
  'icon-text-fit',
  'icon-text-fit-padding',
  'icon-image',
  'icon-rotate',
  'icon-padding',
  'icon-keep-upright',
  'icon-offset',
  'icon-anchor',
  'icon-pitch-alignment',
  'text-pitch-alignment',
  'text-rotation-alignment',
  'text-field',
  'text-font',
  'text-size',
  'text-max-width',
  'text-line-height',
  'text-letter-spacing',
  'text-justify',
  'text-radial-offset',
  'text-variable-anchor',
  'text-variable-anchor-offset',
  'text-anchor',
  'text-max-angle',
  'text-writing-mode',
  'text-rotate',
  'text-padding',
  'text-keep-upright',
  'text-transform',
  'text-offset',
  'text-allow-overlap',
  'text-overlap',
  'text-ignore-placement',
  'text-optional',
  'visibility'
]

interface CreateSymbolLayerProps {
  map: MaybeRef<Nullable<Map>>
  source: MaybeRef<string | AnySourceImpl | SourceSpecification | object | null>
  renderingMode?: string
  slot?: 'bottom' | 'middle' | 'top'
  id?: string
  beforeId?: string
  filter?: FilterSpecification
  style?: SymbolLayerStyle
  maxzoom?: number
  minzoom?: number
  metadata?: object
  sourceLayer?: string // 仅 vector 是必须的
  register?: (actions: CreateLayerActions<Layer>, map: Map) => void
}

export function useCreateSymbolLayer(props: CreateSymbolLayerProps) {
  props.style = props.style || {}

  const layerType = MapboxLayerType.Symbol
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

  function setStyle(styleVal: SymbolLayerStyle = {}) {
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
