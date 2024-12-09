import type { ComputedRef, InjectionKey, ShallowRef } from 'vue';
import type { GeoJSONSource, Map, SourceSpecification } from 'maplibre-gl';
import type { Nullable } from '@libs/types';

export const MapProvideKey = Symbol() as InjectionKey<
  ShallowRef<Nullable<Map>> | ComputedRef<Nullable<Map>>
>;

export const SourceProvideKey = Symbol() as InjectionKey<
  | ShallowRef<Nullable<SourceSpecification | GeoJSONSource>>
  | ComputedRef<Nullable<SourceSpecification | GeoJSONSource>>
>;
