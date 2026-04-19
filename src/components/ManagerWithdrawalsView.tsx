import React, { useState, useMemo } from 'react';
import { Transaction, Investor } from '../types';
import { formatCurrency } from '../lib/utils';
import { 
  Clock, Search, ArrowUpRight, Users, CheckCircle2, XCircle, 
  ArrowUpDown, Filter, Eye, X, CreditCard, Hash, Tag, 
  Wallet, Calendar, ShieldCheck, FileText, MoreVertical
} from 'lucide-react';

type SortKey = keyof Transaction | 'investorName';

export function ManagerWithdrawalsView({ transactions, investors, onUpdateStatus, readOnly }: { transactions: Transaction[], investors?: Investor[], onUpdateStatus?: (id: string, status: 'completed' | 'rejected') => void, readOnly?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'manager' | 'investor'>('investor');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

  // Additional Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const managerWithdrawalTxs = useMemo(() => {
    return transactions.filter(t => t.type === 'manager_withdrawal');
  }, [transactions]);

  const investorWithdrawalTxs = useMemo(() => {
    return transactions.filter(t => t.type === 'withdrawal');
  }, [transactions]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processFilter = (txs: Transaction[]) => {
    let result = txs.filter(tx => {
      const inv = investors?.find(i => i.id === tx.investorId);
      const searchMatch = (tx.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (inv?.investorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (tx.referenceId || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === 'all' || tx.status === statusFilter;
      const categoryMatch = categoryFilter === 'all' || tx.category === categoryFilter;
      
      let dateMatch = true;
      const txTime = new Date(tx.date).getTime();
      if (dateFrom) dateMatch = dateMatch && txTime >= new Date(dateFrom).getTime();
      if (dateTo) {
        const endDay = new Date(dateTo).setHours(23, 59, 59, 999);
        dateMatch = dateMatch && txTime <= endDay;
      }

      return searchMatch && statusMatch && categoryMatch && dateMatch;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof Transaction];
        let bVal: any = b[sortConfig.key as keyof Transaction];
        
        if (sortConfig.key === 'investorName') {
          aVal = a.investorId ? investors?.find(i => i.id === a.investorId)?.investorName || '' : 'Manager';
          bVal = b.investorId ? investors?.find(i => i.id === b.investorId)?.investorName || '' : 'Manager';
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  };

  const filteredTxs = processFilter(tab === 'manager' ? managerWithdrawalTxs : investorWithdrawalTxs);
  const totalWithdrawnManager = managerWithdrawalTxs.filter(t => t.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0);
  const pendingInvestorRequests = investorWithdrawalTxs.filter(t => t.status === 'pending').length;

  const SortHeader = ({ label, sortKey }: { label: string, sortKey: SortKey }) => (
    <th 
      className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
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
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            Treasury Post
          </h2>
          <p className="text-slate-400 text-sm">Review withdrawal mandates and track personal settlements.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setTab('investor')}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'investor' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Users className="w-4 h-4" />
            Investor Mandates
            {pendingInvestorRequests > 0 && (
              <span className="ml-1 bg-blue-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] animate-pulse">
                {pendingInvestorRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('manager')}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${tab === 'manager' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Personal Ledger
          </button>
        </div>
      </div>

      {/* Stats Summary Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        {tab === 'manager' ? (
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
               <Wallet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Settlements</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalWithdrawnManager)}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
               <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Queueing Requests</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{pendingInvestorRequests} Pending</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Ref, Name or Date..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none dark:text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Statuses: ALL</option>
              <option value="pending">Queue: PENDING</option>
              <option value="completed">State: COMPLETED</option>
              <option value="rejected">State: REJECTED</option>
            </select>
            <select 
              className="px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none dark:text-white"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Category: ALL</option>
              <option value="Bank">Path: BANK</option>
              <option value="Crypto">Path: CRYPTO</option>
              <option value="Internal">Path: INTERNAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <SortHeader label="Mandate Date" sortKey="date" />
                {tab === 'investor' && <SortHeader label="Beneficiary" sortKey="investorName" />}
                <SortHeader label="Volume" sortKey="amount" />
                <th className="px-6 py-4">Method & Ref</th>
                <SortHeader label="Status" sortKey="status" />
                <th className="px-6 py-4 text-right">Mandate Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTxs.map(tx => {
                const inv = investors?.find(i => i.id === tx.investorId);
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                         <span className="font-bold text-slate-900 dark:text-slate-100">{new Date(tx.date).toLocaleDateString()}</span>
                         <span className="text-[10px] text-slate-400 font-mono italic">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </td>
                    {tab === 'investor' && (
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black text-xs">
                            {inv?.investorName.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{inv?.investorName || 'Treasury Principal'}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-5">
                       <span className={`text-sm font-black text-rose-600`}>
                         -{formatCurrency(tx.amount)}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3 text-slate-400" />
                            {tx.method || 'Internal Transfer'}
                         </span>
                         <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                            #{tx.referenceId || 'no-ref'}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${tx.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 
                          tx.status === 'rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' :
                          'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                        {tx.status === 'pending' && <Clock className="w-3 h-3 animate-spin-slow" />}
                        {tx.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {(!tx.status || tx.status === 'completed') && <CheckCircle2 className="w-3 h-3" />}
                        {tx.status || 'completed'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {tx.status === 'pending' && onUpdateStatus && !readOnly && (
                          <div className="flex items-center gap-2 pr-2 border-r dark:border-slate-800 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                onUpdateStatus(tx.id, 'completed');
                                alert(`Settlement Mandate Approved: Disbursement for ${inv?.investorName} has been recorded.`);
                              }}
                              className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
                              title="Approve Settlement"
                            >
                               <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => onUpdateStatus(tx.id, 'rejected')}
                              className="p-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg shadow-lg shadow-rose-200 dark:shadow-none transition-all"
                              title="Reject Request"
                            >
                               <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={() => setSelectedTx(tx)}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTxs.length === 0 && (
                <tr>
                  <td colSpan={tab === 'investor' ? 6 : 5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <FileText className="w-16 h-16 text-slate-100 dark:text-slate-800" />
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700">Archived or Vacant</p>
                       <p className="text-sm text-slate-400">Your withdrawal ledger is matching zero records for this period.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal Overlay */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 relative">
               <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
               <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Treasury Record Detail</p>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white">Execution Audit Log</h2>
               </div>
               <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all">
                 <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="p-10 space-y-8">
               <div className="flex items-center justify-between pb-8 border-b dark:border-slate-800">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Debit Amount</span>
                     <span className={`text-4xl font-black text-rose-600`}>
                       -{formatCurrency(selectedTx.amount)}
                     </span>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Settlement Status</span>
                     <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm
                        ${selectedTx.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                          selectedTx.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                          'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                        {selectedTx.status || 'Completed'}
                     </span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Execution Date</span>
                     </div>
                     <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{new Date(selectedTx.date).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Counterparty</span>
                     </div>
                     <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedTx.investorId ? investors?.find(i => i.id === selectedTx.investorId)?.investorName : 'Treasury Principal'}
                     </p>
                  </div>
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2 text-slate-400">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Settlement Path</span>
                     </div>
                     <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedTx.method || 'Internal Transfer'}</p>
                  </div>
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Hash className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Financial Ref ID</span>
                     </div>
                     <p className="text-sm font-mono font-bold text-blue-600">{selectedTx.referenceId || 'N/A'}</p>
                  </div>
               </div>

               <div className="pt-6 border-t dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                     <FileText className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Observation Notes</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                        {selectedTx.notes || 'No administrative observations recorded for this mandate.'}
                     </p>
                  </div>
               </div>
            </div>
            
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-800 flex justify-end gap-3">
               <button 
                onClick={() => setSelectedTx(null)}
                className="px-10 py-3.5 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 dark:hover:bg-white transition-all shadow-xl active:scale-95"
               >
                 Close Audit View
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

