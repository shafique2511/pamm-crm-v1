import { roundMoney, toFiniteMoney } from './money';

export interface SimplePammInvestorInput {
  investorId: string;
  startingCapital: number;
  previousHighWaterMark: number;
  performanceFeePercent: number;
  isActive?: boolean;
}

export interface SimplePammInvestorResult {
  investorId: string;
  startingCapital: number;
  investorShare: number;
  grossPnl: number;
  performanceFee: number;
  netPnl: number;
  endingCapitalBeforeFee: number;
  endingCapitalAfterFee: number;
  previousHighWaterMark: number;
  newHighWaterMark: number;
  roundingAdjustment: number;
}

export interface SimplePammDistributionResult {
  totalStartingCapital: number;
  grossPnl: number;
  managerWalletIncrease: number;
  investors: SimplePammInvestorResult[];
}

export function calculateSimplePammDistribution(
  grossPnlInput: number,
  investors: SimplePammInvestorInput[],
  decimals = 2
): SimplePammDistributionResult {
  const grossPnl = toFiniteMoney(grossPnlInput);
  const normalized = investors.map(i => ({
    ...i,
    startingCapital: Math.max(0, toFiniteMoney(i.startingCapital)),
    previousHighWaterMark: Math.max(0, toFiniteMoney(i.previousHighWaterMark)),
    performanceFeePercent: Math.max(0, toFiniteMoney(i.performanceFeePercent)),
    isActive: i.isActive !== false,
  }));

  const allocatable = normalized.filter(i => i.isActive && i.startingCapital > 0);
  const totalStartingCapital = roundMoney(
    allocatable.reduce((sum, i) => sum + i.startingCapital, 0),
    decimals
  );

  if (totalStartingCapital <= 0) {
    return {
      totalStartingCapital: 0,
      grossPnl,
      managerWalletIncrease: 0,
      investors: normalized.map(i => ({
        investorId: i.investorId,
        startingCapital: i.startingCapital,
        investorShare: 0,
        grossPnl: 0,
        performanceFee: 0,
        netPnl: 0,
        endingCapitalBeforeFee: i.startingCapital,
        endingCapitalAfterFee: i.startingCapital,
        previousHighWaterMark: i.previousHighWaterMark,
        newHighWaterMark: i.previousHighWaterMark,
        roundingAdjustment: 0,
      })),
    };
  }

  let results = normalized.map(i => {
    const investorShare = i.isActive && i.startingCapital > 0 ? i.startingCapital / totalStartingCapital : 0;
    const allocatedGrossPnl = roundMoney(grossPnl * investorShare, decimals);
    const endingCapitalBeforeFee = roundMoney(i.startingCapital + allocatedGrossPnl, decimals);
    const profitAboveHwm = Math.max(0, endingCapitalBeforeFee - i.previousHighWaterMark);
    const performanceFee = roundMoney(profitAboveHwm * i.performanceFeePercent, decimals);
    const netPnl = roundMoney(allocatedGrossPnl - performanceFee, decimals);
    const endingCapitalAfterFee = roundMoney(endingCapitalBeforeFee - performanceFee, decimals);
    const newHighWaterMark = Math.max(i.previousHighWaterMark, endingCapitalAfterFee);

    return {
      investorId: i.investorId,
      startingCapital: i.startingCapital,
      investorShare,
      grossPnl: allocatedGrossPnl,
      performanceFee,
      netPnl,
      endingCapitalBeforeFee,
      endingCapitalAfterFee,
      previousHighWaterMark: i.previousHighWaterMark,
      newHighWaterMark,
      roundingAdjustment: 0,
    };
  });

  const allocatedGross = roundMoney(results.reduce((sum, r) => sum + r.grossPnl, 0), decimals);
  const remainder = roundMoney(grossPnl - allocatedGross, decimals);

  if (remainder !== 0) {
    const largestIndex = results.reduce((bestIndex, current, index, all) => {
      return current.startingCapital > all[bestIndex].startingCapital ? index : bestIndex;
    }, 0);
    const target = results[largestIndex];
    const adjustedGrossPnl = roundMoney(target.grossPnl + remainder, decimals);
    const adjustedEndingBeforeFee = roundMoney(target.startingCapital + adjustedGrossPnl, decimals);
    const adjustedProfitAboveHwm = Math.max(0, adjustedEndingBeforeFee - target.previousHighWaterMark);
    const input = normalized.find(i => i.investorId === target.investorId);
    const adjustedFee = roundMoney(adjustedProfitAboveHwm * (input?.performanceFeePercent ?? 0), decimals);
    const adjustedEndingAfterFee = roundMoney(adjustedEndingBeforeFee - adjustedFee, decimals);

    results = results.map((r, index) => index === largestIndex ? {
      ...r,
      grossPnl: adjustedGrossPnl,
      performanceFee: adjustedFee,
      netPnl: roundMoney(adjustedGrossPnl - adjustedFee, decimals),
      endingCapitalBeforeFee: adjustedEndingBeforeFee,
      endingCapitalAfterFee: adjustedEndingAfterFee,
      newHighWaterMark: Math.max(r.previousHighWaterMark, adjustedEndingAfterFee),
      roundingAdjustment: remainder,
    } : r);
  }

  return {
    totalStartingCapital,
    grossPnl,
    managerWalletIncrease: roundMoney(results.reduce((sum, r) => sum + r.performanceFee, 0), decimals),
    investors: results,
  };
}
