<script lang="ts" setup>
import { MapProvideKey, MapboxEvents, MapboxStatus } from '@libs/enums'
import { useCreateMapbox, useMapEventListener } from '@libs/hooks'
import type {
  MapLibreEvent,
  MapOptions,
  MapLibreZoomEvent,
  MapContextEvent,
  MapDataEvent,
  MapMouseEvent,
  MapSourceDataEvent,
  MapStyleDataEvent,
  MapTouchEvent,
  MapWheelEvent
} from 'maplibre-gl'
import type { CreateMapboxActions, MapboxActions, MapEventTypes } from '@libs/types'

interface MapboxProps {
  width?: string
  height?: string
  showStats?: boolean
  options?: Partial<MapOptions>
}

interface Emits {
  (e: keyof MapEventTypes, ev: any): void
  (e: 'register', mapboxComponentAction: MapboxActions): void
  (e: 'error', ev: ErrorEvent): void
  (e: 'load', ev: MapLibreEvent): void
  (e: 'idle', ev: MapLibreEvent): void
  (e: 'remove', ev: MapLibreEvent): void
  (e: 'render', ev: MapLibreEvent): void
  (e: 'resize', ev: MapLibreEvent): void
  (e: 'webglcontextlost', ev: MapContextEvent): void
  (e: 'webglcontextrestored', ev: MapContextEvent): void
  (e: 'dataloading', ev: MapDataEvent): void
  (e: 'data', ev: MapDataEvent): void
  (e: 'tiledataloading', ev: MapDataEvent): void
  (e: 'sourcedataloading', ev: MapSourceDataEvent): void
  (e: 'styledataloading', ev: MapStyleDataEvent): void
  (e: 'sourcedata', ev: MapSourceDataEvent): void
  (e: 'styledata', ev: MapStyleDataEvent): void
  (e: 'boxzoomcancel', ev: MapLibreZoomEvent): void
  (e: 'boxzoomstart', ev: MapLibreZoomEvent): void
  (e: 'boxzoomend', ev: MapLibreZoomEvent): void
  (e: 'touchcancel', ev: MapTouchEvent): void
  (e: 'touchmove', ev: MapTouchEvent): void
  (e: 'touchend', ev: MapTouchEvent): void
  (e: 'touchstart', ev: MapTouchEvent): void
  (e: 'click', ev: MapMouseEvent): void
  (e: 'contextmenu', ev: MapMouseEvent): void
  (e: 'dblclick', ev: MapMouseEvent): void
  (e: 'mousemove', ev: MapMouseEvent): void
  (e: 'mouseup', ev: MapMouseEvent): void
  (e: 'mousedown', ev: MapMouseEvent): void
  (e: 'mouseout', ev: MapMouseEvent): void
  (e: 'mouseover', ev: MapMouseEvent): void
  (e: 'movestart', ev: MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined>): void
  (e: 'move', ev: MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined>): void
  (e: 'moveend', ev: MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined>): void
  (e: 'zoomstart', ev: MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined>): void
  (e: 'zoom', ev: MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined>): void
  (e: 'zoomend', ev: MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined>): void
  (e: 'rotatestart', ev: MapLibreEvent<MouseEvent | TouchEvent | undefined>): void
  (e: 'rotate', ev: MapLibreEvent<MouseEvent | TouchEvent | undefined>): void
  (e: 'rotateend', ev: MapLibreEvent<MouseEvent | TouchEvent | undefined>): void
  (e: 'dragstart', ev: MapLibreEvent<MouseEvent | TouchEvent | undefined>): void
  (e: 'drag', ev: MapLibreEvent<MouseEvent | TouchEvent | undefined>): void
  (e: 'dragend', ev: MapLibreEvent<MouseEvent | TouchEvent | undefined>): void
  (e: 'pitchstart', ev: MapLibreEvent<MouseEvent | TouchEvent | undefined>): void
  (e: 'pitch', ev: MapLibreEvent<MouseEvent | TouchEvent | undefined>): void
  (e: 'pitchend', ev: MapLibreEvent<MouseEvent | TouchEvent | undefined>): void
  (e: 'wheel', ev: MapWheelEvent): void
}

const props = withDefaults(
  defineProps<
    MapboxProps & {
      register?: (mapboxComponentAction: MapboxActions) => void
    }
  >(),
  {
    width: '100%',
    height: '100%',
    showStats: false,
    options: () => ({}) as Partial<MapOptions>
  }
)

const innerOptions = ref<Partial<MapOptions>>({})

const mapOptions = computed(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return {
    ...props.options,
    ...innerOptions.value
  }
})

function setMapOptions(options: Partial<MapOptions>) {
  innerOptions.value = {
    ...unref(mapOptions),
    ...options
  }
}

const emits = defineEmits<Emits>()

const mapboxElRef = ref<HTMLElement | string>('')

const eventFnMap: {
  [propName in keyof MapEventTypes]: (ev: any) => void
} = {} as any

const {
  getMapInstance,
  getMapStatus,
  setCenter,
  setBearing,
  setZoom,
  setPitch,
  setStyle,
  setMaxBounds,
  setMaxPitch,
  setMaxZoom,
  setMinPitch,
  setMinZoom,
  setRenderWorldCopies
} = useCreateMapbox(mapboxElRef, {
  ...unref(mapOptions),
  container: mapboxElRef.value,
  style: String(props.options?.style),
  register: (actions: CreateMapboxActions) => {
    props.register?.({
      ...actions,
      setMapOptions
    })
    emits('register', {
      ...actions,
      setMapOptions
    })
  }
})

MapboxEvents.map(eventName => {
  useMapEventListener({
    map: getMapInstance,
    event: eventName,
    on: data => {
      emits(eventName, data)
    }
  })
})

provide(MapProvideKey, getMapInstance)

onUnmounted(() => {
  MapboxEvents.forEach(event => {
    getMapInstance.value?.off(event, eventFnMap[event])
  })
})

watch(() => unref(mapOptions).center!, setCenter)

watch(() => unref(mapOptions).bearing!, setBearing)

watch(() => unref(mapOptions).zoom!, setZoom)

watch(() => unref(mapOptions).pitch!, setPitch)

watch(() => unref(mapOptions).style!, setStyle)

watch(() => unref(mapOptions).maxBounds!, setMaxBounds)

watch(() => unref(mapOptions).maxPitch!, setMaxPitch)

watch(() => unref(mapOptions).maxZoom!, setMaxZoom)

watch(() => unref(mapOptions).minPitch!, setMinPitch)

watch(() => unref(mapOptions).minZoom!, setMinZoom)

watch(() => unref(mapOptions).renderWorldCopies!, setRenderWorldCopies)
</script>
<template>
  <div
    class="mapbox_wrapper"
    :style="{
      width: props.width,
      height: props.height
    }">
    <div ref="mapboxElRef" class="mapbox_container" />
    <slot v-if="getMapStatus >= MapboxStatus.Loading" name="beforeLoad" />
    <slot v-if="getMapStatus >= MapboxStatus.Loaded" name="default" />
  </div>
</template>
<style lang="scss">
.mapbox_wrapper {
  position: relative;
  .mapbox_container {
    width: 100%;
    height: 100%;
  }
}
</style>
