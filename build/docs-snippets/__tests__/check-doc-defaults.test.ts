import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkDefaults } from '../check-doc-defaults';

const ROOT = resolve(import.meta.dirname, '../../..');
const COMPONENTS =
  /\b(?:Maplibre|GeoJsonSource|FillLayer|CircleLayer|LineLayer|SymbolLayer|Image|Marker|Popup|GeolocateControls)\b/g;

describe('checkDefaults', () => {
  const result = checkDefaults(ROOT, COMPONENTS);

  it('agrees with the reference as it stands', () => {
    expect(result.problems).toEqual([]);
  });

  it('compares most of the column, and says how much it did not', () => {
    // Both numbers are the point. A run that skipped every cell reports exactly
    // what a clean one does, so the check publishes how many claims it settled
    // and how many it could only pass over.
    expect(result.compared).toBeGreaterThan(100);
    expect(result.skipped).toBeLessThan(result.compared / 10);
  });
});
