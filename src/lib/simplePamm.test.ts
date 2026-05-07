import { describe, expect, it } from 'vitest';
import { calculateSimplePammDistribution } from './simplePamm';

describe('calculateSimplePammDistribution', () => {
  it('case 1: one investor profit', () => {
    const result = calculateSimplePammDistribution(100, [
      { investorId: 'a', startingCapital: 1000, previousHighWaterMark: 1000, performanceFeePercent: 0.3 },
    ]);

    expect(result.managerWalletIncrease).toBe(30);
    expect(result.investors[0].grossPnl).toBe(100);
    expect(result.investors[0].performanceFee).toBe(30);
    expect(result.investors[0].netPnl).toBe(70);
    expect(result.investors[0].endingCapitalAfterFee).toBe(1070);
  });

  it('case 2: two equal investors', () => {
    const result = calculateSimplePammDistribution(200, [
      { investorId: 'a', startingCapital: 1000, previousHighWaterMark: 1000, performanceFeePercent: 0.3 },
      { investorId: 'b', startingCapital: 1000, previousHighWaterMark: 1000, performanceFeePercent: 0.3 },
    ]);

    expect(result.managerWalletIncrease).toBe(60);
    expect(result.investors[0].grossPnl).toBe(100);
    expect(result.investors[1].grossPnl).toBe(100);
  });

  it('case 3: unequal investors', () => {
    const result = calculateSimplePammDistribution(400, [
      { investorId: 'a', startingCapital: 3000, previousHighWaterMark: 3000, performanceFeePercent: 0.3 },
      { investorId: 'b', startingCapital: 1000, previousHighWaterMark: 1000, performanceFeePercent: 0.3 },
    ]);

    expect(result.investors[0].investorShare).toBe(0.75);
    expect(result.investors[0].grossPnl).toBe(300);
    expect(result.investors[0].performanceFee).toBe(90);
    expect(result.investors[0].endingCapitalAfterFee).toBe(3210);
    expect(result.managerWalletIncrease).toBe(120);
  });

  it('case 4: loss charges no fee', () => {
    const result = calculateSimplePammDistribution(-400, [
      { investorId: 'a', startingCapital: 3000, previousHighWaterMark: 3000, performanceFeePercent: 0.3 },
      { investorId: 'b', startingCapital: 1000, previousHighWaterMark: 1000, performanceFeePercent: 0.3 },
    ]);

    expect(result.managerWalletIncrease).toBe(0);
    expect(result.investors[0].grossPnl).toBe(-300);
    expect(result.investors[1].grossPnl).toBe(-100);
  });

  it('case 5: recovery below HWM charges no fee', () => {
    const result = calculateSimplePammDistribution(150, [
      { investorId: 'a', startingCapital: 1000, previousHighWaterMark: 1200, performanceFeePercent: 0.3 },
    ]);

    expect(result.investors[0].endingCapitalBeforeFee).toBe(1150);
    expect(result.investors[0].performanceFee).toBe(0);
    expect(result.investors[0].newHighWaterMark).toBe(1200);
  });

  it('case 6: fee only above HWM', () => {
    const result = calculateSimplePammDistribution(300, [
      { investorId: 'a', startingCapital: 1000, previousHighWaterMark: 1200, performanceFeePercent: 0.3 },
    ]);

    expect(result.investors[0].endingCapitalBeforeFee).toBe(1300);
    expect(result.investors[0].performanceFee).toBe(30);
    expect(result.investors[0].endingCapitalAfterFee).toBe(1270);
    expect(result.investors[0].newHighWaterMark).toBe(1270);
  });

  it('case 10: zero AUM does not divide by zero', () => {
    const result = calculateSimplePammDistribution(100, [
      { investorId: 'a', startingCapital: 0, previousHighWaterMark: 0, performanceFeePercent: 0.3 },
    ]);

    expect(result.totalStartingCapital).toBe(0);
    expect(result.managerWalletIncrease).toBe(0);
    expect(result.investors[0].investorShare).toBe(0);
  });

  it('case 11: assigns rounding remainder to largest investor', () => {
    const result = calculateSimplePammDistribution(100, [
      { investorId: 'a', startingCapital: 1, previousHighWaterMark: 1, performanceFeePercent: 0 },
      { investorId: 'b', startingCapital: 1, previousHighWaterMark: 1, performanceFeePercent: 0 },
      { investorId: 'c', startingCapital: 1, previousHighWaterMark: 1, performanceFeePercent: 0 },
    ]);

    expect(result.investors.reduce((sum, r) => sum + r.grossPnl, 0)).toBeCloseTo(100, 2);
    expect(result.investors.find(r => r.investorId === 'a')?.roundingAdjustment).not.toBe(0);
  });
});
