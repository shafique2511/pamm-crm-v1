import { describe, expect, it } from 'vitest';
import { Investor, Transaction } from '../types';
import { buildStatementPayload } from './statement';

const investor: Investor = {
  id: 'abcdef12-0000-0000-0000-000000000000',
  investorName: 'Investor One',
  highWaterMark: 1070,
  startingCapital: 1000,
  lossCarryover: 0,
  sharePercentage: 100,
  individualProfitShare: 100,
  feePercentage: 30,
  yourFee: 30,
  netProfit: 70,
  reinvestAmt: 70,
  cashPayout: 0,
  endingCapital: 1070,
  qrCode: '',
  bankAccount: '',
  feeCollected: 30,
  unpaidFee: 0,
};

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    investorId: investor.id,
    type: 'deposit',
    amount: 0,
    date: '2026-05-01T00:00:00.000Z',
    status: 'completed',
    ...overrides,
  };
}

describe('buildStatementPayload', () => {
  it('includes only completed deposits and withdrawals in approved totals', () => {
    const payload = buildStatementPayload(investor, [
      tx({ type: 'deposit', amount: 500, status: 'completed' }),
      tx({ type: 'deposit', amount: 1000, status: 'pending' }),
      tx({ type: 'withdrawal', amount: 200, status: 'completed' }),
      tx({ type: 'withdrawal', amount: 300, status: 'rejected' }),
    ], '2026-05-07T00:00:00.000Z');

    expect(payload.capital.approvedDeposits).toBe(500);
    expect(payload.capital.approvedWithdrawals).toBe(200);
    expect(payload.capital.netPnl).toBe(70);
    expect(payload.capital.performanceFee).toBe(30);
  });

  it('excludes other investors from statement transactions', () => {
    const payload = buildStatementPayload(investor, [
      tx({ amount: 500 }),
      tx({ investorId: 'other', amount: 999 }),
    ]);

    expect(payload.transactions).toHaveLength(1);
    expect(payload.capital.approvedDeposits).toBe(500);
  });
});
