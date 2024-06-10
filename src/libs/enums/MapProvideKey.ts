import type { ComputedRef, InjectionKey, ShallowRef } from 'vue'
import type { Map } from 'maplibre-gl'
import type { Nullable, AnySourceImpl } from '@libs/types'

export const MapProvideKey = Symbol() as InjectionKey<
  ShallowRef<Nullable<Map>> | ComputedRef<Nullable<Map>>
>

export const SourceProvideKey = Symbol() as InjectionKey<
  ShallowRef<Nullable<AnySourceImpl>> | ComputedRef<Nullable<AnySourceImpl>>
>
