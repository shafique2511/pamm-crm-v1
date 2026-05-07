import { describe, expect, it } from 'vitest';
import { Trade } from '../types';
import { mergeTrades, normalizeTrade } from './trades';

const baseTrade: Trade = {
  id: '1',
  ticket: '100',
  openTime: '2026-01-01T00:00:00.000Z',
  closeTime: '2026-01-01T01:00:00.000Z',
  symbol: 'EURUSD',
  type: 'buy',
  volume: 1,
  openPrice: 1.1,
  closePrice: 1.2,
  profit: 100,
};

describe('normalizeTrade', () => {
  it('normalizes valid API trade rows', () => {
    expect(normalizeTrade({ ...baseTrade, symbol: ' xauusd ', type: 'SELL' as unknown as Trade['type'], profit: '25' as unknown as number })).toMatchObject({
      ticket: '100',
      symbol: 'XAUUSD',
      type: 'sell',
      profit: 25,
    });
  });

  it('rejects incomplete or invalid trade rows', () => {
    expect(normalizeTrade({ ...baseTrade, ticket: '' })).toBeNull();
    expect(normalizeTrade({ ...baseTrade, type: 'close' as Trade['type'] })).toBeNull();
  });
});

describe('mergeTrades', () => {
  it('updates existing trades by ticket and keeps newer rows first', () => {
    const merged = mergeTrades(
      [baseTrade],
      [{ ...baseTrade, id: 'replacement', ticket: '100', closeTime: '2026-01-02T01:00:00.000Z', profit: 150 }]
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 'replacement', ticket: '100', profit: 150 });
  });

  it('adds new trades without removing existing journal rows', () => {
    const merged = mergeTrades([baseTrade], [{ ...baseTrade, id: '2', ticket: '200', profit: -50 }]);

    expect(merged.map(t => t.ticket).sort()).toEqual(['100', '200']);
  });
});
