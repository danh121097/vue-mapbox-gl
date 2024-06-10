import { useCreateLayer } from '@libs/hooks'
import { filterStylePropertiesByKeys } from '@libs/helpers'
import { MapboxLayerType } from '@libs/enums'
import type {
  Map,
  BackgroundLayerSpecification,
  SourceSpecification,
  FilterSpecification
} from 'maplibre-gl'
import type {
  CreateLayerActions,
  Nullable,
  BackgroundPaint,
  AnySourceImpl,
  BackgroundLayout,
  BackgroundLayerStyle
} from '@libs/types'
import type { MaybeRef } from 'vue'

type Layer = BackgroundLayerSpecification
type Layout = BackgroundLayout
type Paint = BackgroundPaint

const paintKeys: (keyof Paint)[] = ['background-color', 'background-opacity', 'background-pattern']
const layoutKeys: (keyof Layout)[] = ['visibility']

interface CreateBackgroundLayerProps {
  map: MaybeRef<Nullable<Map>>
  source: MaybeRef<string | AnySourceImpl | SourceSpecification | object | null>
  renderingMode?: string
  slot?: 'bottom' | 'middle' | 'top'
  id?: string
  beforeId?: string
  filter?: FilterSpecification
  style?: BackgroundLayerStyle
  maxzoom?: number
  minzoom?: number
  metadata?: object
  sourceLayer?: string
  register?: (actions: CreateLayerActions<Layer>, map: Map) => void
}

export function useCreateBackgroundLayer(props: CreateBackgroundLayerProps) {
  props.style = props.style || {}

  const layerType = MapboxLayerType.Background
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

  function setStyle(styleVal: BackgroundLayerStyle = {}) {
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
