import { roundMoney, toFiniteMoney } from './money';

export function isPeriodReadyForRollover(
  lastDistributedProfit: number | null,
  currentPeriodProfit: number,
  decimals = 2
): boolean {
  if (lastDistributedProfit === null) return false;

  return roundMoney(toFiniteMoney(lastDistributedProfit), decimals) === roundMoney(toFiniteMoney(currentPeriodProfit), decimals);
}
