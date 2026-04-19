import React, { useRef, useState } from 'react';
import { Investor, PeriodHistory, Transaction, Trade } from '../types';
import { formatCurrency as globalFormatCurrency } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Shield, ArrowRightLeft, Percent, PieChart as PieChartIcon, Download, Loader2, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function InvestorDashboard({ investor, history, transactions, trades = [], onAddTransaction, allowWithdrawals, showTradingJournal }: { investor: Investor, history: PeriodHistory[], transactions: Transaction[], trades?: Trade[], onUpdateInvestor?: (id: string, updates: Partial<Investor>) => void, onAddTransaction?: (t: Partial<Transaction>) => void, allowWithdrawals?: boolean, showTradingJournal?: boolean }) {
  const formatCurrency = (value: number) => globalFormatCurrency(value, investor.baseCurrency);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Prepare chart data
  const chartData = [...history].reverse().map(h => {
    const snap = h.investorSnapshots.find(s => s.investorId === investor.id);
    return {
      date: new Date(h.date).toLocaleDateString(),
      capital: snap ? snap.endingCapital : 0
    };
  });
  
  // Add current
  chartData.push({
    date: 'Current',
    capital: investor.endingCapital
  });

  const myTransactions = transactions.filter(t => t.investorId === investor.id);
  const roi = investor.startingCapital > 0 ? (investor.netProfit / investor.startingCapital) * 100 : 0;
  const distanceToHWM = investor.endingCapital - investor.highWaterMark;

  // Pro-rata trading stats
  const winningTrades = trades.filter(t => t.profit > 0);
  const losingTrades = trades.filter(t => t.profit < 0);
  const systemGrossProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
  const systemGrossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
  const systemProfitFactor = systemGrossLoss > 0 ? (systemGrossProfit / systemGrossLoss) : (systemGrossProfit > 0 ? Infinity : 0);

  const generatePDF = async () => {
    if (!dashboardRef.current) return;
    setIsGeneratingPDF(true);
    
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc, element) => {
          if (element) {
            element.classList.add('pdf-capture');
            element.style.backgroundColor = '#ffffff';
            element.style.padding = '20px';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${investor.investorName.replace(/\s+/g, '_')}_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF statement.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleWithdrawRequestClick = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (amount > investor.endingCapital) {
      alert("Insufficient available capital.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmWithdrawRequest = () => {
    if (!onAddTransaction) return;
    const amount = parseFloat(withdrawAmount);

    onAddTransaction({
      type: 'withdrawal',
      amount,
      investorId: investor.id,
      status: 'pending',
      notes: withdrawNotes || 'Investor Requested Withdrawal',
      date: new Date().toISOString()
    });
    setWithdrawAmount('');
    setWithdrawNotes('');
    setShowConfirmModal(false);
    alert("Withdrawal request submitted successfully. It is now pending manager approval.");
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: { title: string, value: string | React.ReactNode, subtitle?: string | React.ReactNode, icon: any, color: string, trend?: 'up' | 'down' | 'neutral' }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 blur-2xl opacity-20 transition-opacity group-hover:opacity-40
        ${color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'rose' ? 'bg-rose-500' : color === 'amber' ? 'bg-amber-500' : color === 'fuchsia' ? 'bg-fuchsia-500' : 'bg-indigo-500'}`} 
      />
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl 
          ${color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 
            color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 
            color === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 
            color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 
            color === 'fuchsia' ? 'bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400' : 
            'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      </div>
      <div>
        <div className="flex items-end gap-2">
           <h3 className={`text-3xl font-black tracking-tight ${color === 'rose' && trend === 'down' ? 'text-rose-600 dark:text-rose-500' : color === 'emerald' && trend === 'up' ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-900 dark:text-white'}`}>{value}</h3>
           {trend && (
             <span className={`text-xs font-bold mb-1.5 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
               {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
             </span>
           )}
        </div>
        {subtitle && <div className="mt-1">{subtitle}</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500" ref={dashboardRef}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8" data-html2canvas-ignore>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <PieChartIcon className="w-8 h-8 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Portfolio Dashboard</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">Real-time performance metrics and asset growth for {investor.investorName}.</p>
        </div>
        <button 
          onClick={generatePDF}
          disabled={isGeneratingPDF}
          className="group flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-70 transition-all shadow-xl active:scale-95"
        >
          {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />}
          <span className="text-xs font-black uppercase tracking-widest">{isGeneratingPDF ? 'Generating...' : 'Statement PDF'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
           title="Total Capital" 
           value={formatCurrency(investor.endingCapital)} 
           icon={DollarSign} 
           color="blue" 
        />
        <StatCard 
           title="Net Profit" 
           value={formatCurrency(investor.netProfit)} 
           icon={TrendingUp} 
           color={investor.netProfit >= 0 ? "emerald" : "rose"}
           trend={investor.netProfit >= 0 ? "up" : "down"}
        />
        <StatCard 
           title="Return on Investment" 
           value={`${roi > 0 ? '+' : ''}${roi.toFixed(2)}%`} 
           icon={Percent} 
           color="indigo"
           trend={roi >= 0 ? "up" : "down"} 
        />
        <StatCard 
           title="High Water Mark" 
           value={formatCurrency(investor.highWaterMark)} 
           icon={Shield} 
           color="amber"
           subtitle={
             distanceToHWM !== 0 && (
               <span className={`text-[10px] font-bold uppercase tracking-widest ${distanceToHWM > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                 Distance: {distanceToHWM > 0 ? '+' : ''}{formatCurrency(distanceToHWM)}
               </span>
             )
           }
        />
      </div>

      {showTradingJournal && trades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
             title="System Profit Factor" 
             value={systemProfitFactor === Infinity ? '∞' : systemProfitFactor.toFixed(2)} 
             icon={Activity} 
             color="fuchsia"
             trend={systemProfitFactor > 1.2 ? "up" : "down"}
          />
          <StatCard 
             title="System Gross Wins" 
             value={formatCurrency(systemGrossProfit)} 
             icon={ArrowUpRight} 
             color="emerald"
          />
          <StatCard 
             title="System Gross Losses" 
             value={`-${formatCurrency(systemGrossLoss)}`} 
             icon={ArrowDownRight} 
             color="rose"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 ${allowWithdrawals ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Capital Growth History</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(val) => `$${val}`} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={60} />
                <Tooltip 
                  formatter={(val: number) => [formatCurrency(val), 'Capital']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="capital" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCapital)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {allowWithdrawals && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between" data-html2canvas-ignore>
             <div>
                <div className="flex items-center gap-3 mb-6">
                   <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Withdrawal</h3>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-2xl text-xs font-semibold mb-6 flex gap-2">
                   Available to withdraw: <span className="font-mono ml-auto">{formatCurrency(investor.endingCapital)}</span>
                </div>
                
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</label>
                      <input 
                         type="number" 
                         placeholder="0.00" 
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white font-mono"
                         value={withdrawAmount}
                         onChange={e => setWithdrawAmount(e.target.value)}
                         max={investor.endingCapital}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Note (Optional)</label>
                      <input 
                         type="text" 
                         placeholder="e.g. Send to bank ending in 1234" 
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                         value={withdrawNotes}
                         onChange={e => setWithdrawNotes(e.target.value)}
                      />
                   </div>
                </div>
             </div>
             <div>
                <button 
                   onClick={handleWithdrawRequestClick}
                   disabled={!withdrawAmount || Number(withdrawAmount) <= 0}
                   className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                   Submit Request
                </button>
             </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <ArrowRightLeft className="w-5 h-5 text-slate-400" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {myTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-5 text-slate-500 dark:text-slate-400 font-medium">
                     {new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                      ${t.type === 'deposit' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 
                        t.type === 'withdrawal' || t.type === 'manager_withdrawal' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' : 
                        t.type === 'fee_payment' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 
                        'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'}`}>
                      {t.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-slate-200">
                    <span className={t.type === 'withdrawal' || t.type === 'manager_withdrawal' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                       {t.type === 'withdrawal' || t.type === 'manager_withdrawal' ? '-' : '+'}{formatCurrency(t.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest 
                         ${t.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                           t.status === 'rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800' : 
                           'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                         {t.status}
                       </span>
                    </div>
                  </td>
                </tr>
              ))}
              {myTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                     <span className="text-xs font-bold text-slate-400 block pb-2">No transactions recorded</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" data-html2canvas-ignore>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 shadow-xl border border-slate-200 dark:border-slate-800 scale-in-center">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Confirm Withdrawal</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Please carefully review the details of your withdrawal request. This action requires administrative approval.</p>
            
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Amount</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">{formatCurrency(parseFloat(withdrawAmount) || 0)}</span>
              </div>
              <div className="has-divider h-px w-full bg-slate-200 dark:bg-slate-700 border-none"></div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Deduction</span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-500">{formatCurrency(parseFloat(withdrawAmount) || 0)}</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-bold active:scale-95 transition-all text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmWithdrawRequest}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold active:scale-95 transition-all text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
