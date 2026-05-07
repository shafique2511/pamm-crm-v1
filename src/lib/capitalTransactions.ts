import { Investor, Transaction } from '../types';
import { toFiniteMoney } from './money';

export function applyCompletedCapitalTransaction(
  investor: Investor,
  transaction: Pick<Transaction, 'type' | 'amount' | 'status'>
): Partial<Investor> | null {
  if (transaction.status !== 'completed') return null;

  const amount = toFiniteMoney(transaction.amount);
  if (amount <= 0) return null;

  const startingCapital = toFiniteMoney(investor.startingCapital);
  const endingCapital = toFiniteMoney(investor.endingCapital);
  const highWaterMark = toFiniteMoney(investor.highWaterMark);

  if (transaction.type === 'deposit') {
    return {
      startingCapital: startingCapital + amount,
      endingCapital: endingCapital + amount,
      highWaterMark: highWaterMark + amount,
    };
  }

  if (transaction.type === 'withdrawal') {
    return {
      startingCapital: Math.max(0, startingCapital - amount),
      endingCapital: endingCapital - amount,
      cashPayout: toFiniteMoney(investor.cashPayout) + amount,
      highWaterMark: Math.max(0, highWaterMark - amount),
    };
  }

  return null;
}
