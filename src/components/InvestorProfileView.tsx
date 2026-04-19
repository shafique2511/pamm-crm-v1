import React, { useState } from 'react';
import { Investor } from '../types';
import { User, Key, Building2, QrCode, Save, CheckCircle2, Phone, Flag, Mail, Bell } from 'lucide-react';
import { hashPassword, formatCurrency } from '../lib/utils';

export function InvestorProfileView({ investor, onUpdateInvestor }: { investor: Investor, onUpdateInvestor: (id: string, updates: Partial<Investor>) => void }) {
  const [newPassword, setNewPassword] = useState('');
  
  // Form states
  const [bankAccount, setBankAccount] = useState(investor.bankAccount || '');
  const [qrCodeData, setQrCodeData] = useState(investor.qrCode || '');
  const [phone, setPhone] = useState(investor.phone || '');
  const [email, setEmail] = useState(investor.email || '');
  const [country, setCountry] = useState(investor.country || '');
  const [emailNotifications, setEmailNotifications] = useState(investor.emailNotifications || false);

  const [statusMessage, setStatusMessage] = useState('');

  const handleUpdateProfile = () => {
    onUpdateInvestor(investor.id, {
      bankAccount,
      qrCode: qrCodeData,
      phone,
      email,
      country,
      emailNotifications
    });
    setStatusMessage('Profile updated successfully.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) return;
    const hashed = await hashPassword(newPassword);
    onUpdateInvestor(investor.id, { password: hashed });
    setStatusMessage('Password updated successfully.');
    setNewPassword('');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
            <User className="w-8 h-8 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent"></div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{investor.investorName}</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manage your personal details, alerts, and payment preferences</p>
          </div>
        </div>
        <button 
          onClick={handleUpdateProfile}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 font-bold shadow-lg active:scale-95 transition-all w-full md:w-auto justify-center"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium shadow-sm">
          <CheckCircle2 className="w-5 h-5" />
          {statusMessage}
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 opacity-10 rounded-full blur-xl -mr-6 -mt-6"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 relative z-10">Current Balance</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white relative z-10">{formatCurrency(investor.endingCapital, investor.baseCurrency || 'USD')}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500 opacity-10 rounded-full blur-xl -mr-6 -mt-6"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 relative z-10">Total Fees Paid</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500 relative z-10">{formatCurrency(investor.feeCollected, investor.baseCurrency || 'USD')}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500 opacity-10 rounded-full blur-xl -mr-6 -mt-6"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 relative z-10">Account Status</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 capitalize relative z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            {investor.status || 'Active'}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500 opacity-10 rounded-full blur-xl -mr-6 -mt-6"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 relative z-10">Member Tier</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-500 capitalize relative z-10">{investor.memberTier || investor.group || 'Standard'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal & Info */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="investor@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Country</label>
              <div className="relative">
                <Flag className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="e.g. United Kingdom"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Preferences */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Account Security</h3>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                <input 
                   type="password" 
                   placeholder="Leave blank to keep current"
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm dark:text-white"
                   value={newPassword}
                   onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <button 
                onClick={handlePasswordChange}
                disabled={!newPassword.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                <Key className="w-4 h-4" />
                Update Password
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Preferences</h3>
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${emailNotifications ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={emailNotifications}
                onChange={() => setEmailNotifications(!emailNotifications)}
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                Email Notifications (Statements & Alerts)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Payout Details */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Payout & Withdrawal Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Details / Crypto Address</label>
            <textarea 
               rows={4}
               placeholder="e.g. Bank Name, Account Number, Routing/Swift OR Crypto Wallet Address"
               className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white resize-none"
               value={bankAccount}
               onChange={e => setBankAccount(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">These details will be used for your withdrawals.</p>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receiving QR Code (Data/URL)</label>
            <div className="relative">
               <QrCode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                  type="text" 
                  placeholder="e.g. USDT TRC20 Address or Invoice URL"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                  value={qrCodeData}
                  onChange={e => setQrCodeData(e.target.value)}
               />
            </div>
            <p className="text-xs text-slate-500 mt-1">Optional. Provide a data link to render a fast-payment QR code for managers.</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 border border-slate-200 dark:border-slate-700/50">
        <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-slate-200 dark:shadow-none">
           <Building2 className="w-8 h-8 text-slate-400" />
        </div>
        <div className="w-full text-center md:text-left">
           <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4">PAMM Association Details</h4>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700">
                 <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Account Group</span>
                 <span className="font-bold text-slate-900 dark:text-slate-200">{investor.group || 'Standard'}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700">
                 <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Joined Date</span>
                 <span className="font-bold text-slate-900 dark:text-slate-200">{investor.joinedAt ? new Date(investor.joinedAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700">
                 <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</span>
                 <span className="font-black text-emerald-600 dark:text-emerald-400 capitalize flex items-center justify-center md:justify-start gap-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   {investor.status || 'Active'}
                 </span>
              </div>
              <div className="bg-white dark:bg-slate-800 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                 <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Display Currency</span>
                 <select 
                    value={investor.baseCurrency || 'USD'}
                    onChange={e => onUpdateInvestor(investor.id, { baseCurrency: e.target.value })}
                    className="w-full bg-transparent font-black text-indigo-600 dark:text-indigo-400 outline-none text-base tracking-tight cursor-pointer"
                 >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="MYR">MYR (RM)</option>
                    <option value="CHF">CHF (Fr)</option>
                 </select>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
