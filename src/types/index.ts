import type { LayerSpecification, SourceSpecification } from 'maplibre-gl';

export interface MapAsset {
  path: string;
  name: string;
}

export type LayerOptions = {
  sourceId: string;
  source: SourceSpecification;
  before?: string;
};

export type LayerConfig = LayerOptions & LayerSpecification;
