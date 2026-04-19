import React, { useState, useMemo } from 'react';
import { AuditLog } from '../types';
import { Shield, Search, Filter, ArrowUpDown, Clock, User, Activity, Trash2, Check, X } from 'lucide-react';

type SortKey = keyof AuditLog;

export function AuditLogView({ logs, onClearLogs }: { logs: AuditLog[], onClearLogs: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'timestamp', direction: 'desc' });
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedLogs = useMemo(() => {
    let result = logs.filter(log => {
      const matchesFilter = filterType === 'all' || log.type === filterType;
      const matchesSearch = 
        (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [logs, filterType, searchTerm, sortConfig]);

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Audit Logs
          </h2>
          <p className="text-slate-500 text-sm">Track system activities and user actions.</p>
        </div>

        {logs.length > 0 && (
          <div className="flex items-center gap-2">
            {showConfirmClear ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                <span className="text-xs font-medium text-red-600">Are you sure?</span>
                <button 
                  onClick={() => {
                    onClearLogs();
                    setShowConfirmClear(false);
                  }}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  title="Confirm Clear All"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowConfirmClear(false)}
                  className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear Logs
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-slate-400" />
          <select 
            className="flex-1 md:w-48 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="auth">Authentication</option>
            <option value="investor">Investor Management</option>
            <option value="transaction">Transactions</option>
            <option value="trade">Trading</option>
            <option value="system">System / Settings</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
              <tr>
                <SortHeader label="Timestamp" sortKey="timestamp" />
                <SortHeader label="User" sortKey="userName" />
                <SortHeader label="Type" sortKey="type" />
                <SortHeader label="Action" sortKey="action" />
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAndSortedLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {log.userName || 'System'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${log.type === 'auth' ? 'bg-blue-100 text-blue-800' : 
                        log.type === 'investor' ? 'bg-emerald-100 text-emerald-800' : 
                        log.type === 'transaction' ? 'bg-amber-100 text-amber-800' : 
                        log.type === 'trade' ? 'bg-purple-100 text-purple-800' : 
                        'bg-slate-100 text-slate-800'}`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      {log.action}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-md truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
              {filteredAndSortedLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No audit logs found matching your criteria.
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
