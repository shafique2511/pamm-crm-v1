import React, { useState } from 'react';
import { X, UserPlus, Shield, Wallet, Percent, Users, Key, Save } from 'lucide-react';
import { Investor, Manager } from '../types';

interface AddInvestorModalProps {
  onClose: () => void;
  onAdd: (data: Partial<Investor>) => void;
  managers: Manager[];
  availableGroups: string[];
}

export function AddInvestorModal({ onClose, onAdd, managers, availableGroups }: AddInvestorModalProps) {
  const manager = managers[0];
  const [formData, setFormData] = useState<Partial<Investor>>({
    investorName: '',
    password: 'password123',
    group: manager?.defaultInvestorGroup || availableGroups[0] || 'Default',
    feePercentage: manager?.defaultFeePercentage || 20,
    startingCapital: 0,
    highWaterMark: 0,
    baseCurrency: manager?.baseCurrency || 'USD',
    status: 'active',
    bankAccount: '',
    qrCode: '',
    referredBy: '',
    ibCommissionRate: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.investorName) return;
    
    // Ensure HWM is at least starting capital if not specified
    const finalData = {
      ...formData,
      highWaterMark: formData.highWaterMark || formData.startingCapital || 0,
      joinedAt: new Date().toISOString(),
      endingCapital: formData.startingCapital || 0,
    };
    
    onAdd(finalData);
    onClose();
  };

  const handleInputChange = (field: keyof Investor, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Onboard New Investor</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3" /> Identity & Access
              </h3>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Investor Full Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="e.g. John Doe"
                  value={formData.investorName}
                  onChange={e => handleInputChange('investorName', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Access Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-mono"
                    value={formData.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Investor Group</label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <select 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none"
                    value={formData.group}
                    onChange={e => handleInputChange('group', e.target.value)}
                  >
                    {availableGroups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Financials */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Wallet className="w-3 h-3" /> Financial Configuration
              </h3>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Initial Deposit ({formData.baseCurrency})</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  value={formData.startingCapital}
                  onChange={e => handleInputChange('startingCapital', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Performance Fee (%)</label>
                <div className="relative">
                  <Percent className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    value={formData.feePercentage}
                    onChange={e => handleInputChange('feePercentage', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              {manager?.enableIBModule && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Referrer (IB)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      placeholder="Optional"
                      value={formData.referredBy}
                      onChange={e => handleInputChange('referredBy', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">IB Rate (%)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      value={formData.ibCommissionRate}
                      onChange={e => handleInputChange('ibCommissionRate', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bank & Settlement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bank Account Details / USDT Address</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                  placeholder="Banking coordinates or wallet address"
                  value={formData.bankAccount}
                  onChange={e => handleInputChange('bankAccount', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment QR Payload (URL/Data)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="https://..."
                  value={formData.qrCode}
                  onChange={e => handleInputChange('qrCode', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Complete Onboarding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
