import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, User, Mail, Shield, ShieldCheck, ShieldAlert, BadgeCheck, Activity, Zap, Info, Globe, BarChart3, TrendingUp, Users, Wallet, Clock } from 'lucide-react';
import { evaluatePasswordStrength, formatCurrency } from '../lib/utils';
import { Manager, AccessPermissions, Investor, Transaction, Trade, AuditLog } from '../types';

interface ManagerProfileViewProps {
  manager: Manager;
  investors: Investor[];
  transactions: Transaction[];
  trades: Trade[];
  auditLogs: AuditLog[];
  onUpdateManager: (id: string, updates: Partial<Manager>) => void;
}

export function ManagerProfileView({ manager, investors, transactions, trades, auditLogs, onUpdateManager }: ManagerProfileViewProps) {
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [name, setName] = useState(manager?.name || '');
  const [baseCurrency, setBaseCurrency] = useState(manager?.baseCurrency || 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (manager) {
      setName(manager.name);
      setBaseCurrency(manager.baseCurrency || 'USD');
    }
  }, [manager]);

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) return;
    onUpdateManager(manager.id, { password: newPassword });
    setPasswordMessage('Password updated successfully.');
    setNewPassword('');
    setTimeout(() => setPasswordMessage(''), 3000);
  };

  const handleProfileUpdate = () => {
    setIsSaving(true);
    onUpdateManager(manager.id, { name, baseCurrency });
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Profile updated successfully.');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 500);
  };

  const permissions = manager?.permissions || {};
  const roleLabel = manager?.role?.replace('_', ' ') || 'Manager';

  const permissionList = [
    { key: 'canEditInvestors', label: 'Edit Investors', icon: ShieldCheck },
    { key: 'canManageTransactions', label: 'Manage Transactions', icon: ShieldCheck },
    { key: 'canManageWithdrawals', label: 'Manage Withdrawals', icon: ShieldCheck },
    { key: 'canSyncMT5', label: 'Sync MT5/Broker', icon: Zap },
    { key: 'canViewReports', label: 'View Reports', icon: Activity },
    { key: 'canViewAudit', label: 'View Audit Logs', icon: Info },
    { key: 'canManageSettings', label: 'System Settings', icon: ShieldAlert },
    { key: 'canViewAffiliates', label: 'Affiliates Management', icon: ShieldCheck },
  ];

  const totalInvestorCapital = investors.reduce((sum, inv) => sum + inv.startingCapital, 0);
  const totalFeesEarned = investors.reduce((sum, inv) => sum + inv.feeCollected, 0);
  const activeInvestorsCount = investors.filter(i => i.startingCapital > 0).length;
  const totalTradesCount = trades.length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Profile Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your identity, security, and account permissions.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-semibold border border-indigo-100 dark:border-indigo-800">
          <BadgeCheck className="w-4 h-4" />
          Rank: <span className="capitalize">{roleLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Fees Collected</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalFeesEarned)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Capital Under Management</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalInvestorCapital)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Active Investors</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{activeInvestorsCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Trades Executed</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{totalTradesCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Info & Security */}
        <div className="lg:col-span-2 space-y-8">
          {/* Identity Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                <User className="w-5 h-5 text-blue-500" />
                Personal Identity
              </div>
              {saveMessage && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in">{saveMessage}</span>
              )}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
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
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed outline-none"
                      value={manager?.username || ''}
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Base Currency</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none"
                      value={baseCurrency}
                      onChange={e => setBaseCurrency(e.target.value)}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleProfileUpdate}
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                <Shield className="w-5 h-5 text-indigo-500" />
                Security & Authentication
              </div>
            </div>
            <div className="p-6">
              <div className="max-w-xl">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Improve your account security by updating your password regularly with a strong combination of characters.</p>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input 
                        type="password" 
                        placeholder="New Secure Password" 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={handlePasswordChange}
                      disabled={!newPassword.trim()}
                      className="px-6 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 transition-all font-semibold"
                    >
                      Update Password
                    </button>
                  </div>

                  {newPassword && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-500">Security Strength:</span>
                        <span className={`font-bold ${evaluatePasswordStrength(newPassword).color.replace('bg-', 'text-')}`}>
                          {evaluatePasswordStrength(newPassword).label}
                        </span>
                      </div>
                      <div className="flex gap-1 h-1.5">
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

                  {passwordMessage && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">{passwordMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Permissions & Status */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Access Privileges
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {permissionList.map(({ key, label, icon: Icon }) => {
                  const hasAccess = manager?.role === 'admin' || (permissions as any)[key];
                  return (
                    <div key={key} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${hasAccess ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-50 text-slate-400 dark:bg-slate-900/50'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-sm ${hasAccess ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                          {label}
                        </span>
                      </div>
                      {hasAccess ? (
                        <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {manager?.role !== 'admin' && (
                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      Your permissions are managed by the System Administrator. Reach out if you need additional access.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
            <Activity className="w-5 h-5 text-orange-500" />
            Your Recent Activity
          </div>
        </div>
        <div className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {auditLogs.filter(l => l.userName === manager?.name).slice(0, 5).map((log) => (
              <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{log.action}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{log.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            {auditLogs.filter(l => l.userName === manager?.name).length === 0 && (
              <div className="p-8 text-center text-slate-400 italic text-sm">
                No recent activity recorded for this session.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
