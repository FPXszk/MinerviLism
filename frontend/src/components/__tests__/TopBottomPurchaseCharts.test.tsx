import { describe, it, expect } from 'vitest';
import { calculateSymbolSize } from '../TopBottomPurchaseCharts';

describe('calculateSymbolSize', () => {
  it('returns a minimum size for non-positive or invalid amounts', () => {
    expect(calculateSymbolSize(0)).toBeGreaterThan(0);
    expect(calculateSymbolSize(-10)).toBeGreaterThan(0);
    expect(calculateSymbolSize(NaN)).toBeGreaterThan(0);
  });

  it('scales with sqrt', () => {
    const a = calculateSymbolSize(100);
    const b = calculateSymbolSize(400);
    expect(b).toBeGreaterThan(a);
  });
});
