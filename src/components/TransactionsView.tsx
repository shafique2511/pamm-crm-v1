import React, { useState, useMemo } from 'react';
import { Transaction, Investor } from '../types';
import { formatCurrency } from '../lib/utils';
import { 
  Plus, ArrowDownCircle, ArrowUpCircle, Wallet, Search, Filter, 
  ArrowUpDown, Download, CheckCircle2, XCircle, Clock, Hash, 
  CreditCard, Tag, ExternalLink, MoreVertical, X, Eye, FileText, Shield, RotateCcw
} from 'lucide-react';

type SortKey = keyof Transaction | 'investorName';

const generateRefId = () => `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export function TransactionsView({ transactions, investors, onAddTransaction, onUpdateStatus, readOnly }: { transactions: Transaction[], investors: Investor[], onAddTransaction: (t: Partial<Transaction>) => void, onUpdateStatus?: (id: string, status: 'completed' | 'rejected') => void, readOnly?: boolean }) {
  const [type, setType] = useState<Transaction['type'] | 'all'>('deposit');
  const [amount, setAmount] = useState('');
  const [investorId, setInvestorId] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceId, setReferenceId] = useState(generateRefId());
  const [method, setMethod] = useState('');
  const [category, setCategory] = useState<Transaction['category']>('Bank');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [isExporting, setIsExporting] = useState(false);

  // New Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [investorFilter, setInvestorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'rejected'>('all');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const [confirmingWithdrawal, setConfirmingWithdrawal] = useState(false);

  const handleAdd = () => {
    if (!amount || type === 'all') return;
    
    if (type === 'manager_withdrawal' && !confirmingWithdrawal) {
      setConfirmingWithdrawal(true);
      return;
    }

    onAddTransaction({
      type: type as Transaction['type'],
      amount: parseFloat(amount) || 0,
      investorId: type === 'manager_withdrawal' ? undefined : investorId,
      date: new Date().toISOString(),
      status: 'completed',
      notes,
      referenceId,
      method,
      category
    });
    
    setAmount(''); 
    setNotes(''); 
    setReferenceId(generateRefId()); 
    setMethod('');
    setConfirmingWithdrawal(false);
  };

  const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalFeePayments = transactions.filter(t => t.type === 'fee_payment' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = transactions.filter(t => {
      const matchesFilter = filterType === 'all' || t.type === filterType;
      const invName = t.investorId ? investors.find(i => i.id === t.investorId)?.investorName || '' : 'Manager';
      const matchesSearch = invName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (t.referenceId || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesInvestor = investorFilter === 'all' || t.investorId === investorFilter || (investorFilter === 'manager' && !t.investorId);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      
      let matchesDate = true;
      const txDate = new Date(t.date).getTime();
      if (dateFrom) {
        matchesDate = matchesDate && txDate >= new Date(dateFrom).getTime();
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo).setHours(23, 59, 59, 999);
        matchesDate = matchesDate && txDate <= endOfDay;
      }

      let matchesAmount = true;
      if (amountMin) matchesAmount = matchesAmount && t.amount >= parseFloat(amountMin);
      if (amountMax) matchesAmount = matchesAmount && t.amount <= parseFloat(amountMax);

      return matchesFilter && matchesSearch && matchesInvestor && matchesStatus && matchesDate && matchesAmount && matchesCategory;
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Transaction];
        let bValue: any = b[sortConfig.key as keyof Transaction];
        
        if (sortConfig.key === 'investorName') {
          aValue = a.investorId ? investors.find(i => i.id === a.investorId)?.investorName || '' : 'Manager';
          bValue = b.investorId ? investors.find(i => i.id === b.investorId)?.investorName || '' : 'Manager';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [transactions, investors, filterType, searchTerm, sortConfig, dateFrom, dateTo, investorFilter, statusFilter, amountMin, amountMax, categoryFilter]);

  const exportToCSV = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const headers = ['Date', 'Type', 'Investor', 'Amount', 'Reference', 'Method', 'Category', 'Notes', 'Status'];
      const rows = filteredAndSortedTransactions.map(t => {
        const invName = t.investorId ? investors.find(i => i.id === t.investorId)?.investorName || '' : 'Manager';
        return [
          `"${new Date(t.date).toLocaleString().replace(/"/g, '""')}"`,
          `"${t.type}"`,
          `"${invName.replace(/"/g, '""')}"`,
          t.amount,
          `"${(t.referenceId || '').replace(/"/g, '""')}"`,
          `"${(t.method || '').replace(/"/g, '""')}"`,
          `"${t.category || 'Other'}"`,
          `"${(t.notes || '').replace(/"/g, '""')}"`,
          `"${t.status || 'completed'}"`
        ];
      });

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export CSV', e);
      alert('Failed to export data to CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const SortHeader = ({ label, sortKey }: { label: string, sortKey: SortKey }) => (
    <th 
      className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === sortKey ? 'text-blue-600' : 'text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity'}`} />
      </div>
    </th>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 group hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Deposits</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalDeposits)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 group hover:border-rose-300 dark:hover:border-rose-800 transition-all">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Withdrawals</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalWithdrawals)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 group hover:border-blue-300 dark:hover:border-blue-800 transition-all">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fees Collected</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalFeePayments)}</p>
          </div>
        </div>
      </div>

      {/* Add Transaction Section */}
      {!readOnly && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
           <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                New Financial Entry
              </h3>
              <p className="text-sm text-slate-400">Record a new movement in the system.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tx Type</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" 
                value={type} 
                onChange={e=>setType(e.target.value as any)}
              >
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="fee_payment">Fee Payment</option>
                <option value="manager_withdrawal">Manager Withdrawal (Internal)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investor Account</label>
              {type !== 'manager_withdrawal' ? (
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" 
                  value={investorId} 
                  onChange={e=>setInvestorId(e.target.value)}
                >
                  <option value="">Select Investor</option>
                  {investors.map(i => <option key={i.id} value={i.id}>{i.investorName}</option>)}
                </select>
              ) : (
                <div className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 text-sm flex items-center gap-2">
                   <Shield className="w-4 h-4" /> Principal Wallet
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</label>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                 <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white font-black" 
                  value={amount} 
                  onChange={e=>setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Bank, USDT, Cash..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" 
                  value={method} 
                  onChange={e=>setMethod(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                Reference ID
                <button 
                  onClick={() => setReferenceId(generateRefId())}
                  className="text-blue-600 hover:text-blue-700 hover:scale-110 mb-0.5 transition-all"
                  title="Generate New ID"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="TX-123456" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white font-mono" 
                  value={referenceId} 
                  onChange={e=>setReferenceId(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" 
                value={category} 
                onChange={e=>setCategory(e.target.value as any)}
              >
                <option value="Bank">Bank Transfer</option>
                <option value="Crypto">Crypto (USDT/BTC)</option>
                <option value="Internal">Internal Movement</option>
                <option value="Correction">Adjustment/Correction</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observations</label>
              <input 
                type="text" 
                placeholder="Details of the transaction..." 
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white" 
                value={notes} 
                onChange={e=>setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-400">Ensuring record accuracy protects system integrity.</p>
            <div className="flex items-center gap-3">
              {confirmingWithdrawal && (
                <button 
                  onClick={() => setConfirmingWithdrawal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleAdd} 
                className={`flex items-center gap-2 px-8 py-3 rounded-xl transition-all font-bold shadow-lg ${confirmingWithdrawal ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 ring-4 ring-rose-100' : 'bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white hover:scale-105 active:scale-95'}`}
              >
                {confirmingWithdrawal ? 'Finalize Withdrawal?' : (
                   <>
                    <Plus className="w-5 h-5"/> 
                    Commit Entry
                   </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by name, notes or ref ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
             <button 
                onClick={exportToCSV}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm shrink-0 uppercase tracking-wider"
              >
                {isExporting ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                Export CSV
              </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 outline-none dark:text-slate-300 uppercase tracking-widest"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            title="Type"
          >
            <option value="all">Types: ALL</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="fee_payment">Fee Payments</option>
            <option value="manager_withdrawal">Manager W/D</option>
          </select>
          
          <select 
            className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 outline-none dark:text-slate-300 uppercase tracking-widest"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            title="Status"
          >
            <option value="all">Status: ALL</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <select 
            className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 outline-none dark:text-slate-300 uppercase tracking-widest"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            title="Category"
          >
            <option value="all">Category: ALL</option>
            <option value="Bank">Bank</option>
            <option value="Crypto">Crypto</option>
            <option value="Internal">Internal</option>
            <option value="Correction">Correction</option>
          </select>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block"></div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Dates</span>
            <input 
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="py-1.5 text-[10px] font-bold bg-transparent focus:outline-none dark:text-white uppercase"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="py-1.5 text-[10px] font-bold bg-transparent focus:outline-none dark:text-white uppercase"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Amt</span>
            <input 
              type="number"
              placeholder="Min"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              className="w-16 py-1.5 text-[10px] font-bold bg-transparent focus:outline-none dark:text-white placeholder:text-slate-400"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="number"
              placeholder="Max"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              className="w-16 py-1.5 text-[10px] font-bold bg-transparent focus:outline-none dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[11px] text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50">
              <tr>
                <SortHeader label="Execution Date" sortKey="date" />
                <SortHeader label="Nature" sortKey="type" />
                <SortHeader label="Counterparty" sortKey="investorName" />
                <SortHeader label="Volume" sortKey="amount" />
                <SortHeader label="Category" sortKey="category" />
                <SortHeader label="Ref ID" sortKey="referenceId" />
                <SortHeader label="Status" sortKey="status" />
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSortedTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-4 py-4 truncate max-w-[140px]">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{new Date(t.date).toLocaleDateString()}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                      ${t.type === 'deposit' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        t.type === 'withdrawal' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' : 
                        t.type === 'fee_payment' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {t.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {t.investorId ? investors.find(i => i.id === t.investorId)?.investorName : 'Manager'}
                      </span>
                      {t.method && <span className="text-[10px] text-slate-400 italic">via {t.method}</span>}
                    </div>
                  </td>
                  <td className={`px-4 py-4 font-black ${t.type.includes('withdrawal') ? 'text-rose-600' : 'text-emerald-600'}`}>
                    <div className="flex flex-col">
                      <span>{t.type.includes('withdrawal') ? '-' : '+'}{formatCurrency(t.amount)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                     <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded">
                       {t.category || 'Other'}
                     </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-[10px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                    {t.referenceId || '-'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest 
                        ${t.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        t.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {t.status === 'pending' && <Clock className="w-3 h-3" />}
                        {t.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {(!t.status || t.status === 'completed') && <CheckCircle2 className="w-3 h-3" />}
                        {t.status || 'completed'}
                      </span>
                      {t.status === 'pending' && onUpdateStatus && !readOnly && (
                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onUpdateStatus(t.id, 'completed')}
                            className="p-1 px-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                            title="Approve"
                          >
                             <CheckCircle2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => onUpdateStatus(t.id, 'rejected')}
                            className="p-1 px-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                            title="Reject"
                          >
                             <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button 
                      onClick={() => setSelectedTx(t)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-xl bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAndSortedTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                       <FileText className="w-12 h-12 opacity-10" />
                       <p className="text-xs uppercase font-black tracking-widest italic">Archived or Non-existent</p>
                       <p className="text-sm">No recorded transactions match your query.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
               <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transaction Records</p>
                 <h2 className="text-lg font-black text-slate-900 dark:text-white">Detailed Execution Summary</h2>
               </div>
               <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-8 space-y-6">
               <div className="flex items-center justify-between pb-4 border-b dark:border-slate-800">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</span>
                     <span className={`text-3xl font-black ${selectedTx.type.includes('withdrawal') ? 'text-rose-600' : 'text-emerald-600'}`}>
                       {selectedTx.type.includes('withdrawal') ? '-' : '+'}{formatCurrency(selectedTx.amount)}
                     </span>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                     <div className="mt-1">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest 
                          ${selectedTx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {selectedTx.status || 'Completed'}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execution Type</span>
                     <p className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">{selectedTx.type.replace('_', ' ')}</p>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execution Date</span>
                     <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{new Date(selectedTx.date).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Counterparty</span>
                     <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedTx.investorId ? investors.find(i => i.id === selectedTx.investorId)?.investorName : 'Manager'}
                     </p>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</span>
                     <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedTx.method || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal Category</span>
                     <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedTx.category || 'Standard'}</p>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference ID</span>
                     <p className="text-sm font-mono text-slate-900 dark:text-slate-100">{selectedTx.referenceId || 'N/A'}</p>
                  </div>
               </div>

               <div className="pt-4 border-t dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execution Observations</span>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 italic">
                     {selectedTx.notes || 'No notes attached to this record.'}
                  </p>
               </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-800 flex justify-end gap-3">
               <button 
                onClick={() => setSelectedTx(null)}
                className="px-6 py-2.5 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
               >
                 Close Detail View
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
