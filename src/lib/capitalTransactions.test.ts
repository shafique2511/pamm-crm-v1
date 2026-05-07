import { describe, expect, it } from 'vitest';
import { Investor, Transaction } from '../types';
import { applyCompletedCapitalTransaction } from './capitalTransactions';

const investor: Investor = {
  id: 'inv-1',
  investorName: 'Investor One',
  highWaterMark: 1200,
  startingCapital: 1000,
  lossCarryover: 0,
  sharePercentage: 0,
  individualProfitShare: 0,
  feePercentage: 30,
  yourFee: 0,
  netProfit: 0,
  reinvestAmt: 0,
  cashPayout: 0,
  endingCapital: 1000,
  qrCode: '',
  bankAccount: '',
  feeCollected: 0,
  unpaidFee: 0,
};

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx-1',
    type: 'deposit',
    amount: 0,
    date: new Date().toISOString(),
    status: 'completed',
    ...overrides,
  };
}

describe('applyCompletedCapitalTransaction', () => {
  it('applies completed deposits to current capital and HWM', () => {
    expect(applyCompletedCapitalTransaction(investor, tx({ type: 'deposit', amount: 500 }))).toEqual({
      startingCapital: 1500,
      endingCapital: 1500,
      highWaterMark: 1700,
    });
  });

  it('applies completed withdrawals to capital and cash payout', () => {
    expect(applyCompletedCapitalTransaction(investor, tx({ type: 'withdrawal', amount: 300 }))).toEqual({
      startingCapital: 700,
      endingCapital: 700,
      cashPayout: 300,
      highWaterMark: 900,
    });
  });

  it('ignores pending and rejected transactions', () => {
    expect(applyCompletedCapitalTransaction(investor, tx({ type: 'deposit', amount: 500, status: 'pending' }))).toBeNull();
    expect(applyCompletedCapitalTransaction(investor, tx({ type: 'withdrawal', amount: 500, status: 'rejected' }))).toBeNull();
  });

  it('ignores manager and fee-payment transactions for investor capital', () => {
    expect(applyCompletedCapitalTransaction(investor, tx({ type: 'fee_payment', amount: 100 }))).toBeNull();
    expect(applyCompletedCapitalTransaction(investor, tx({ type: 'manager_withdrawal', amount: 100 }))).toBeNull();
  });
});
