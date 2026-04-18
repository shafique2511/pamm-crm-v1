import React, { useState, useMemo } from 'react';
import { Transaction, Investor } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus, ArrowDownCircle, ArrowUpCircle, Wallet, Search, Filter, ArrowUpDown, Download, CheckCircle2, XCircle, Clock } from 'lucide-react';

type SortKey = keyof Transaction | 'investorName';

export function TransactionsView({ transactions, investors, onAddTransaction, onUpdateStatus, readOnly }: { transactions: Transaction[], investors: Investor[], onAddTransaction: (t: Partial<Transaction>) => void, onUpdateStatus?: (id: string, status: 'completed' | 'rejected') => void, readOnly?: boolean }) {
  const [type, setType] = useState<Transaction['type'] | 'all'>('deposit');
  const [amount, setAmount] = useState('');
  const [investorId, setInvestorId] = useState('');
  const [notes, setNotes] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
  const [isExporting, setIsExporting] = useState(false);

  // New Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [investorFilter, setInvestorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAdd = () => {
    if (!amount || type === 'all') return;
    
    if (type === 'manager_withdrawal') {
      const confirmed = window.confirm("Are you sure you want to record a Manager Withdrawal? This action is intentional and will reduce your available manager balance.");
      if (!confirmed) return;
    }

    onAddTransaction({
      type: type as Transaction['type'],
      amount: parseFloat(amount) || 0,
      investorId: type === 'manager_withdrawal' ? undefined : investorId,
      date: new Date().toISOString(),
      status: 'completed',
      notes
    });
    setAmount(''); setNotes('');
  };

  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
  const totalFeePayments = transactions.filter(t => t.type === 'fee_payment').reduce((sum, t) => sum + t.amount, 0);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = transactions.filter(t => {
      const matchesFilter = filterType === 'all' || t.type === filterType;
      const invName = t.investorId ? investors.find(i => i.id === t.investorId)?.investorName || '' : 'Manager';
      const matchesSearch = invName.toLowerCase().includes(searchTerm.toLowerCase()) || (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesInvestor = investorFilter === 'all' || t.investorId === investorFilter || (investorFilter === 'manager' && !t.investorId);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      
      let matchesDate = true;
      const txDate = new Date(t.date).getTime();
      if (dateFrom) {
        matchesDate = matchesDate && txDate >= new Date(dateFrom).getTime();
      }
      if (dateTo) {
        matchesDate = matchesDate && txDate <= new Date(dateTo).getTime() + 86400000;
      }

      return matchesFilter && matchesSearch && matchesInvestor && matchesStatus && matchesDate;
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Transaction];
        let bValue: any = b[sortConfig.key as keyof Transaction];
        
        if (sortConfig.key === 'investorName') {
          aValue = a.investorId ? investors.find(i => i.id === a.investorId)?.investorName || '' : 'Manager';
          bValue = b.investorId ? investors.find(i => i.id === b.investorId)?.investorName || '' : 'Manager';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return result;
  }, [transactions, investors, filterType, searchTerm, sortConfig, dateFrom, dateTo, investorFilter, statusFilter]);

  const exportToCSV = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const headers = ['Date', 'Type', 'Investor', 'Amount', 'Notes', 'Status'];
      const rows = filteredAndSortedTransactions.map(t => {
        const invName = t.investorId ? investors.find(i => i.id === t.investorId)?.investorName || '' : 'Manager';
        return [
          `"${new Date(t.date).toLocaleString().replace(/"/g, '""')}"`,
          `"${t.type}"`,
          `"${invName.replace(/"/g, '""')}"`,
          t.amount,
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
      className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors group"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === sortKey ? 'text-blue-600' : 'text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity'}`} />
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Deposits</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalDeposits)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Withdrawals</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalWithdrawals)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Fees Collected</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalFeePayments)}</p>
          </div>
        </div>
      </div>

      {/* Add Transaction Form */}
      {!readOnly && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Record New Transaction</h3>
            <button 
              onClick={exportToCSV}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium disabled:opacity-70"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export Filtered'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <select className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={type} onChange={e=>setType(e.target.value as any)}>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="fee_payment">Fee Payment</option>
              <option value="manager_withdrawal">Manager Withdrawal</option>
            </select>
            {type !== 'manager_withdrawal' ? (
              <select className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={investorId} onChange={e=>setInvestorId(e.target.value)}>
                <option value="">Select Investor</option>
                {investors.map(i => <option key={i.id} value={i.id}>{i.investorName}</option>)}
              </select>
            ) : (
              <div className="px-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 flex items-center">
                Manager Wallet
              </div>
            )}
            <input type="number" placeholder="Amount ($)" className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={amount} onChange={e=>setAmount(e.target.value)}/>
            <input type="text" placeholder="Notes (Optional)" className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2" value={notes} onChange={e=>setNotes(e.target.value)}/>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4"/> Record Transaction
          </button>
        </div>
      )}
      
      {readOnly && (
        <div className="flex justify-end">
          <button 
            onClick={exportToCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium disabled:opacity-70"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export Filtered'}
          </button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row bg-slate-50 gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search notes or investor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select 
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              title="Transaction Type"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="fee_payment">Fee Payments</option>
              <option value="manager_withdrawal">Manager Withdrawals</option>
            </select>
            <select 
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={investorFilter}
              onChange={(e) => setInvestorFilter(e.target.value)}
              title="Investor"
            >
              <option value="all">All Investors & Manager</option>
              <option value="manager">Manager Only</option>
              {investors.map(i => <option key={i.id} value={i.id}>{i.investorName}</option>)}
            </select>
            <select 
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              title="Status"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2">
              <input 
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="py-1 text-sm rounded focus:outline-none"
                title="From Date"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="py-1 text-sm rounded focus:outline-none"
                title="To Date"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
              <tr>
                <SortHeader label="Date" sortKey="date" />
                <SortHeader label="Type" sortKey="type" />
                <SortHeader label="Investor" sortKey="investorName" />
                <SortHeader label="Amount" sortKey="amount" />
                <SortHeader label="Notes" sortKey="notes" />
                <SortHeader label="Status" sortKey="status" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAndSortedTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-600">{new Date(t.date).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${t.type === 'deposit' ? 'bg-green-100 text-green-800' : 
                        t.type === 'withdrawal' ? 'bg-red-100 text-red-800' : 
                        t.type === 'fee_payment' ? 'bg-blue-100 text-blue-800' : 
                        'bg-purple-100 text-purple-800'}`}>
                      {t.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {t.investorId ? investors.find(i => i.id === t.investorId)?.investorName : 'Manager'}
                  </td>
                  <td className={`px-4 py-3 font-bold ${t.type.includes('withdrawal') ? 'text-red-600' : 'text-green-600'}`}>
                    {t.type.includes('withdrawal') ? '-' : '+'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.notes || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize 
                        ${t.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        t.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                        'bg-emerald-100 text-emerald-700'}`}>
                        {t.status === 'pending' && <Clock className="w-3 h-3" />}
                        {t.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {(!t.status || t.status === 'completed') && <CheckCircle2 className="w-3 h-3" />}
                        {t.status || 'completed'}
                      </span>
                      {t.status === 'pending' && onUpdateStatus && !readOnly && (
                        <div className="flex items-center gap-1 ml-2">
                          <button 
                            onClick={() => onUpdateStatus(t.id, 'completed')}
                            className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"
                            title="Approve"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button 
                            onClick={() => onUpdateStatus(t.id, 'rejected')}
                            className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                            title="Reject"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAndSortedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No transactions found matching your criteria.
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
