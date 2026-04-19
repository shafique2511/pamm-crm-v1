import React, { useState } from 'react';
import { Investor, Transaction, Trade, PeriodHistory } from '../types';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, DollarSign, Users, AlertCircle, Wallet, Percent, Award, Activity, Target, TrendingDown, ArrowRight, Clock } from 'lucide-react';

interface DashboardStatsProps {
  investors: Investor[];
  transactions: Transaction[];
  trades?: Trade[];
  history?: PeriodHistory[];
  isAdmin: boolean;
  onAddTransaction?: (t: Partial<Transaction>) => void;
  brokerBalance?: number;
}

export function DashboardStats({ investors, transactions, trades = [], history = [], isAdmin, onAddTransaction, brokerBalance }: DashboardStatsProps) {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');

  const totalCapital = investors.reduce((sum, inv) => sum + inv.startingCapital, 0);
  const totalEndingCapital = investors.reduce((sum, inv) => sum + inv.endingCapital, 0);
  const totalUnpaidFees = investors.reduce((sum, inv) => sum + (inv.unpaidFee || 0) + (inv.yourFee || 0), 0);
  const totalInvestors = investors.length;

  const managerWithdrawalTxs = transactions.filter(t => t.type === 'manager_withdrawal');
  const investorWithdrawalTxs = transactions.filter(t => t.type === 'withdrawal');
  const managerWithdrawals = managerWithdrawalTxs.reduce((sum, t) => sum + t.amount, 0);
  const managerWalletBalance = investors.reduce((sum, inv) => sum + inv.feeCollected, 0) - managerWithdrawals;

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (amount > managerWalletBalance) {
      alert("Insufficient manager wallet balance.");
      return;
    }
    if (onAddTransaction) {
      onAddTransaction({
        type: 'manager_withdrawal',
        amount,
        date: new Date().toISOString(),
        status: 'completed',
        notes: withdrawNotes || 'Dashboard Withdrawal',
        referenceId: `TX-MGR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        method: 'Internal Transfer',
        category: 'Internal'
      });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawNotes('');
    }
  };

  // New Professional Metrics
  const totalProfitGenerated = investors.reduce((sum, inv) => sum + (inv.individualProfitShare || 0), 0);
  
  const activeInvestorsWithCapital = investors.filter(inv => inv.startingCapital > 0);
  const averageROI = activeInvestorsWithCapital.length > 0 
    ? activeInvestorsWithCapital.reduce((sum, inv) => sum + ((inv.netProfit / inv.startingCapital) * 100), 0) / activeInvestorsWithCapital.length 
    : 0;

  const highestPerformingInvestor = [...investors].sort((a, b) => b.netProfit - a.netProfit)[0];
  const highestPerformerText = highestPerformingInvestor && highestPerformingInvestor.netProfit > 0 
    ? `${highestPerformingInvestor.investorName} (${formatCurrency(highestPerformingInvestor.netProfit)})`
    : 'N/A';

  // Advanced Trading Analytics
  const winningTrades = trades.filter(t => t.profit > 0);
  const losingTrades = trades.filter(t => t.profit < 0);
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 999 : 0);

  // Approximate Max Drawdown from Period History
  let peak = 0;
  let maxDrawdown = 0;
  let currentCapital = 0;
  
  const capitalHistory = history.map(h => h.investorSnapshots.reduce((sum, s) => sum + s.endingCapital, 0));
  capitalHistory.push(totalEndingCapital); // Include current state

  capitalHistory.forEach(cap => {
    if (cap > peak) peak = cap;
    const drawdown = peak > 0 ? ((peak - cap) / peak) * 100 : 0;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  const stats = [
    {
      title: "Broker Balance",
      value: formatCurrency(brokerBalance || 0),
      icon: Wallet,
      color: "text-teal-600",
      bg: "bg-teal-100",
      show: isAdmin && (brokerBalance || 0) > 0
    },
    {
      title: "Total Starting Capital",
      value: formatCurrency(totalCapital),
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-100",
      show: true
    },
    {
      title: "Total Ending Capital",
      value: formatCurrency(totalEndingCapital),
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100",
      show: true
    },
    {
      title: "Period Profit Generated",
      value: formatCurrency(totalProfitGenerated),
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      show: isAdmin
    },
    {
      title: "Average Investor ROI",
      value: `${averageROI.toFixed(2)}%`,
      icon: Percent,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      show: isAdmin
    },
    {
      title: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: "text-cyan-600",
      bg: "bg-cyan-100",
      show: isAdmin && trades.length > 0
    },
    {
      title: "Profit Factor",
      value: profitFactor === 999 ? '∞' : profitFactor.toFixed(2),
      icon: TrendingUp,
      color: "text-fuchsia-600",
      bg: "bg-fuchsia-100",
      show: isAdmin && trades.length > 0
    },
    {
      title: "Gross Profit",
      value: formatCurrency(grossProfit),
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100",
      show: isAdmin && trades.length > 0
    },
    {
      title: "Gross Loss",
      value: `-${formatCurrency(grossLoss)}`,
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-100",
      show: isAdmin && trades.length > 0
    },
    {
      title: "Max Drawdown",
      value: `${maxDrawdown.toFixed(2)}%`,
      icon: TrendingDown,
      color: "text-rose-600",
      bg: "bg-rose-100",
      show: isAdmin && history.length > 0
    },
    {
      title: "Top Performer",
      value: highestPerformerText,
      icon: Award,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      show: isAdmin
    },
    {
      title: "Total Unpaid Fees",
      value: formatCurrency(totalUnpaidFees),
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-100",
      show: isAdmin
    },
    {
      title: "Active Investors",
      value: totalInvestors.toString(),
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100",
      show: isAdmin
    }
  ].filter(s => s.show);

  return (
    <div className="space-y-6 mb-8">
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center border border-teal-500/30">
              <Wallet className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Manager Wallet Balance</p>
              <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(managerWalletBalance)}</h2>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Withdraw Earnings
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-colors">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stat.bg} dark:bg-opacity-20`}>
                <Icon className={`w-6 h-6 ${stat.color} dark:brightness-150`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap truncate">{stat.title}</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate" title={stat.value}>{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && managerWithdrawalTxs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Recent Manager Withdrawals
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Notes</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {managerWithdrawalTxs.slice(0, 5).map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{tx.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{tx.notes || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && investorWithdrawalTxs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              Recent Investor Withdrawals
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Investor</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {[...investorWithdrawalTxs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(tx => {
                  const investor = investors.find(i => i.id === tx.investorId);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {investor?.investorName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">
                        -{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                          ${tx.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                          tx.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                          {tx.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Withdraw Manager Earnings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Available Balance: <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(managerWalletBalance)}</span>
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount to Withdraw ($)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-900 dark:text-white"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  max={managerWalletBalance}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-900 dark:text-white"
                  value={withdrawNotes}
                  onChange={e => setWithdrawNotes(e.target.value)}
                  placeholder="e.g. Monthly payout to bank"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleWithdraw}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
