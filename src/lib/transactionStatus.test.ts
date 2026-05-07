import { describe, expect, it } from 'vitest';
import { Investor, Transaction } from '../types';
import { getCapitalUpdatesForStatusTransition } from './transactionStatus';

const investor: Investor = {
  id: 'inv-1',
  investorName: 'Investor One',
  highWaterMark: 1000,
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
    investorId: investor.id,
    type: 'deposit',
    amount: 0,
    date: new Date().toISOString(),
    status: 'pending',
    ...overrides,
  };
}

describe('getCapitalUpdatesForStatusTransition', () => {
  it('applies pending deposit approval to investor capital', () => {
    expect(getCapitalUpdatesForStatusTransition(investor, tx({ type: 'deposit', amount: 500 }), 'completed')).toEqual({
      startingCapital: 1500,
      endingCapital: 1500,
      highWaterMark: 1500,
    });
  });

  it('applies pending withdrawal approval to investor capital', () => {
    expect(getCapitalUpdatesForStatusTransition(investor, tx({ type: 'withdrawal', amount: 250 }), 'completed')).toEqual({
      startingCapital: 750,
      endingCapital: 750,
      cashPayout: 250,
      highWaterMark: 750,
    });
  });

  it('does not apply rejected pending transactions', () => {
    expect(getCapitalUpdatesForStatusTransition(investor, tx({ type: 'deposit', amount: 500 }), 'rejected')).toBeNull();
  });

  it('does not reapply transactions that were already completed', () => {
    expect(getCapitalUpdatesForStatusTransition(
      investor,
      tx({ type: 'deposit', amount: 500, status: 'completed' }),
      'completed',
      'completed'
    )).toBeNull();
  });

  it('ignores non-capital transaction types', () => {
    expect(getCapitalUpdatesForStatusTransition(investor, tx({ type: 'manager_withdrawal', amount: 500 }), 'completed')).toBeNull();
    expect(getCapitalUpdatesForStatusTransition(investor, tx({ type: 'fee_payment', amount: 500 }), 'completed')).toBeNull();
  });
});
