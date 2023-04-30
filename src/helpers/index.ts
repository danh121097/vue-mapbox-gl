import { Map } from 'maplibre-gl';
import { MapAsset } from '@types';

export function loadImageToMap(map: Map, asset: MapAsset) {
  return new Promise((resolve, reject) => {
    map.loadImage(asset.path, (error, image) => {
      if (error) reject(error);
      if (image) map.addImage(asset.name, image);
      resolve(image);
    });
  });
}

export async function loadAssets(map: Map, assets: MapAsset[]) {
  const loadImagesPromise = assets.map((asset) => loadImageToMap(map, asset));
  await Promise.all(loadImagesPromise);
}
