import { computed, effectScope, ref, shallowRef, unref, watch } from 'vue';
import type { ComputedRef, EffectScope } from 'vue';
import type { CreateGeoJsonSourceActions } from '@libs/composables';
import type { GeoJSONSource, GeoJSONSourceSpecification } from 'maplibre-gl';
import type { Nullable } from '@libs/types';

interface Methods {
  sourceId: ComputedRef<string | undefined>;
  getSource: ComputedRef<Nullable<GeoJSONSource>>;
  setData: (data: GeoJSONSourceSpecification['data']) => void;
}

export function useGeoJsonSource() {
  const instanceRef = ref<CreateGeoJsonSourceActions>();
  const loadedRef = ref<boolean>(false);

  const sourceRef = shallowRef<Nullable<GeoJSONSource>>(null);
  const sourceIdRef = ref<string>();

  let watchScope: EffectScope;

  let componentMethods: CreateGeoJsonSourceActions;

  function register(instance: CreateGeoJsonSourceActions) {
    if (unref(loadedRef) && instance === unref(instanceRef)) return;

    instanceRef.value = instance;

    loadedRef.value = true;

    watchScope?.stop();

    watchScope = effectScope();
    watchScope.run(() => {
      watch(
        () => instance.getSource.value,
        (source) => {
          sourceRef.value = source;
          sourceIdRef.value = instance.sourceId;
        },
        {
          immediate: true,
        },
      );
    });
  }

  const methods: Methods = {
    sourceId: computed(() => sourceIdRef.value),
    getSource: computed(() => sourceRef.value),
    setData: (data: GeoJSONSourceSpecification['data']) => {
      componentMethods.setData?.(data);
    },
  };

  return {
    register,
    ...methods,
  };
}
