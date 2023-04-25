<script lang="ts" setup>
import { inject, nextTick, onMounted } from 'vue';
import type { ShallowRef } from 'vue';
import { GeolocateControl, PositionOptions, Map } from 'mapbox-gl';
import type { PointLike } from 'mapbox-gl';

export interface GeocontrolOptions {
  geolocateControlOptions?: {
    positionOptions?: PositionOptions | undefined;
    fitBoundsOptions?: {
      linear?: boolean | undefined;
      offset?: PointLike | undefined;
      maxZoom?: number | undefined;
      maxDuration?: number | undefined;
    };
    trackUserLocation?: boolean | undefined;
    showAccuracyCircle?: boolean | undefined;
    showUserLocation?: boolean | undefined;
    showUserHeading?: boolean | undefined;
    geolocation?: Geolocation | undefined;
  };
}

const emits = defineEmits(['gpsOn', 'gpsOff', 'geoAdded']);
const props = defineProps<GeocontrolOptions>();
const { geolocateControlOptions } = props;

const map = inject<ShallowRef<Map | null>>('map');

let geoControl: GeolocateControl | null = null;

function addControl(map: Map | null | undefined) {
  if (!map) return;

  geoControl = new GeolocateControl(geolocateControlOptions);
  map.addControl(geoControl);

  // GPS off
  geoControl.on('error', () => emits('gpsOff'));
  // GPS on
  geoControl.on('geolocate', (e) => emits('gpsOn', e));

  emits('geoAdded', geoControl);
}

onMounted(async () => {
  await nextTick();
  addControl(map?.value);
});
</script>
