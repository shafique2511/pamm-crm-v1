import React, { useState, useMemo } from 'react';
import { Transaction, Investor } from '../types';
import { formatCurrency } from '../lib/utils';
import { Clock, Search, ArrowUpRight, Users, CheckCircle2, XCircle } from 'lucide-react';

export function ManagerWithdrawalsView({ transactions, investors, onUpdateStatus, readOnly }: { transactions: Transaction[], investors?: Investor[], onUpdateStatus?: (id: string, status: 'completed' | 'rejected') => void, readOnly?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'manager' | 'investor'>('investor');

  const managerWithdrawalTxs = useMemo(() => {
    return transactions.filter(t => t.type === 'manager_withdrawal');
  }, [transactions]);

  const investorWithdrawalTxs = useMemo(() => {
    return transactions.filter(t => t.type === 'withdrawal');
  }, [transactions]);

  const filteredManagerTxs = useMemo(() => {
    return managerWithdrawalTxs.filter(tx => 
      (tx.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.date.includes(searchTerm)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [managerWithdrawalTxs, searchTerm]);

  const filteredInvestorTxs = useMemo(() => {
    return investorWithdrawalTxs.filter(tx => {
      const inv = investors?.find(i => i.id === tx.investorId);
      const searchMatch = (tx.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (inv?.investorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          tx.date.includes(searchTerm);
      return searchMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [investorWithdrawalTxs, searchTerm, investors]);

  const totalWithdrawnManager = managerWithdrawalTxs.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-600" />
            Withdrawals Administration
          </h2>
          <p className="text-slate-500 text-sm">Manage investor requests and view your own payout history.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setTab('investor')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'investor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Investor Requests
          </button>
          <button
            onClick={() => setTab('manager')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'manager' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Withdrawals
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4 justify-between">
        {tab === 'manager' ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Lifetime Withdrawn</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalWithdrawnManager)}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Requests</p>
              <p className="text-2xl font-bold text-slate-900">{investorWithdrawalTxs.filter(t => t.status === 'pending').length}</p>
            </div>
          </div>
        )}
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search notes, date, or names..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                {tab === 'investor' && <th className="px-6 py-4 font-medium">Investor</th>}
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium">Notes</th>
                <th className="px-6 py-4 font-medium">Status</th>
                {tab === 'investor' && <th className="px-6 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(tab === 'manager' ? filteredManagerTxs : filteredInvestorTxs).map(tx => {
                const inv = investors?.find(i => i.id === tx.investorId);
                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-medium">{new Date(tx.date).toLocaleString()}</td>
                    {tab === 'investor' && (
                      <td className="px-6 py-4 text-slate-900 font-medium">{inv?.investorName || 'Unknown'}</td>
                    )}
                    <td className="px-6 py-4 font-bold text-slate-900 text-right">{formatCurrency(tx.amount)}</td>
                    <td className="px-6 py-4 text-slate-500">{tx.notes || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${tx.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                          tx.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-emerald-100 text-emerald-800'}`}>
                        {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                        {tx.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {(!tx.status || tx.status === 'completed') && <CheckCircle2 className="w-3 h-3" />}
                        {tx.status || 'completed'}
                      </span>
                    </td>
                    {tab === 'investor' && (
                      <td className="px-6 py-4 text-right">
                        {tx.status === 'pending' && onUpdateStatus && !readOnly && (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                onUpdateStatus(tx.id, 'completed');
                                alert(`Simulated Email Sent to ${inv?.investorName}: Your withdrawal of ${formatCurrency(tx.amount)} has been approved and your funds are on the way.`);
                              }}
                              className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => onUpdateStatus(tx.id, 'rejected')}
                              className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {(tab === 'manager' ? filteredManagerTxs : filteredInvestorTxs).length === 0 && (
                <tr>
                  <td colSpan={tab === 'investor' ? 6 : 4} className="px-6 py-8 text-center text-slate-500">
                    No withdrawals found.
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
