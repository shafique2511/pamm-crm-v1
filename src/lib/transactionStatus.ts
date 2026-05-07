import { Investor, Transaction } from '../types';
import { applyCompletedCapitalTransaction } from './capitalTransactions';

export function getCapitalUpdatesForStatusTransition(
  investor: Investor,
  transaction: Transaction,
  nextStatus: Transaction['status'],
  previousStatus: Transaction['status'] = transaction.status
): Partial<Investor> | null {
  if (previousStatus !== 'pending' || nextStatus !== 'completed') {
    return null;
  }

  if (transaction.type !== 'deposit' && transaction.type !== 'withdrawal') {
    return null;
  }

  return applyCompletedCapitalTransaction(investor, {
    ...transaction,
    status: nextStatus,
  });
}
