import type { DefineComponent, ComponentOptionsMixin, VNodeProps, AllowedComponentProps, ComponentCustomProps, ExtractPropTypes, PropType as __PropType } from 'vue';
import mapboxgl, { MapboxOptions, PositionOptions, FitBoundsOptions } from 'mapbox-gl';
export interface MapOptions {
    container: HTMLElement | string;
    mapboxOptions: MapboxOptions;
    geolocateControlOptions?: {
        positionOptions?: PositionOptions;
        fitBoundsOptions?: FitBoundsOptions;
        trackUserLocation?: boolean;
        showAccuracyCircle?: boolean;
        showUserLocation?: boolean;
        showUserHeading?: boolean;
        geolocation?: Geolocation;
    };
}
declare const _sfc_main: DefineComponent<{
    container: {
        type: __PropType<string | HTMLElement>;
        required: true;
    };
    mapboxOptions: {
        type: __PropType<mapboxgl.MapboxOptions>;
        required: true;
    };
    geolocateControlOptions: {
        type: __PropType<{
            positionOptions?: mapboxgl.PositionOptions | undefined;
            fitBoundsOptions?: mapboxgl.FitBoundsOptions | undefined;
            trackUserLocation?: boolean | undefined;
            showAccuracyCircle?: boolean | undefined;
            showUserLocation?: boolean | undefined;
            showUserHeading?: boolean | undefined;
            geolocation?: Geolocation | undefined;
        } | undefined>;
        required: false;
    };
}, {}, unknown, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, ("mapLoading" | "mapLoaded" | "mapClick")[], "mapLoading" | "mapLoaded" | "mapClick", VNodeProps & AllowedComponentProps & ComponentCustomProps, Readonly<ExtractPropTypes<{
    container: {
        type: __PropType<string | HTMLElement>;
        required: true;
    };
    mapboxOptions: {
        type: __PropType<mapboxgl.MapboxOptions>;
        required: true;
    };
    geolocateControlOptions: {
        type: __PropType<{
            positionOptions?: mapboxgl.PositionOptions | undefined;
            fitBoundsOptions?: mapboxgl.FitBoundsOptions | undefined;
            trackUserLocation?: boolean | undefined;
            showAccuracyCircle?: boolean | undefined;
            showUserLocation?: boolean | undefined;
            showUserHeading?: boolean | undefined;
            geolocation?: Geolocation | undefined;
        } | undefined>;
        required: false;
    };
}>> & {
    onMapLoading?: ((...args: any[]) => any) | undefined;
    onMapLoaded?: ((...args: any[]) => any) | undefined;
    onMapClick?: ((...args: any[]) => any) | undefined;
}, {}>;
export default _sfc_main;
