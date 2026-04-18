import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Investor } from '../types';
import { formatCurrency, formatPercent } from '../lib/utils';
import { Edit2, Trash2, QrCode, Check, FileText, ArrowUpDown } from 'lucide-react';
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
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>(null);

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
          aValue = a.startingCapital > 0 ? (a.netProfit / a.startingCapital) : 0;
          bValue = b.startingCapital > 0 ? (b.netProfit / b.startingCapital) : 0;
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

  const handleInputChange = (field: keyof Investor, value: string | number) => {
    setEditForm(prev => {
      const updates = { ...prev, [field]: value };
      
      // Auto-initialize highWaterMark when startingCapital changes to prevent false net profit calculations
      if (field === 'startingCapital') {
        const newCap = Number(value) || 0;
        updates.endingCapital = newCap + (prev.netProfit || 0) - (prev.cashPayout || 0);
        
        // If HWM is 0 or less than the new starting capital and they have no profit yet, sync it.
        if (prev.highWaterMark === 0 || (prev.highWaterMark < newCap && (!prev.netProfit || prev.netProfit === 0))) {
          updates.highWaterMark = newCap;
        }
      }

      // Auto-calculate Reinvest / Cash Payout
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
      
      // Auto-calculate Unpaid Fee
      if (field === 'feeCollected') {
        const collected = Number(value) || 0;
        const previouslyCollected = prev.feeCollected || 0;
        const previousUnpaid = prev.unpaidFee || 0;
        const totalOwed = previousUnpaid + previouslyCollected;
        updates.unpaidFee = totalOwed - collected;
      }

      return updates;
    });
  };

  const SortHeader = ({ label, sortKey }: { label: string, sortKey: SortKey }) => (
    <th 
      className="px-4 py-4 font-medium whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors group"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === sortKey ? 'text-blue-600' : 'text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity'}`} />
      </div>
    </th>
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <SortHeader label="Investor Name" sortKey="investorName" />
                <SortHeader label="Group" sortKey="group" />
                <th className="px-4 py-4 font-medium whitespace-nowrap">Password</th>
                <SortHeader label="Starting Capital" sortKey="startingCapital" />
                <SortHeader label="HWM" sortKey="highWaterMark" />
                <SortHeader label="Loss Carryover" sortKey="lossCarryover" />
                <SortHeader label="Share %" sortKey="sharePercentage" />
                <SortHeader label="Indiv. Profit Share" sortKey="individualProfitShare" />
                <SortHeader label="Fee %" sortKey="feePercentage" />
                <SortHeader label="Your Fee" sortKey="yourFee" />
                {enableIBModule && (
                  <>
                    <SortHeader label="Referred By (IB)" sortKey="referredBy" />
                    <SortHeader label="IB Comm %" sortKey="ibCommissionRate" />
                  </>
                )}
                <SortHeader label="Net Profit" sortKey="netProfit" />
                <SortHeader label="ROI %" sortKey="roi" />
                <SortHeader label="Reinvest Amt" sortKey="reinvestAmt" />
                <SortHeader label="Cash Payout" sortKey="cashPayout" />
                <SortHeader label="Ending Capital" sortKey="endingCapital" />
                <SortHeader label="Fee Collected" sortKey="feeCollected" />
                <SortHeader label="Unpaid Fee" sortKey="unpaidFee" />
                <th className="px-4 py-4 font-medium whitespace-nowrap">Bank / QR</th>
                <th className="px-4 py-4 font-medium whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedInvestors.map((inv) => {
                const isEditing = editingId === inv.id;

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="w-32 px-2 py-1 border rounded"
                          value={editForm.investorName || ''}
                          onChange={(e) => handleInputChange('investorName', e.target.value)}
                        />
                      ) : inv.investorName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {isEditing ? (
                        <select
                          className="w-28 px-2 py-1 border rounded bg-white"
                          value={editForm.group || ''}
                          onChange={(e) => handleInputChange('group', e.target.value)}
                        >
                          <option value="">Select...</option>
                          {availableGroups.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                          {inv.group || 'Ungrouped'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="w-24 px-2 py-1 border rounded"
                          value={editForm.password || ''}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Password"
                        />
                      ) : (isAdmin ? (inv.password || 'Not set') : '***')}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-24 px-2 py-1 border rounded"
                          value={editForm.startingCapital || 0}
                          onChange={(e) => handleInputChange('startingCapital', parseFloat(e.target.value))}
                        />
                      ) : formatCurrency(inv.startingCapital)}
                    </td>
                    <td className="px-4 py-3 font-medium text-purple-600">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-24 px-2 py-1 border rounded"
                          value={editForm.highWaterMark || 0}
                          onChange={(e) => handleInputChange('highWaterMark', parseFloat(e.target.value))}
                        />
                      ) : formatCurrency(inv.highWaterMark)}
                    </td>
                    <td className="px-4 py-3 text-red-600">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-24 px-2 py-1 border rounded"
                          value={editForm.lossCarryover || 0}
                          onChange={(e) => handleInputChange('lossCarryover', parseFloat(e.target.value))}
                        />
                      ) : formatCurrency(inv.lossCarryover)}
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {formatPercent(inv.sharePercentage)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={inv.individualProfitShare >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(inv.individualProfitShare)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-20 px-2 py-1 border rounded"
                          value={editForm.customFeePercentage ?? editForm.feePercentage ?? 20}
                          onChange={(e) => handleInputChange('customFeePercentage', parseFloat(e.target.value))}
                        />
                      ) : (
                        `${inv.customFeePercentage ?? inv.feePercentage}%`
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(inv.yourFee)}
                    </td>
                    {enableIBModule && (
                      <>
                        <td className="px-4 py-3 text-slate-600">
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-24 px-2 py-1 border rounded"
                              value={editForm.referredBy || ''}
                              onChange={(e) => handleInputChange('referredBy', e.target.value)}
                              placeholder="IB Name"
                            />
                          ) : (inv.referredBy || '-')}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {isEditing ? (
                            <input 
                              type="number" 
                              className="w-20 px-2 py-1 border rounded"
                              value={editForm.ibCommissionRate || 0}
                              onChange={(e) => handleInputChange('ibCommissionRate', parseFloat(e.target.value))}
                            />
                          ) : (
                            inv.ibCommissionRate ? `${inv.ibCommissionRate}%` : '-'
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 font-medium">
                      <span className={inv.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(inv.netProfit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <span className={inv.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {inv.startingCapital > 0 ? ((inv.netProfit / inv.startingCapital) * 100).toFixed(2) + '%' : '0.00%'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-24 px-2 py-1 border rounded"
                          value={editForm.reinvestAmt || 0}
                          onChange={(e) => handleInputChange('reinvestAmt', parseFloat(e.target.value))}
                        />
                      ) : formatCurrency(inv.reinvestAmt)}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-24 px-2 py-1 border rounded"
                          value={editForm.cashPayout || 0}
                          onChange={(e) => handleInputChange('cashPayout', parseFloat(e.target.value))}
                        />
                      ) : formatCurrency(inv.cashPayout)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {formatCurrency(isEditing && editForm.endingCapital !== undefined ? editForm.endingCapital : inv.endingCapital)}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="w-24 px-2 py-1 border rounded"
                          value={editForm.feeCollected || 0}
                          onChange={(e) => handleInputChange('feeCollected', parseFloat(e.target.value))}
                        />
                      ) : formatCurrency(inv.feeCollected)}
                    </td>
                    <td className="px-4 py-3 text-orange-600 font-medium">
                      {formatCurrency(isEditing && editForm.unpaidFee !== undefined ? editForm.unpaidFee : inv.unpaidFee)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="truncate w-20" title={inv.bankAccount}>{inv.bankAccount}</span>
                        {inv.qrCode && (
                          <button 
                            onClick={() => setShowQR(showQR === inv.id ? null : inv.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}
                        {showQR === inv.id && (
                          <div className="absolute z-10 mt-8 bg-white p-2 shadow-xl border rounded-lg">
                            <QRCodeSVG value={inv.qrCode} size={100} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setInvoiceInvestor(inv)}
                          className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
                          title="Generate Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {isAdmin && !readOnly && (
                          <>
                            {isEditing ? (
                              <button 
                                onClick={() => handleSaveClick(inv.id)}
                                className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleEditClick(inv)}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete investor ${inv.investorName}? This action cannot be undone.`)) {
                                  onDeleteInvestor(inv.id);
                                }
                              }}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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
                  <td colSpan={17} className="px-4 py-8 text-center text-slate-500">
                    No investors found. Add one to get started.
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
    </>
  );
}
