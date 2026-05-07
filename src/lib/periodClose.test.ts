import { describe, expect, it } from 'vitest';
import { isPeriodReadyForRollover } from './periodClose';

describe('isPeriodReadyForRollover', () => {
  it('blocks rollover before any distribution calculation has run', () => {
    expect(isPeriodReadyForRollover(null, 100)).toBe(false);
  });

  it('allows rollover when current profit matches the last distributed profit', () => {
    expect(isPeriodReadyForRollover(100, 100)).toBe(true);
  });

  it('blocks rollover when profit changed after distribution', () => {
    expect(isPeriodReadyForRollover(100, 125)).toBe(false);
  });

  it('compares rounded money values', () => {
    expect(isPeriodReadyForRollover(100.004, 100)).toBe(true);
    expect(isPeriodReadyForRollover(100.01, 100)).toBe(false);
  });
});
