import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Investor } from '../types';
import { formatCurrency, formatPercent } from '../lib/utils';
import { Edit2, Trash2, QrCode, Check, FileText, ArrowUpDown, Circle, UserCheck, UserMinus, ShieldAlert, Calendar, UserPlus } from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';

interface InvestorsTableProps {
  investors: Investor[];
  availableGroups: string[];
  enableIBModule?: boolean;
  onUpdateInvestor: (id: string, updates: Partial<Investor>) => void;
  onDeleteInvestor: (id: string) => void;
  isAdmin: boolean;
  readOnly?: boolean;
}

type SortKey = keyof Investor | 'roi';

export function InvestorsTable({ investors, availableGroups, enableIBModule, onUpdateInvestor, onDeleteInvestor, isAdmin, readOnly }: InvestorsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Investor>>({});
  const [showQR, setShowQR] = useState<string | null>(null);
  const [invoiceInvestor, setInvoiceInvestor] = useState<Investor | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>({ key: 'investorName', direction: 'asc' });

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedInvestors = useMemo(() => {
    let sortableInvestors = [...investors];
    if (sortConfig !== null) {
      sortableInvestors.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Investor];
        let bValue: any = b[sortConfig.key as keyof Investor];
        
        if (sortConfig.key === 'roi') {
          aValue = (a.startingCapital || 0) > 0 ? (a.netProfit / a.startingCapital) : 0;
          bValue = (b.startingCapital || 0) > 0 ? (b.netProfit / b.startingCapital) : 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableInvestors;
  }, [investors, sortConfig]);

  const handleEditClick = (investor: Investor) => {
    setEditingId(investor.id);
    setEditForm(investor);
  };

  const handleSaveClick = (id: string) => {
    onUpdateInvestor(id, editForm);
    setEditingId(null);
  };

  const handleInputChange = (field: keyof Investor, value: any) => {
    setEditForm(prev => {
      const updates = { ...prev, [field]: value };
      
      if (field === 'startingCapital') {
        const newCap = Number(value) || 0;
        updates.endingCapital = newCap + (prev.netProfit || 0) - (prev.cashPayout || 0);
        if (prev.highWaterMark === 0 || (prev.highWaterMark < newCap && (!prev.netProfit || prev.netProfit === 0))) {
          updates.highWaterMark = newCap;
        }
      }

      if (field === 'cashPayout') {
        const payout = Number(value) || 0;
        updates.reinvestAmt = (prev.netProfit || 0) - payout;
        updates.endingCapital = (prev.startingCapital || 0) + updates.reinvestAmt;
      }
      
      if (field === 'reinvestAmt') {
        const reinvest = Number(value) || 0;
        updates.cashPayout = (prev.netProfit || 0) - reinvest;
        updates.endingCapital = (prev.startingCapital || 0) + reinvest;
      }
      
      if (field === 'feeCollected') {
        const collected = Number(value) || 0;
        const totalFeesOwed = (prev.yourFee || 0) + (prev.unpaidFee || 0); // This is just a helper, actual logic in Period Calculation
        updates.unpaidFee = Math.max(0, totalFeesOwed - collected);
      }

      return updates;
    });
  };

  const StatusBadge = ({ status }: { status?: string }) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
          <UserCheck className="w-3 h-3" /> Active
        </span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <ShieldAlert className="w-3 h-3" /> Suspended
        </span>;
      case 'closed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
          <UserMinus className="w-3 h-3" /> Closed
        </span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
          <UserCheck className="w-3 h-3" /> Active
        </span>;
    }
  };

  const SortHeader = ({ label, sortKey }: { label: string, sortKey: SortKey }) => (
    <th 
      className="px-4 py-4 font-bold whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group border-b dark:border-slate-700"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === sortKey ? 'text-blue-600' : 'text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity'}`} />
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[11px] text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <SortHeader label="Account" sortKey="investorName" />
                <SortHeader label="Status" sortKey="status" />
                <SortHeader label="Group" sortKey="group" />
                <th className="px-4 py-4 font-bold whitespace-nowrap border-b dark:border-slate-700">Access Key</th>
                <SortHeader label="St. Capital" sortKey="startingCapital" />
                <SortHeader label="HWM" sortKey="highWaterMark" />
                <SortHeader label="Loss C/O" sortKey="lossCarryover" />
                <SortHeader label="Share %" sortKey="sharePercentage" />
                <SortHeader label="Performance Fee" sortKey="feePercentage" />
                {enableIBModule && (
                  <>
                    <SortHeader label="IB Source" sortKey="referredBy" />
                    <SortHeader label="IB Comm" sortKey="ibCommissionRate" />
                  </>
                )}
                <SortHeader label="Net Profit" sortKey="netProfit" />
                <SortHeader label="ROI" sortKey="roi" />
                <SortHeader label="Ending Equity" sortKey="endingCapital" />
                <th className="px-4 py-4 font-bold whitespace-nowrap border-b dark:border-slate-700">Debt & Settlement</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap text-right border-b dark:border-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedInvestors.map((inv) => {
                const isEditing = editingId === inv.id;
                const roi = (inv.startingCapital || 0) > 0 ? (inv.netProfit / inv.startingCapital) * 100 : 0;

                return (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-sm dark:text-white"
                            value={editForm.investorName || ''}
                            onChange={(e) => handleInputChange('investorName', e.target.value)}
                          />
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white">{inv.investorName}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> 
                              {inv.joinedAt ? new Date(inv.joinedAt).toLocaleDateString() : 'Historical'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <select 
                          className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-xs dark:text-white"
                          value={editForm.status || 'active'}
                          onChange={e => handleInputChange('status', e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="closed">Closed</option>
                        </select>
                      ) : (
                        <StatusBadge status={inv.status} />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <select
                          className="w-28 px-2 py-1 border rounded bg-white dark:bg-slate-950 dark:border-slate-700 text-xs dark:text-white"
                          value={editForm.group || ''}
                          onChange={(e) => handleInputChange('group', e.target.value)}
                        >
                          <option value="">Ungrouped</option>
                          {availableGroups.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {inv.group || 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-mono text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="w-24 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-xs dark:text-white"
                            value={editForm.password || ''}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                          />
                        ) : (isAdmin ? (inv.password ? '••••' : 'N/A') : '••••')}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-24 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-xs dark:text-white"
                          value={editForm.startingCapital || 0}
                          onChange={(e) => handleInputChange('startingCapital', parseFloat(e.target.value))}
                        />
                      ) : formatCurrency(inv.startingCapital)}
                    </td>
                    <td className="px-4 py-4 text-indigo-600 dark:text-indigo-400 font-semibold">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-24 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-xs dark:text-white"
                          value={editForm.highWaterMark || 0}
                          onChange={(e) => handleInputChange('highWaterMark', parseFloat(e.target.value))}
                        />
                      ) : formatCurrency(inv.highWaterMark)}
                    </td>
                    <td className="px-4 py-4 text-rose-600 font-medium">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-20 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-xs dark:text-white"
                          value={editForm.lossCarryover || 0}
                          onChange={(e) => handleInputChange('lossCarryover', parseFloat(e.target.value))}
                        />
                      ) : formatCurrency(inv.lossCarryover)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${inv.sharePercentage}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{inv.sharePercentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-xs dark:text-white"
                            value={editForm.customFeePercentage ?? editForm.feePercentage}
                            onChange={(e) => handleInputChange('customFeePercentage', parseFloat(e.target.value))}
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {inv.customFeePercentage ?? inv.feePercentage}%
                        </span>
                      )}
                    </td>
                    {enableIBModule && (
                      <>
                        <td className="px-4 py-4 text-slate-500 italic text-xs">
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-24 px-2 py-1 border rounded text-xs dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                              value={editForm.referredBy || ''}
                              onChange={(e) => handleInputChange('referredBy', e.target.value)}
                            />
                          ) : (inv.referredBy || 'Direct')}
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {isEditing ? (
                            <input 
                              type="number" 
                              className="w-16 px-2 py-1 border rounded text-xs dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                              value={editForm.ibCommissionRate || 0}
                              onChange={(e) => handleInputChange('ibCommissionRate', parseFloat(e.target.value))}
                            />
                          ) : (inv.ibCommissionRate ? `${inv.ibCommissionRate}%` : '0%')}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className={`font-bold ${inv.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(inv.netProfit)}
                        </span>
                        <div className="flex items-center gap-2">
                           {inv.yourFee > 0 && <span className="text-[9px] font-semibold text-slate-400 tracking-tighter">Gross: {formatCurrency(inv.individualProfitShare)}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`text-[10px] font-black italic px-2 py-1 rounded-lg inline-block ${roi >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20'}`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 font-black text-slate-900 dark:text-white">
                      {formatCurrency(inv.endingCapital)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Bal:</span>
                          <span className="font-bold text-orange-600">{formatCurrency(inv.unpaidFee)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {inv.bankAccount && <Circle className="w-1.5 h-1.5 fill-blue-500 text-blue-500" />}
                          {inv.qrCode && (
                            <button 
                              onClick={() => setShowQR(showQR === inv.id ? null : inv.id)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              {showQR === inv.id && (
                                <div className="absolute z-50 mt-2 bg-white p-2 shadow-2xl border border-slate-200 rounded-xl animate-in fade-in zoom-in">
                                  <QRCodeSVG value={inv.qrCode} size={150} />
                                </div>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setInvoiceInvestor(inv)}
                          className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl transition-all"
                          title="Generate Settlement Statement"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {isAdmin && !readOnly && (
                          <>
                            {isEditing ? (
                              <button 
                                onClick={() => handleSaveClick(inv.id)}
                                className="p-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all shadow-md"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleEditClick(inv)}
                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                if (confirmDeleteId === inv.id) {
                                  onDeleteInvestor(inv.id);
                                  setConfirmDeleteId(null);
                                } else {
                                  setConfirmDeleteId(inv.id);
                                  setTimeout(() => setConfirmDeleteId(null), 3000);
                                }
                              }}
                              className={`p-2 rounded-xl transition-all ${confirmDeleteId === inv.id ? 'bg-red-600 text-white animate-pulse' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}
                            >
                              {confirmDeleteId === inv.id ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {investors.length === 0 && (
                <tr>
                  <td colSpan={17} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                       <UserPlus className="w-12 h-12 opacity-10" />
                       <p className="text-xs uppercase font-black tracking-widest">System Empty</p>
                       <p className="text-sm">No investor records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {invoiceInvestor && (
        <InvoiceModal 
          investor={invoiceInvestor} 
          onClose={() => setInvoiceInvestor(null)} 
        />
      )}
    </div>
  );
}
