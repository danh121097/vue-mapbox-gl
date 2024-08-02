import { unref, watchEffect } from 'vue';
import type { Nullable, ImageDatas } from '@libs/types';
import type { ShallowRef } from 'vue';
import type { Map, StyleImageMetadata } from 'maplibre-gl';

interface CreateImageProps {
  map: ShallowRef<Nullable<Map>>;
  id: string;
  image: ImageDatas | string;
  options?: Partial<StyleImageMetadata>;
}

export function useCreateImage(props: CreateImageProps) {
  let resolveFn: (value?: any) => void;
  let rejectFn: (reason?: any) => void;

  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  watchEffect(() => {
    const map = unref(props.map);
    if (map) updateImage(props.image).then(resolveFn).catch(rejectFn);
  });

  async function updateImage(image: ImageDatas | string) {
    const map = unref(props.map);

    if (map) {
      if (typeof image === 'string') {
        try {
          const data = await loadImage(image);

          if (map!.hasImage(props.id)) map!.updateImage(props.id, data);
          else map!.addImage(props.id, data, props.options);
          Promise.resolve();
        } catch (error) {
          Promise.reject(error);
        }
      } else {
        if (map!.hasImage(props.id)) map!.updateImage(props.id, image);
        else map!.addImage(props.id, image, props.options);
        Promise.resolve();
      }
    } else Promise.reject(new Error('Map is not defined'));
  }

  async function loadImage(image: string) {
    const map = unref(props.map);
    return new Promise<HTMLImageElement | ImageBitmap>((resolve, reject) => {
      if (!map) return reject(new Error('Map is not defined'));
      map
        .loadImage(image)
        .then(({ data }) => {
          resolve(data);
        })
        .catch(() => {
          reject(new Error('Failed to load image'));
        });
    });
  }

  function remove() {
    const map = unref(props.map);
    if (map?.hasImage(props.id)) map.removeImage(props.id);
    rejectFn();
  }

  return {
    remove,
    loadImage,
    updateImage,
    loadPromise: promise,
  };
}
