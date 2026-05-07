import { IBCommissionLedgerEntry, IBCommissionTier, Investor, PeriodHistory } from '../types';
import { roundMoney, toFiniteMoney } from './money';

export const DEFAULT_IB_COMMISSION_TIERS: IBCommissionTier[] = [
  { minReferredCapital: 0, maxReferredCapital: 50000, commissionRate: 5 },
  { minReferredCapital: 50000, maxReferredCapital: 250000, commissionRate: 10 },
  { minReferredCapital: 250000, maxReferredCapital: null, commissionRate: 15 },
];

export function generateReferralCode(name: string): string {
  const cleaned = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  return cleaned || 'IB';
}

export function getTieredIbRate(referredCapital: number, tiers: IBCommissionTier[] = DEFAULT_IB_COMMISSION_TIERS): number {
  const capital = toFiniteMoney(referredCapital);
  const tier = tiers.find(tier => {
    const min = toFiniteMoney(tier.minReferredCapital);
    const max = tier.maxReferredCapital === null ? Infinity : toFiniteMoney(tier.maxReferredCapital);
    return capital >= min && capital < max;
  });

  return tier ? toFiniteMoney(tier.commissionRate) : 0;
}

export function buildIbCommissionLedger(
  investors: Investor[],
  periods: PeriodHistory[] = [],
  tiers: IBCommissionTier[] = DEFAULT_IB_COMMISSION_TIERS
): IBCommissionLedgerEntry[] {
  const referredCapitalByIb = new Map<string, number>();

  for (const investor of investors) {
    const ibName = investor.referredBy?.trim();
    if (!ibName) continue;
    referredCapitalByIb.set(ibName, (referredCapitalByIb.get(ibName) || 0) + toFiniteMoney(investor.startingCapital));
  }

  const currentPeriodId = periods[0]?.id || 'current-period';
  const currentPeriodDate = periods[0]?.date || new Date().toISOString();

  return investors.flatMap(investor => {
    const ibName = investor.referredBy?.trim();
    if (!ibName) return [];

    const baseAmount = toFiniteMoney(investor.yourFee);
    if (baseAmount <= 0) return [];

    const tierRate = getTieredIbRate(referredCapitalByIb.get(ibName) || 0, tiers);
    const commissionRate = toFiniteMoney(investor.ibCommissionRate) > 0 ? toFiniteMoney(investor.ibCommissionRate) : tierRate;
    const commissionAmount = roundMoney(baseAmount * (commissionRate / 100));

    if (commissionAmount <= 0) return [];

    return [{
      id: `${currentPeriodId}:${investor.id}:${generateReferralCode(ibName)}`,
      ibId: generateReferralCode(ibName),
      ibName,
      investorId: investor.id,
      investorName: investor.investorName,
      periodId: currentPeriodId,
      source: 'performance_fee' as const,
      baseAmount,
      commissionRate,
      commissionAmount,
      status: 'approved' as const,
      createdAt: currentPeriodDate,
    }];
  });
}

export function canChangeReferral(investor: Investor, nextReferredBy: string, isAdminOverride: boolean): boolean {
  const current = investor.referredBy?.trim();
  const next = nextReferredBy.trim();
  const hasApprovedCapital = toFiniteMoney(investor.startingCapital) > 0 || toFiniteMoney(investor.endingCapital) > 0;

  if (!current || current === next) return true;
  if (!hasApprovedCapital) return true;

  return isAdminOverride;
}
