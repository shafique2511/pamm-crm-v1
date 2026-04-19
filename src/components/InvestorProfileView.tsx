import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, User, Mail, Shield, ShieldCheck, BadgeCheck, Activity, Globe, Wallet, Phone, Landmark, QrCode } from 'lucide-react';
import { evaluatePasswordStrength, formatCurrency } from '../lib/utils';
import { Investor, Transaction, Trade } from '../types';

interface InvestorProfileViewProps {
  investor: Investor;
  transactions: Transaction[];
  trades: Trade[];
  onUpdateInvestor: (id: string, updates: Partial<Investor>) => void;
}

export function InvestorProfileView({ investor, transactions, trades, onUpdateInvestor }: InvestorProfileViewProps) {
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [name, setName] = useState(investor?.investorName || '');
  const [email, setEmail] = useState(investor?.email || '');
  const [phone, setPhone] = useState(investor?.phone || '');
  const [bankAccount, setBankAccount] = useState(investor?.bankAccount || '');
  const [baseCurrency, setBaseCurrency] = useState(investor?.baseCurrency || 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (investor) {
      setName(investor.investorName);
      setEmail(investor.email || '');
      setPhone(investor.phone || '');
      setBankAccount(investor.bankAccount || '');
      setBaseCurrency(investor.baseCurrency || 'USD');
    }
  }, [investor]);

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) return;
    onUpdateInvestor(investor.id, { password: newPassword });
    setPasswordMessage('Password updated successfully.');
    setNewPassword('');
    setTimeout(() => setPasswordMessage(''), 3000);
  };

  const handleProfileUpdate = () => {
    setIsSaving(true);
    onUpdateInvestor(investor.id, { investorName: name, email, phone, bankAccount, baseCurrency });
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Profile updated successfully.');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 500);
  };

  const totalFeesPaid = investor.feeCollected || 0;
  const currentCapital = investor.endingCapital || 0;
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">My Account Profile</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your personal information, security, and banking details.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-semibold border border-blue-100 dark:border-blue-800">
          <BadgeCheck className="w-4 h-4" />
          Member Tier: <span className="capitalize">{investor.group || 'Standard'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Current Balance</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(currentCapital, investor.baseCurrency)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Total Fees Paid</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalFeesPaid, investor.baseCurrency)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Account Status</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Verified</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Identity Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                <User className="w-5 h-5 text-blue-500" />
                Personal Information
              </div>
              {saveMessage && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in">{saveMessage}</span>
              )}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address (Login)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="email" 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Preferred Currency</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none"
                      value={baseCurrency}
                      onChange={e => setBaseCurrency(e.target.value)}
                    >
                      {['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'MYR', 'CHF'].map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
              <Landmark className="w-5 h-5 text-emerald-500" />
              Withdrawal & Bank Settings
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Default Bank Account / Crypto Wallet</label>
                <textarea 
                  rows={3}
                  placeholder="Enter your withdrawal details (e.g. Bank Name, IBAN, Swift, or Wallet Address)"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all resize-none"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                />
                <p className="text-xs text-slate-500 italic">This information will be used as a default target when you request withdrawals.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleProfileUpdate}
              disabled={isSaving}
              className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Synchronizing...' : 'Update Profile Settings'}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Security Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
              <Shield className="w-5 h-5 text-indigo-500" />
              Security Update
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="password" 
                    placeholder="New Password" 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                {newPassword && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">Strength</span>
                      <span className={`font-bold ${evaluatePasswordStrength(newPassword).color.replace('bg-', 'text-')}`}>
                        {evaluatePasswordStrength(newPassword).label}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div 
                          key={step}
                          className={`flex-1 rounded-full transition-all duration-500 ${
                            step <= evaluatePasswordStrength(newPassword).score 
                              ? evaluatePasswordStrength(newPassword).color 
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handlePasswordChange}
                  disabled={!newPassword.trim()}
                  className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 transition-all font-semibold"
                >
                  Change Password
                </button>

                {passwordMessage && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    {passwordMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Account Verification</h3>
              <BadgeCheck className="w-6 h-6 text-blue-200" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Email Verified</p>
                  <p className="text-[10px] text-blue-200">{investor.email || 'Not Provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">ID KYC Document</p>
                  <p className="text-[10px] text-blue-200">Verified on Registration</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center gap-3 mt-4">
                <QrCode className="w-10 h-10 text-white/50" />
                <div>
                  <p className="text-[10px] text-blue-200 font-bold uppercase">Investor ID</p>
                  <code className="text-xs bg-black/20 px-2 py-0.5 rounded">{investor.id.split('-')[0].toUpperCase()}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
