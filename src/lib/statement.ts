import { Investor, Transaction } from '../types';
import { toFiniteMoney } from './money';

export interface StatementPayload {
  statementNumber: string;
  generatedAt: string;
  investor: {
    id: string;
    name: string;
    group: string;
    baseCurrency: string;
  };
  capital: {
    startingCapital: number;
    approvedDeposits: number;
    approvedWithdrawals: number;
    grossPnlAllocation: number;
    performanceFee: number;
    netPnl: number;
    endingCapital: number;
    highWaterMark: number;
    targetReinvestedAmount: number;
    targetCashPayout: number;
    totalFeeCollected: number;
    outstandingFeeBalance: number;
  };
  transactions: Transaction[];
}

export function buildStatementPayload(
  investor: Investor,
  transactions: Transaction[],
  generatedAt = new Date().toISOString()
): StatementPayload {
  const investorTransactions = transactions.filter(t => t.investorId === investor.id);
  const completedTransactions = investorTransactions.filter(t => t.status === 'completed');
  const approvedDeposits = completedTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + toFiniteMoney(t.amount), 0);
  const approvedWithdrawals = completedTransactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + toFiniteMoney(t.amount), 0);

  return {
    statementNumber: `INV-${investor.id.toUpperCase().substring(0, 8)}-${new Date(generatedAt).getTime().toString().slice(-4)}`,
    generatedAt,
    investor: {
      id: investor.id,
      name: investor.investorName,
      group: investor.group || 'Standard',
      baseCurrency: investor.baseCurrency || 'USD',
    },
    capital: {
      startingCapital: toFiniteMoney(investor.startingCapital),
      approvedDeposits,
      approvedWithdrawals,
      grossPnlAllocation: toFiniteMoney(investor.individualProfitShare),
      performanceFee: toFiniteMoney(investor.yourFee),
      netPnl: toFiniteMoney(investor.netProfit),
      endingCapital: toFiniteMoney(investor.endingCapital),
      highWaterMark: toFiniteMoney(investor.highWaterMark),
      targetReinvestedAmount: toFiniteMoney(investor.reinvestAmt),
      targetCashPayout: toFiniteMoney(investor.cashPayout),
      totalFeeCollected: toFiniteMoney(investor.feeCollected),
      outstandingFeeBalance: toFiniteMoney(investor.unpaidFee),
    },
    transactions: investorTransactions,
  };
}
