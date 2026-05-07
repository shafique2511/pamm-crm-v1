import { describe, expect, it } from 'vitest';
import { Investor } from '../types';
import { buildIbCommissionLedger, canChangeReferral, generateReferralCode, getTieredIbRate } from './ib';

const investorBase: Investor = {
  id: 'inv-1',
  investorName: 'Investor One',
  highWaterMark: 1000,
  startingCapital: 1000,
  lossCarryover: 0,
  sharePercentage: 0,
  individualProfitShare: 0,
  feePercentage: 30,
  referredBy: 'Prime IB',
  ibCommissionRate: 0,
  yourFee: 100,
  netProfit: 0,
  reinvestAmt: 0,
  cashPayout: 0,
  endingCapital: 1000,
  qrCode: '',
  bankAccount: '',
  feeCollected: 0,
  unpaidFee: 0,
};

describe('IB helpers', () => {
  it('generates stable referral codes from names', () => {
    expect(generateReferralCode('Prime IB 01')).toBe('PRIMEIB0');
  });

  it('returns the correct tiered commission rate', () => {
    expect(getTieredIbRate(1000)).toBe(5);
    expect(getTieredIbRate(50000)).toBe(10);
    expect(getTieredIbRate(250000)).toBe(15);
  });

  it('builds commission ledger entries from manager performance fees', () => {
    const entries = buildIbCommissionLedger([{ ...investorBase, startingCapital: 60000 }]);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      ibName: 'Prime IB',
      investorId: 'inv-1',
      source: 'performance_fee',
      baseAmount: 100,
      commissionRate: 10,
      commissionAmount: 10,
      status: 'approved',
    });
  });

  it('uses custom investor IB rate when provided', () => {
    const entries = buildIbCommissionLedger([{ ...investorBase, ibCommissionRate: 12 }]);

    expect(entries[0].commissionRate).toBe(12);
    expect(entries[0].commissionAmount).toBe(12);
  });

  it('blocks referral changes after capital exists unless admin overrides', () => {
    expect(canChangeReferral(investorBase, 'Other IB', false)).toBe(false);
    expect(canChangeReferral(investorBase, 'Other IB', true)).toBe(true);
    expect(canChangeReferral({ ...investorBase, startingCapital: 0, endingCapital: 0 }, 'Other IB', false)).toBe(true);
  });
});
