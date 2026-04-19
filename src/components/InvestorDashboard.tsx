import React, { useRef, useState } from 'react';
import { Investor, PeriodHistory, Transaction, Trade } from '../types';
import { formatCurrency as globalFormatCurrency, evaluatePasswordStrength, hashPassword } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Shield, ArrowRightLeft, Percent, AlertCircle, CheckCircle2, PieChart as PieChartIcon, Download, Loader2, Key } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function InvestorDashboard({ investor, history, transactions, trades = [], onUpdateInvestor, onAddTransaction, allowWithdrawals }: { investor: Investor, history: PeriodHistory[], transactions: Transaction[], trades?: Trade[], onUpdateInvestor?: (id: string, updates: Partial<Investor>) => void, onAddTransaction?: (t: Partial<Transaction>) => void, allowWithdrawals?: boolean }) {
  const formatCurrency = (value: number) => globalFormatCurrency(value, investor.baseCurrency);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
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

  // Profit Breakdown Data
  const profitBreakdownData = [
    { name: 'Your Net Profit', value: Math.max(0, investor.netProfit) },
    { name: 'Manager Fee', value: Math.max(0, investor.yourFee) }
  ].filter(d => d.value > 0);
  
  const PIE_COLORS = ['#10b981', '#6366f1'];

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
          // Force background to white and apply legacy color overrides for the capture target
          if (element) {
            element.classList.add('pdf-capture');
            element.style.backgroundColor = '#ffffff';
            element.style.padding = '20px'; // Add some padding for the PDF
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

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) return;
    if (onUpdateInvestor) {
      const hashed = await hashPassword(newPassword);
      onUpdateInvestor(investor.id, { password: hashed });
      setPasswordMessage('Password updated successfully.');
      setNewPassword('');
      setTimeout(() => setPasswordMessage(''), 3000);
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto" ref={dashboardRef}>
      <div className="flex justify-between items-center mb-8" data-html2canvas-ignore>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {investor.investorName}</h2>
          <p className="text-slate-500 dark:text-slate-400">Here is your portfolio performance overview.</p>
        </div>
        <button 
          onClick={generatePDF}
          disabled={isGeneratingPDF}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isGeneratingPDF ? 'Generating...' : 'Download Statement'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Current</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Capital</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(investor.endingCapital)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">This Period</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Net Profit</p>
            <h3 className={`text-2xl font-bold ${investor.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(investor.netProfit)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">This Period</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Return on Investment</p>
            <h3 className={`text-2xl font-bold ${roi >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {roi > 0 ? '+' : ''}{roi.toFixed(2)}%
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">HWM</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">High Water Mark</p>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(investor.highWaterMark)}</h3>
              {distanceToHWM !== 0 && (
                <span className={`text-xs font-medium mb-1 ${distanceToHWM > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({distanceToHWM > 0 ? '+' : ''}{formatCurrency(distanceToHWM)})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {trades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-fuchsia-500" />
              <h3 className="text-sm font-semibold text-slate-700">System Profit Factor</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{systemProfitFactor === Infinity ? '∞' : systemProfitFactor.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="text-sm font-semibold text-slate-700">System Gross Profit</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(systemGrossProfit)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-semibold text-slate-700">System Gross Loss</h3>
            </div>
            <p className="text-2xl font-bold text-red-600">-{formatCurrency(systemGrossLoss)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6 text-slate-900">Capital Growth History</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis tickFormatter={(val) => `$${val}`} stroke="#64748b" />
                <Tooltip 
                  formatter={(val: number) => formatCurrency(val)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="capital" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profit Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-slate-500" />
              Profit Breakdown
            </h3>
            {profitBreakdownData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={profitBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {profitBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                No profit data to display for this period.
              </div>
            )}
          </div>

          {/* Fee Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-900">Fee Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-slate-700">Fees Paid</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(investor.feeCollected)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-800">Unpaid Fees</span>
                </div>
                <span className="font-bold text-orange-600">{formatCurrency(investor.unpaidFee)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {allowWithdrawals && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 border-b border-slate-100 pb-2">Request Withdrawal</h3>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 w-full relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                />
              </div>
              <div className="flex-[2] w-full">
                <input 
                  type="text" 
                  placeholder="Details / Bank Info" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={withdrawNotes}
                  onChange={e => setWithdrawNotes(e.target.value)}
                />
              </div>
              <button 
                onClick={handleWithdrawRequestClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium whitespace-nowrap"
              >
                Request Funds
              </button>
            </div>
            
            <div className="w-full">
              <input 
                type="range"
                min="0"
                max={investor.endingCapital}
                step="1"
                value={parseFloat(withdrawAmount) || 0}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-slate-500">$0</span>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-slate-900">Remaining Balance</span>
                  <span className={`text-lg font-bold ${Math.max(0, investor.endingCapital - (parseFloat(withdrawAmount) || 0)) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {formatCurrency(Math.max(0, investor.endingCapital - (parseFloat(withdrawAmount) || 0)))}
                  </span>
                </div>
                <span className="text-sm text-slate-500">{formatCurrency(investor.endingCapital)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Confirm Withdrawal Request</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">Please review the details of your withdrawal request. Once submitted, it will be pending manager approval.</p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Requested Amount</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(parseFloat(withdrawAmount) || 0)}</span>
                </div>
                {/* Simulated Fee Logic - 0 for simple withdrawals unless a specific fee logic is required */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Estimated Fees</span>
                  <span className="font-semibold text-slate-900">$0.00</span>
                </div>
                <div className="h-px bg-slate-200 my-2"></div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-slate-900">Total Deduction</span>
                  <span className="text-red-600">{formatCurrency(parseFloat(withdrawAmount) || 0)}</span>
                </div>
              </div>
              
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmWithdrawRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {myTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${t.type === 'deposit' ? 'bg-green-100 text-green-800' : 
                        t.type === 'withdrawal' ? 'bg-red-100 text-red-800' : 
                        t.type === 'fee_payment' ? 'bg-blue-100 text-blue-800' : 
                        'bg-purple-100 text-purple-800'}`}>
                      {t.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-bold ${t.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                    {t.type === 'withdrawal' ? '-' : '+'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize 
                      ${t.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        t.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                        'bg-slate-100 text-slate-600'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {myTransactions.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-html2canvas-ignore>
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Key className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Account Settings</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="max-w-md">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Change Password</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input 
                  type="password" 
                  placeholder="New Password" 
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button 
                  onClick={handlePasswordChange}
                  disabled={!newPassword.trim()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  Update
                </button>
              </div>
              {newPassword && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden flex">
                    <div className={`h-full ${evaluatePasswordStrength(newPassword).color}`} style={{ width: `${(evaluatePasswordStrength(newPassword).score / 4) * 100}%` }}></div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{evaluatePasswordStrength(newPassword).label}</span>
                </div>
              )}
            </div>
            {passwordMessage && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {passwordMessage}
              </p>
            )}
          </div>
          
          <div className="max-w-md border-t border-slate-200 pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-8">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Display Currency</h4>
            <div className="flex items-center gap-3">
              <select 
                value={investor.baseCurrency || 'USD'}
                onChange={e => onUpdateInvestor && onUpdateInvestor(investor.id, { baseCurrency: e.target.value })}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="MYR">MYR (RM)</option>
                <option value="CHF">CHF (Fr)</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-2">Personalize the currency formatting on your dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
