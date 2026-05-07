import { Trade } from '../types';
import { toFiniteMoney } from './money';

export function normalizeTrade(input: Partial<Trade>): Trade | null {
  const ticket = String(input.ticket || '').trim();
  const symbol = String(input.symbol || '').trim().toUpperCase();
  const openTime = String(input.openTime || '').trim();
  const closeTime = String(input.closeTime || '').trim();
  const rawType = String(input.type || '').toLowerCase();

  if (!ticket || !symbol || !openTime || !closeTime) return null;
  if (rawType !== 'buy' && rawType !== 'sell') return null;

  return {
    id: String(input.id || globalThis.crypto?.randomUUID?.() || ticket),
    ticket,
    openTime,
    closeTime,
    symbol,
    type: rawType,
    volume: toFiniteMoney(input.volume),
    openPrice: toFiniteMoney(input.openPrice),
    closePrice: toFiniteMoney(input.closePrice),
    profit: toFiniteMoney(input.profit),
    sl: input.sl === undefined ? undefined : toFiniteMoney(input.sl),
    tp: input.tp === undefined ? undefined : toFiniteMoney(input.tp),
    entryReason: input.entryReason,
    exitReason: input.exitReason,
    notes: input.notes,
  };
}

export function mergeTrades(existing: Trade[], incoming: Trade[]): Trade[] {
  const byKey = new Map<string, Trade>();

  for (const trade of existing) {
    byKey.set(trade.ticket || trade.id, trade);
  }

  for (const trade of incoming) {
    const key = trade.ticket || trade.id;
    byKey.set(key, { ...byKey.get(key), ...trade });
  }

  return [...byKey.values()].sort((a, b) => {
    const aTime = Date.parse(a.closeTime);
    const bTime = Date.parse(b.closeTime);
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}
