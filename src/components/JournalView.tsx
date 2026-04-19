import React, { useState } from 'react';
import { Trade } from '../types';
import { formatCurrency } from '../lib/utils';
import { RefreshCw, BookOpen, ArrowUpRight, ArrowDownRight, Search, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Save, Edit3, Briefcase, Activity, FileText } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function JournalView({ trades, onSyncMT5, onUpdateTrade, totalCapital, readOnly }: { trades: Trade[], onSyncMT5: () => Promise<{success: boolean, count: number, error?: string}>, onUpdateTrade?: (id: string, updates: Partial<Trade>) => void, totalCapital: number, readOnly?: boolean }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'win' | 'loss'>('all');
  const [tradeType, setTradeType] = useState<'all' | 'buy' | 'sell'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [syncStatus, setSyncStatus] = useState<{message: string, type: 'success'|'error'} | null>(null);
  
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trade>>({});

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
    if (dateFrom) matchesDate = matchesDate && tradeDate >= new Date(dateFrom).getTime();
    if (dateTo) matchesDate = matchesDate && tradeDate <= new Date(dateTo).getTime() + 86400000;

    return matchesSearch && matchesFilter && matchesTradeType && matchesDate;
  });

  const totalProfit = filteredTrades.reduce((sum, t) => sum + t.profit, 0);
  const winningTradesCount = filteredTrades.filter(t => t.profit > 0).length;
  const losingTradesCount = filteredTrades.filter(t => t.profit <= 0).length;
  
  const winRate = filteredTrades.length > 0 ? (winningTradesCount / filteredTrades.length) * 100 : 0;
  const grossProfit = filteredTrades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0);
  const grossLoss = filteredTrades.filter(t => t.profit < 0).reduce((sum, t) => sum + Math.abs(t.profit), 0);
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : grossProfit > 0 ? Infinity : 0;

  const avgWin = winningTradesCount > 0 ? grossProfit / winningTradesCount : 0;
  const avgLoss = losingTradesCount > 0 ? grossLoss / losingTradesCount : 0;
  const expectancy = (winRate / 100 * avgWin) - ((1 - (winRate / 100)) * avgLoss);

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

  const toggleExpand = (trade: Trade) => {
    if (expandedTradeId === trade.id) {
      setExpandedTradeId(null);
    } else {
      setExpandedTradeId(trade.id);
      setEditForm({
        entryReason: trade.entryReason || '',
        exitReason: trade.exitReason || '',
        notes: trade.notes || '',
        sl: trade.sl || undefined,
        tp: trade.tp || undefined
      });
    }
  };

  const saveTradeDetails = (id: string) => {
    if (onUpdateTrade) {
      onUpdateTrade(id, editForm);
    }
    setExpandedTradeId(null);
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: string, icon: any, color: string, trend?: 'up' | 'down' | 'neutral' }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 blur-2xl opacity-20 transition-opacity group-hover:opacity-40
        ${color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'rose' ? 'bg-rose-500' : color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'}`} 
      />
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl 
          ${color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 
            color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 
            color === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 
            color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 
            'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      </div>
      <div className="flex items-end gap-2">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
        {trend && (
          <span className={`text-xs font-bold mb-1.5 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            Trading Journal
          </h2>
          <p className="text-slate-400 text-sm">Professional trade tracking, logic auditing, and advanced metrics.</p>
        </div>
        <div className="flex items-center gap-4">
          {syncStatus && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${syncStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
              {syncStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {syncStatus.message}
            </div>
          )}
          {!readOnly && (
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="group flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-70 transition-all shadow-xl active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="text-xs font-black uppercase tracking-widest">{isSyncing ? 'Syncing...' : 'Sync MT5 Data'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Win Rate" value={`${winRate.toFixed(1)}%`} icon={Target} color="blue" trend={winRate > 50 ? 'up' : 'down'} />
        <StatCard title="Profit Factor" value={profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)} icon={Activity} color="emerald" trend={profitFactor > 1.5 ? 'up' : 'down'} />
        <StatCard title="Expectancy" value={formatCurrency(expectancy)} icon={TrendingUp} color="amber" trend={expectancy > 0 ? 'up' : 'down'} />
        <StatCard title="Average Win" value={formatCurrency(avgWin)} icon={ArrowUpRight} color="emerald" />
        <StatCard title="Average Loss" value={`-${formatCurrency(avgLoss)}`} icon={ArrowDownRight} color="rose" />
        <StatCard title="Gross Profit" value={formatCurrency(grossProfit)} icon={TrendingUp} color="emerald" />
        <StatCard title="Gross Loss" value={`-${formatCurrency(grossLoss)}`} icon={TrendingDown} color="rose" />
        <StatCard title="Net P/L" value={formatCurrency(totalProfit)} icon={Briefcase} color={totalProfit >= 0 ? 'emerald' : 'rose'} trend={totalProfit >= 0 ? 'up' : 'down'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Equity Curve (Filtered)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(val) => `$${val}`} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={60} />
                <Tooltip 
                  formatter={(val: number) => [formatCurrency(val), 'Cumulative P/L']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
           <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Quick Controls</h3>
              <div className="space-y-4">
                 <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                       type="text" 
                       placeholder="Search Ticket or Symbol..." 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white font-medium"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <select 
                       className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-medium dark:text-white"
                       value={filterType}
                       onChange={(e) => setFilterType(e.target.value as any)}
                    >
                       <option value="all">All P/L</option>
                       <option value="win">Wins Only</option>
                       <option value="loss">Losses Only</option>
                    </select>
                    <select 
                       className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-medium dark:text-white"
                       value={tradeType}
                       onChange={(e) => setTradeType(e.target.value as any)}
                    >
                       <option value="all">All Types</option>
                       <option value="buy">Buys</option>
                       <option value="sell">Sells</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <input 
                       type="date"
                       value={dateFrom}
                       onChange={(e) => setDateFrom(e.target.value)}
                       className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-medium dark:text-white"
                    />
                    <input 
                       type="date"
                       value={dateTo}
                       onChange={(e) => setDateTo(e.target.value)}
                       className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-medium dark:text-white"
                    />
                 </div>
              </div>
           </div>
           
           <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                 <span className="text-xs font-bold text-slate-500">Filtered Trades:</span>
                 <span className="text-xl font-black text-slate-900 dark:text-white">{filteredTrades.length}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4">Symbol & Ticket</th>
                <th className="px-6 py-4">Open / Close</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Volume</th>
                <th className="px-6 py-4 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTrades.map(t => (
                <React.Fragment key={t.id}>
                  <tr 
                    onClick={() => toggleExpand(t)}
                    className={`cursor-pointer transition-colors ${expandedTradeId === t.id ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}
                  >
                    <td className="px-6 py-5 text-slate-400">
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {expandedTradeId === t.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{t.symbol}</span>
                          <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase">#{t.ticket}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <span>{new Date(t.openTime).toLocaleString()}</span>
                          <span>{new Date(t.closeTime).toLocaleString()}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${t.type === 'buy' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 
                                             'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                        {t.type === 'buy' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-900 dark:text-slate-300">
                      {t.volume.toFixed(2)} Lots
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={`text-sm font-black ${t.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                         {t.profit >= 0 ? '+' : ''}{formatCurrency(t.profit)}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Trade Details & Edit Form */}
                  {expandedTradeId === t.id && (
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800">
                      <td colSpan={6} className="px-8 py-8">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                           <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                              <FileText className="w-5 h-5 text-indigo-500" />
                              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Trade execution logic</h4>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Read Only Stats for context */}
                              <div className="space-y-4">
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Open Price</span>
                                       <span className="font-mono text-lg text-slate-900 dark:text-white block font-medium">{t.openPrice.toFixed(5)}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Close Price</span>
                                       <span className="font-mono text-lg text-slate-900 dark:text-white block font-medium">{t.closePrice.toFixed(5)}</span>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stop Loss (SL)</label>
                                       <input 
                                          type="number" 
                                          title="Stop Loss"
                                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white font-mono"
                                          value={editForm.sl || ''}
                                          onChange={(e) => setEditForm({...editForm, sl: parseFloat(e.target.value)})}
                                          disabled={readOnly}
                                       />
                                    </div>
                                    <div className="space-y-1.5">
                                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Take Profit (TP)</label>
                                       <input 
                                          type="number" 
                                          title="Take Profit"
                                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white font-mono"
                                          value={editForm.tp || ''}
                                          onChange={(e) => setEditForm({...editForm, tp: parseFloat(e.target.value)})}
                                          disabled={readOnly}
                                       />
                                    </div>
                                 </div>
                              </div>

                              {/* Editable Journaling */}
                              <div className="space-y-4">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setup / Entry Reason</label>
                                    <input 
                                       type="text" 
                                       placeholder="e.g. Broken support, MA crossover..."
                                       className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                                       value={editForm.entryReason || ''}
                                       onChange={(e) => setEditForm({...editForm, entryReason: e.target.value})}
                                       disabled={readOnly}
                                    />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exit Context (Why Did You Close?)</label>
                                    <input 
                                       type="text" 
                                       placeholder="e.g. Hit TP, trailed stop, news event..."
                                       className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                                       value={editForm.exitReason || ''}
                                       onChange={(e) => setEditForm({...editForm, exitReason: e.target.value})}
                                       disabled={readOnly}
                                    />
                                 </div>
                              </div>
                           </div>

                           <div className="mt-6 space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrospective Notes (Psychology, Mistakes, Lessons)</label>
                              <textarea 
                                 placeholder="Record your thoughts during this trade, what went wrong, what went right..."
                                 rows={4}
                                 className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white resize-none"
                                 value={editForm.notes || ''}
                                 onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                                 disabled={readOnly}
                              />
                           </div>

                           {!readOnly && (
                              <div className="mt-8 flex justify-end">
                                 <button 
                                    onClick={() => saveTradeDetails(t.id)}
                                    className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                                 >
                                    <Save className="w-4 h-4" />
                                    Save Journal Entry
                                 </button>
                              </div>
                           )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                       <p className="text-sm font-bold text-slate-900 dark:text-white">No Trading Records</p>
                       <p className="text-xs text-slate-500">Sync with MT5 or adjust filters to view trades.</p>
                    </div>
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
