import React, { useState } from 'react';
import { Trade } from '../types';
import { formatCurrency } from '../lib/utils';
import { RefreshCw, BookOpen, ArrowUpRight, ArrowDownRight, Search, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function JournalView({ trades, onSyncMT5, totalCapital, readOnly }: { trades: Trade[], onSyncMT5: () => Promise<{success: boolean, count: number, error?: string}>, totalCapital: number, readOnly?: boolean }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'win' | 'loss'>('all');
  const [tradeType, setTradeType] = useState<'all' | 'buy' | 'sell'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [profitRange, setProfitRange] = useState<'all' | '>1000' | '>0' | '<0' | '<-1000'>('all');
  const [syncStatus, setSyncStatus] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    const result = await onSyncMT5();
    
    if (result.success) {
      setSyncStatus({ message: `Successfully synced ${result.count} trades.`, type: 'success' });
    } else {
      setSyncStatus({ message: result.error || 'Failed to sync trades.', type: 'error' });
    }
    
    setIsSyncing(false);
    setTimeout(() => setSyncStatus(null), 5000);
  };

  const filteredTrades = trades.filter(t => {
    const matchesSearch = t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || t.ticket.includes(searchTerm);
    const matchesFilter = filterType === 'all' || (filterType === 'win' && t.profit > 0) || (filterType === 'loss' && t.profit <= 0);
    const matchesTradeType = tradeType === 'all' || t.type === tradeType;
    
    let matchesDate = true;
    const tradeDate = new Date(t.closeTime).getTime();
    if (dateFrom) {
      matchesDate = matchesDate && tradeDate >= new Date(dateFrom).getTime();
    }
    if (dateTo) {
      matchesDate = matchesDate && tradeDate <= new Date(dateTo).getTime() + 86400000; // Add 1 day to include end of day
    }

    let matchesProfit = true;
    if (profitRange === '>1000') matchesProfit = t.profit > 1000;
    else if (profitRange === '>0') matchesProfit = t.profit > 0;
    else if (profitRange === '<0') matchesProfit = t.profit < 0;
    else if (profitRange === '<-1000') matchesProfit = t.profit < -1000;

    return matchesSearch && matchesFilter && matchesTradeType && matchesDate && matchesProfit;
  });

  const totalProfit = filteredTrades.reduce((sum, t) => sum + t.profit, 0);
  const winRate = filteredTrades.length > 0 
    ? (filteredTrades.filter(t => t.profit > 0).length / filteredTrades.length) * 100 
    : 0;

  const grossProfit = filteredTrades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0);
  const grossLoss = filteredTrades.filter(t => t.profit < 0).reduce((sum, t) => sum + Math.abs(t.profit), 0);
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : grossProfit > 0 ? Infinity : 0;

  const bestTrade = filteredTrades.length > 0 ? Math.max(...filteredTrades.map(t => t.profit)) : 0;
  const worstTrade = filteredTrades.length > 0 ? Math.min(...filteredTrades.map(t => t.profit)) : 0;
  const roi = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;

  // Prepare cumulative chart data (oldest to newest)
  const chartData = [...filteredTrades].reverse().reduce((acc, trade) => {
    const prevTotal = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    acc.push({
      ticket: trade.ticket,
      date: new Date(trade.closeTime).toLocaleDateString(),
      profit: trade.profit,
      cumulative: prevTotal + trade.profit
    });
    return acc;
  }, [] as any[]);

  // Profit by Symbol
  const profitBySymbol = filteredTrades.reduce((acc, t) => {
    acc[t.symbol] = (acc[t.symbol] || 0) + t.profit;
    return acc;
  }, {} as Record<string, number>);
  const symbolData = Object.entries(profitBySymbol)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Trading Journal
          </h2>
          <p className="text-slate-500 text-sm">Sync and review your MetaTrader 5 history</p>
        </div>
        <div className="flex items-center gap-4">
          {syncStatus && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${syncStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {syncStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {syncStatus.message}
            </div>
          )}
          {!readOnly && (
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing with MT5...' : 'Sync MT5 History'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-500">Total Trades</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{trades.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-500">Win Rate</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{winRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className={`w-4 h-4 ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <p className="text-sm font-medium text-slate-500">ROI (on AUM)</p>
          </div>
          <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{roi.toFixed(2)}%</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-500">Profit Factor</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <p className="text-sm font-medium text-slate-500">Gross Profit</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(grossProfit)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="w-4 h-4 text-red-500" />
            <p className="text-sm font-medium text-slate-500">Gross Loss</p>
          </div>
          <p className="text-2xl font-bold text-red-600">-{formatCurrency(grossLoss)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <p className="text-sm font-medium text-slate-500">Best Trade</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(bestTrade)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="w-4 h-4 text-red-500" />
            <p className="text-sm font-medium text-slate-500">Worst Trade</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(worstTrade)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6 text-slate-900">Cumulative Profit</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis tickFormatter={(val) => `$${val}`} stroke="#64748b" />
                <Tooltip 
                  formatter={(val: number, name: string) => [formatCurrency(val), name === 'cumulative' ? 'Total Profit' : 'Profit']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="stepAfter" dataKey="cumulative" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6 text-slate-900">Top Symbols (Profit)</h3>
          {symbolData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={symbolData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tickFormatter={(val) => `$${val}`} stroke="#64748b" />
                  <YAxis dataKey="name" type="category" stroke="#64748b" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {symbolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-500">
              No symbol data available
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row bg-slate-50 gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search symbol or ticket..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <select 
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">All Profit/Loss</option>
              <option value="win">Winning Trades</option>
              <option value="loss">Losing Trades</option>
            </select>
            <select 
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value as any)}
            >
              <option value="all">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            <select 
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={profitRange}
              onChange={(e) => setProfitRange(e.target.value as any)}
            >
              <option value="all">Any Profit Range</option>
              <option value=">1000">&gt; $1,000</option>
              <option value=">0">&gt; $0</option>
              <option value="<0">&lt; $0</option>
              <option value="<-1000">&lt; -$1,000</option>
            </select>
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                title="From Date"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                title="To Date"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Open Time</th>
                <th className="px-4 py-3">Close Time</th>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Volume</th>
                <th className="px-4 py-3">Open Price</th>
                <th className="px-4 py-3">Close Price</th>
                <th className="px-4 py-3 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTrades.map(t => (
                <React.Fragment key={t.id}>
                  <tr 
                    onClick={() => setExpandedTradeId(expandedTradeId === t.id ? null : t.id)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-400">
                      {expandedTradeId === t.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{t.ticket}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(t.openTime).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(t.closeTime).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{t.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit ${t.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.type === 'buy' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">{t.volume.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono">{t.openPrice.toFixed(5)}</td>
                    <td className="px-4 py-3 font-mono">{t.closePrice.toFixed(5)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${t.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(t.profit)}
                    </td>
                  </tr>
                  {expandedTradeId === t.id && (
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={10} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="block text-xs font-medium text-slate-500 mb-1">Stop Loss (SL)</span>
                            <span className="font-mono text-slate-900">{t.sl ? t.sl.toFixed(5) : 'Not Set'}</span>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="block text-xs font-medium text-slate-500 mb-1">Take Profit (TP)</span>
                            <span className="font-mono text-slate-900">{t.tp ? t.tp.toFixed(5) : 'Not Set'}</span>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="block text-xs font-medium text-slate-500 mb-1">Entry Reason</span>
                            <span className="text-slate-900">{t.entryReason || 'N/A'}</span>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="block text-xs font-medium text-slate-500 mb-1">Exit Reason</span>
                            <span className="text-slate-900">{t.exitReason || 'N/A'}</span>
                          </div>
                          <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white p-3 rounded-lg border border-slate-200">
                            <span className="block text-xs font-medium text-slate-500 mb-1">Trade Notes</span>
                            <span className="text-slate-900">{t.notes || 'No notes available for this trade.'}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    No trades found. Click "Sync MT5 History" to fetch recent trades.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
