import { watchEffect, ref } from 'vue';
import type { Nullable, Undefinedable } from '@libs/types';
import type { ShallowRef } from 'vue';
import type { Map, JumpToOptions } from 'maplibre-gl';

export function useJumpTo(
  map: ShallowRef<Nullable<Map>>,
  options?: JumpToOptions,
) {
  const jumpOptions = ref<Undefinedable<JumpToOptions>>(options);

  watchEffect(() => {
    if (map.value && jumpOptions.value) map.value.jumpTo(jumpOptions.value);
  });

  function jumpTo(options?: JumpToOptions) {
    if (options) jumpOptions.value = options;
  }

  return {
    jumpTo,
  };
}
