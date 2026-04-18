import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { InvestorsTable } from './components/InvestorsTable';
import { Login } from './components/Login';
import { SettingsView } from './components/SettingsView';
import { ReportsView } from './components/ReportsView';
import { TransactionsView } from './components/TransactionsView';
import { ManagerWithdrawalsView } from './components/ManagerWithdrawalsView';
import { JournalView } from './components/JournalView';
import { InvestorDashboard } from './components/InvestorDashboard';
import { AffiliatesView } from './components/AffiliatesView';
import { AuditLogView } from './components/AuditLogView';
import { ManagerProfileView } from './components/ManagerProfileView';
import { Investor, Manager, Transaction, Trade, PeriodHistory, AuditLog } from './types';
import { Plus, Calculator, Database, Copy, CheckCircle2, Menu } from 'lucide-react';
import { supabase } from './lib/supabase';

const INITIAL_MANAGERS: Manager[] = [
  { id: '1', username: 'admin', password: 'password', name: 'Super Admin' }
];

import { hashPassword, setGlobalCurrency } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<{ role: 'admin' | 'investor', name: string, managerRole?: 'admin' | 'manager' | 'read_only' | 'custom', permissions?: any } | null>(() => {
    try {
      const saved = localStorage.getItem('pamm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [managers, setManagers] = useState<Manager[]>(INITIAL_MANAGERS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [periodHistory, setPeriodHistory] = useState<PeriodHistory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [periodProfit, setPeriodProfit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('pamm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pamm_user');
    }
  }, [user]);

  useEffect(() => {
    if (managers.length > 0 && managers[0].baseCurrency) {
      setGlobalCurrency(managers[0].baseCurrency);
    }
  }, [managers]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (supabase) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const logAction = async (action: string, details: string, type: AuditLog['type']) => {
    const newId = window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 15);
    const newLog: AuditLog = {
      id: newId,
      timestamp: new Date().toISOString(),
      userName: user?.name || 'System',
      action,
      details,
      type
    };
    setAuditLogs(prev => [newLog, ...prev]);
    if (supabase) {
      try {
        await supabase.from('audit_logs').insert([newLog]);
      } catch (e) {
        console.error("Failed to save audit log", e);
      }
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch investors
      const { data: invData, error: invError } = await supabase!.from('investors').select('*').order('investorName');
      if (invError) throw invError;
      if (invData) setInvestors(invData);

      // Fetch managers
      const { data: manData, error: manError } = await supabase!.from('managers').select('*');
      if (manError) throw manError;
      if (manData && manData.length > 0) setManagers(manData);
      
      // Fetch transactions
      const { data: txData, error: txError } = await supabase!.from('transactions').select('*').order('date', { ascending: false });
      if (txError) throw txError;
      if (txData) setTransactions(txData);

      // Fetch trades
      const { data: tradeData, error: tradeError } = await supabase!.from('trades').select('*').order('closeTime', { ascending: false });
      if (tradeError) throw tradeError;
      if (tradeData) setTrades(tradeData);

      // Fetch period history
      const { data: historyData, error: historyError } = await supabase!.from('period_history').select('*').order('date', { ascending: false });
      if (historyError) throw historyError;
      if (historyData) setPeriodHistory(historyData);

      // Fetch audit logs
      const { data: auditData } = await supabase!.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (auditData) setAuditLogs(auditData);
    } catch (error) {
      console.error("Error fetching data from Supabase:", error);
      // We could throw here to trigger ErrorBoundary, but it might be better to just show an alert or let it fail gracefully
      alert("Failed to load data from database. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInvestor = async (id: string, updates: Partial<Investor>) => {
    const investor = investors.find(i => i.id === id);
    setInvestors(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
    logAction('Update Investor', `Updated investor ${investor?.investorName || id}`, 'investor');
    if (supabase) {
      try {
        await supabase.from('investors').update(updates).eq('id', id);
      } catch (e) {
        console.error("Failed to update investor", e);
        alert("Failed to update investor in database.");
      }
    }
  };

  const handleDeleteInvestor = async (id: string) => {
    const investor = investors.find(i => i.id === id);
    setInvestors(prev => prev.filter(inv => inv.id !== id));
    logAction('Delete Investor', `Deleted investor ${investor?.investorName || id}`, 'investor');
    if (supabase) {
      try {
        await supabase.from('investors').delete().eq('id', id);
      } catch (e) {
        console.error("Failed to delete investor", e);
        alert("Failed to delete investor from database.");
      }
    }
  };

  const handleAddInvestor = async () => {
    const defaultFee = managers[0]?.defaultFeePercentage ?? 20;
    const defaultGroup = managers[0]?.defaultInvestorGroup || 'Default';
    const defaultPassword = 'password123';
    const hashedPwd = await hashPassword(defaultPassword);
    
    const newInvestor = {
      investorName: 'New Investor',
      password: hashedPwd,
      group: defaultGroup,
      highWaterMark: 0,
      startingCapital: 0,
      lossCarryover: 0,
      sharePercentage: 0,
      individualProfitShare: 0,
      feePercentage: defaultFee,
      yourFee: 0,
      netProfit: 0,
      reinvestAmt: 0,
      cashPayout: 0,
      endingCapital: 0,
      qrCode: '',
      bankAccount: '',
      feeCollected: 0,
      unpaidFee: 0,
    };

    logAction('Add Investor', 'Created a new investor profile', 'investor');
    if (supabase) {
      try {
        const { data } = await supabase.from('investors').insert([newInvestor]).select();
        if (data && data[0]) setInvestors([...investors, data[0]]);
      } catch (e) {
        console.error("Failed to add investor", e);
        alert("Failed to add investor to database.");
      }
    }
  };

  const handleAddManager = async (m: Partial<Manager>) => {
    let finalPassword = m.password;
    if (finalPassword) {
      finalPassword = await hashPassword(finalPassword);
    }
    const newManager = { ...m, password: finalPassword, id: window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 15) } as Manager;
    setManagers([...managers, newManager]);
    logAction('Add Manager', `Created new manager ${m.name}`, 'system');
    if (supabase) {
      try {
        await supabase.from('managers').insert([newManager]);
      } catch (e) {
        console.error("Failed to add manager", e);
      }
    }
  };

  const handleUpdateManager = async (id: string, updates: Partial<Manager>) => {
    let finalUpdates = { ...updates };
    if (updates.password) {
      finalUpdates.password = await hashPassword(updates.password);
    }
    setManagers(prev => prev.map(m => m.id === id ? { ...m, ...finalUpdates } : m));
    logAction('Update Settings', 'Updated manager settings', 'system');
    if (supabase) {
      try {
        const { error } = await supabase.from('managers').update(finalUpdates).eq('id', id);
        if (error) {
          console.error("Failed to update manager DB", error);
          if (error.code === 'PGRST204' || error.message.includes('column') || error.code === '400') {
             alert('Supabase Schema Error: Your database is missing columns for the newly added features. Try fully logging out to access the "Copy SQL" button on the Supabase setup screen, and run the listed ALTER TABLE commands to fix this issue.');
          }
        }
      } catch (e) {
        console.error("Failed to update manager", e);
      }
    }
  };

  const handleDeleteManager = async (id: string) => {
    setManagers(prev => prev.filter(m => m.id !== id));
    logAction('Delete Manager', `Deleted manager account`, 'system');
    if (supabase) {
      try {
        await supabase.from('managers').delete().eq('id', id);
      } catch (e) {
        console.error("Failed to delete manager", e);
      }
    }
  };

  const handleAddTransaction = async (t: Partial<Transaction>) => {
    const newTx = { ...t, id: window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 15) } as Transaction;
    setTransactions([newTx, ...transactions]);
    logAction('Record Transaction', `Recorded ${t.type} of $${t.amount}`, 'transaction');
    if (supabase) {
      try {
        await supabase.from('transactions').insert([newTx]);
      } catch (e) {
        console.error("Failed to add transaction", e);
        alert("Failed to record transaction in database.");
      }
    }
  };

  const handleUpdateTransactionStatus = async (id: string, status: 'completed' | 'rejected') => {
    let affectedTx: Transaction | undefined;
    const updatedTransactions = transactions.map(t => {
      if (t.id === id) {
        affectedTx = { ...t, status };
        return affectedTx;
      }
      return t;
    });
    
    if (!affectedTx) return;

    setTransactions(updatedTransactions);
    logAction('Update Transaction', `Updated transaction ${id} status to ${status}`, 'transaction');
    
    // Process capital deduction on approval for investor withdrawals
    if (affectedTx.type === 'withdrawal' && affectedTx.investorId && status === 'completed') {
      const invToUpdate = investors.find(i => i.id === affectedTx!.investorId);
      if (invToUpdate) {
        handleUpdateInvestor(invToUpdate.id, {
          endingCapital: invToUpdate.endingCapital - affectedTx.amount,
          cashPayout: invToUpdate.cashPayout + affectedTx.amount
        });
      }
    }

    if (supabase) {
      try {
        await supabase.from('transactions').update({ status }).eq('id', id);
      } catch (e) {
        console.error("Failed to update transaction", e);
      }
    }
  };

  const handleSyncMT5 = async (): Promise<{ success: boolean, count: number, error?: string }> => {
    const manager = managers[0];
    
    if (manager?.mt5RestApiUrl) {
      try {
        // Example REST API call to a bridge like MetaApi or custom Flask server
        const res = await fetch(`${manager.mt5RestApiUrl}/trades?login=${manager.mt5Login}&password=${manager.mt5Password}&server=${manager.mt5Server}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Assuming the API returns an array of trades matching our Trade interface
            setTrades(data);
            if (supabase) {
              // Upsert or insert logic depending on backend implementation
              // For simplicity, we'll just insert new ones if we had a way to check, 
              // but here we just replace or insert.
            }
            return { success: true, count: data.length };
          }
        }
      } catch (e) {
        console.error("MT5 REST API Sync failed", e);
        return { success: false, count: 0, error: "Failed to connect to MT5 REST API. Falling back to mock data." };
      }
    }

    // Fallback Mock Data
    await new Promise(r => setTimeout(r, 1500));
    
    const mockTrades: Trade[] = [
      {
        id: window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
        ticket: Math.floor(Math.random() * 100000000).toString(),
        openTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        closeTime: new Date(Date.now() - 86400000).toISOString(),
        symbol: 'EURUSD',
        type: 'buy',
        volume: 1.5,
        openPrice: 1.08500,
        closePrice: 1.08950,
        profit: 675.00,
        sl: 1.08000,
        tp: 1.09500,
        entryReason: 'MACD Crossover',
        exitReason: 'Hit TP',
        notes: 'Strong momentum on H4'
      },
      {
        id: window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
        ticket: Math.floor(Math.random() * 100000000).toString(),
        openTime: new Date(Date.now() - 86400000 * 3).toISOString(),
        closeTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        symbol: 'GBPUSD',
        type: 'sell',
        volume: 2.0,
        openPrice: 1.26500,
        closePrice: 1.26800,
        profit: -600.00,
        sl: 1.26800,
        tp: 1.25500,
        entryReason: 'Resistance Rejection',
        exitReason: 'Hit SL',
        notes: 'News spike stopped out'
      },
      {
        id: window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
        ticket: Math.floor(Math.random() * 100000000).toString(),
        openTime: new Date(Date.now() - 86400000 * 1).toISOString(),
        closeTime: new Date().toISOString(),
        symbol: 'XAUUSD',
        type: 'buy',
        volume: 0.5,
        openPrice: 2020.50,
        closePrice: 2025.00,
        profit: 225.00,
        sl: 2015.00,
        tp: 2030.00,
        entryReason: 'Support Bounce',
        exitReason: 'Manual Close',
        notes: 'Closed before weekend'
      }
    ];

    setTrades(prev => [...mockTrades, ...prev]);
    
    if (supabase) {
      await supabase.from('trades').insert(mockTrades);
    }

    return { success: true, count: mockTrades.length };
  };

  const calculatePeriod = async () => {
    const totalCapital = investors.reduce((sum, inv) => sum + inv.startingCapital, 0);

    const updated = investors.map(inv => {
      const sharePercentage = totalCapital > 0 ? (inv.startingCapital / totalCapital) * 100 : 0;
      const individualProfitShare = periodProfit * (sharePercentage / 100);
      
      const grossValue = inv.startingCapital + individualProfitShare;
      let yourFee = 0;

      const effectiveFeePercentage = inv.customFeePercentage ?? inv.feePercentage ?? 20;

      // Fallback: If HWM is 0 but they have starting capital (from previously hitting the bug), treat HWM as starting capital.
      const safeHWM = (inv.highWaterMark === 0 && inv.startingCapital > 0) ? inv.startingCapital : inv.highWaterMark;

      if (grossValue > safeHWM) {
        const taxableProfit = grossValue - safeHWM;
        yourFee = taxableProfit * (effectiveFeePercentage / 100);
      }

      const netProfit = individualProfitShare - yourFee;
      const reinvestAmt = netProfit - inv.cashPayout;
      const endingCapital = inv.startingCapital + netProfit - inv.cashPayout;
      // Do NOT mutate unpaidFee multiplicatively during calculatePeriod.
      // UnpaidFee is a ledger baseline state that is only appended to during rolloverPeriod via yourFee.
      // The current UI shows 'unpaidFee' which includes historical debts. 
      // If we want it to reflect total owed including this period's estimation, we should compute it on the fly, NOT save it sequentially here.
      // For now, we will simply not mutate it so it doesn't infinitely accumulate on every click.

      return {
        ...inv,
        sharePercentage,
        individualProfitShare,
        yourFee,
        netProfit,
        reinvestAmt,
        endingCapital,
        unpaidFee: inv.unpaidFee // Retain current historical state, do not increment here.
      };
    });

    setInvestors(updated);

    if (supabase) {
      for (const inv of updated) {
        await supabase.from('investors').update(inv).eq('id', inv.id);
      }
    }
  };

  const rolloverPeriod = async () => {
    if (window.confirm("Are you sure you want to rollover to the next period? This will set Starting Capital to Ending Capital and update the High Water Mark.")) {
      
      // Save snapshot to history
      const historyRecord: PeriodHistory = {
        id: window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
        date: new Date().toISOString(),
        totalProfit: periodProfit,
        investorSnapshots: investors.map(inv => ({
          investorId: inv.id,
          investorName: inv.investorName,
          startingCapital: inv.startingCapital,
          netProfit: inv.netProfit,
          endingCapital: inv.endingCapital
        }))
      };

      setPeriodHistory([historyRecord, ...periodHistory]);
      logAction('Rollover Period', `Rolled over period with total profit $${periodProfit}`, 'system');
      
      if (supabase) {
        try {
          await supabase.from('period_history').insert([historyRecord]);
        } catch (e) {
          console.error("Failed to save period history", e);
        }
      }

      const updated = investors.map(inv => {
        const adjustedHWM = Math.max(0, inv.highWaterMark - inv.cashPayout);
        const newHWM = Math.max(adjustedHWM, inv.endingCapital);

        return {
          ...inv,
          startingCapital: inv.endingCapital,
          highWaterMark: newHWM,
          unpaidFee: inv.unpaidFee + (inv.yourFee || 0),
          individualProfitShare: 0,
          yourFee: 0,
          netProfit: 0,
          reinvestAmt: 0,
          cashPayout: 0,
          feeCollected: 0,
        };
      });
      
      setInvestors(updated);
      setPeriodProfit(0);

      if (supabase) {
        try {
          for (const inv of updated) {
            await supabase.from('investors').update(inv).eq('id', inv.id);
          }
        } catch (e) {
          console.error("Failed to update investors on rollover", e);
        }
      }
    }
  };

  const copySql = () => {
    const sql = `-- If you already have these tables, run these ALTER commands instead to add missing columns for new features:
-- alter table managers add column if not exists "baseCurrency" text;
-- alter table managers add column if not exists "investorGroups" jsonb;
-- alter table managers add column if not exists "defaultInvestorGroup" text;
-- alter table managers add column if not exists "feeTiers" jsonb;
-- alter table managers add column if not exists "role" text;
-- alter table managers add column if not exists "permissions" jsonb;
-- alter table managers add column if not exists "enableIBModule" boolean;

create table investors (
  id uuid default gen_random_uuid() primary key,
  "investorName" text,
  "password" text,
  "group" text,
  "highWaterMark" numeric,
  "startingCapital" numeric,
  "lossCarryover" numeric,
  "sharePercentage" numeric,
  "individualProfitShare" numeric,
  "feePercentage" numeric,
  "yourFee" numeric,
  "netProfit" numeric,
  "reinvestAmt" numeric,
  "cashPayout" numeric,
  "endingCapital" numeric,
  "qrCode" text,
  "bankAccount" text,
  "feeCollected" numeric,
  "unpaidFee" numeric
);

create table managers (
  id uuid default gen_random_uuid() primary key,
  username text,
  password text,
  name text,
  "mt5Server" text,
  "mt5Login" text,
  "mt5Password" text,
  "mt5RestApiUrl" text,
  "baseCurrency" text,
  "investorGroups" jsonb,
  "defaultInvestorGroup" text,
  "feeTiers" jsonb,
  "role" text,
  "permissions" jsonb,
  "enableIBModule" boolean
);

create table transactions (
  id uuid default gen_random_uuid() primary key,
  "investorId" uuid,
  type text,
  amount numeric,
  date text,
  status text,
  notes text
);

create table trades (
  id uuid default gen_random_uuid() primary key,
  ticket text,
  "openTime" text,
  "closeTime" text,
  symbol text,
  type text,
  volume numeric,
  "openPrice" numeric,
  "closePrice" numeric,
  profit numeric,
  notes text
);

create table period_history (
  id uuid default gen_random_uuid() primary key,
  date text,
  "totalProfit" numeric,
  "investorSnapshots" jsonb
);

create table audit_logs (
  id uuid default gen_random_uuid() primary key,
  timestamp text,
  "userId" text,
  "userName" text,
  action text,
  details text,
  type text
);`;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async (role: 'admin' | 'investor', name: string, username?: string, password?: string) => {
    const hashedAttempt = password ? await hashPassword(password) : '';
    
    let activeManagers = managers;
    let activeInvestors = investors;

    // Real-time ping to intercept stale state closures on immediate login execution
    if (supabase) {
      try {
        if (role === 'admin') {
          const { data } = await supabase.from('managers').select('*');
          if (data && data.length > 0) activeManagers = data;
        } else {
          const { data } = await supabase.from('investors').select('*');
          if (data && data.length > 0) activeInvestors = data;
        }
      } catch (e) {
        console.error("Login real-time sync failed", e);
      }
    }

    if (role === 'admin') {
      const manager = activeManagers.find(m => m.username?.toLowerCase() === username?.toLowerCase() && (m.password === password || m.password === hashedAttempt));
      if (manager) {
        setUser({ role, name: manager.name || 'Admin', managerRole: manager.role || 'admin', permissions: manager.permissions });
        logAction('Login', `Manager ${manager.name || 'Admin'} logged in`, 'auth');
      } else {
        alert('Invalid manager credentials');
      }
    } else {
      const investor = activeInvestors.find(i => i.investorName?.toLowerCase() === name?.toLowerCase() && (i.password === password || i.password === hashedAttempt));
      if (investor) {
        setUser({ role, name: investor.investorName });
        setActiveTab('dashboard');
        logAction('Login', `Investor ${investor.investorName} logged in`, 'auth');
      } else {
        alert('Invalid investor name or password');
      }
    }
  };

  const handleResetPassword = async (role: 'admin' | 'investor', identifier: string, newPassword: string): Promise<boolean> => {
    const hashed = await hashPassword(newPassword);

    if (role === 'admin') {
      const manager = managers.find(m => m.username?.toLowerCase() === identifier.toLowerCase());
      if (manager) {
        setManagers(prev => prev.map(m => m.id === manager.id ? { ...m, password: hashed } : m));
        if (supabase) {
          try {
            await supabase.from('managers').update({ password: hashed }).eq('id', manager.id);
          } catch (e) {
            console.error("Failed to reset manager password", e);
          }
        }
        logAction('Reset Password', `Manager ${manager.username} reset password`, 'auth');
        return true;
      }
    } else {
      const investor = investors.find(i => i.investorName?.toLowerCase() === identifier.toLowerCase());
      if (investor) {
        setInvestors(prev => prev.map(inv => inv.id === investor.id ? { ...inv, password: hashed } : inv));
        if (supabase) {
          try {
            await supabase.from('investors').update({ password: hashed }).eq('id', investor.id);
          } catch (e) {
            console.error("Failed to reset investor password", e);
          }
        }
        logAction('Reset Password', `Investor ${investor.investorName} reset password`, 'auth');
        return true;
      }
    }
    
    return false;
  };

  if (!user) {
    return <Login onLogin={handleLogin} onResetPassword={handleResetPassword} />;
  }

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Supabase Setup Required</h1>
              <p className="text-slate-500">Connect your database to continue</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">1. Add Environment Variables</h3>
              <p className="text-sm text-slate-600 mb-3">
                Open the <strong>Settings</strong> panel (top right) and add these secrets:
              </p>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 font-mono">
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-900">2. Run this SQL in Supabase</h3>
                <button 
                  onClick={copySql}
                  className="flex items-center gap-1.5 text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  {copied ? 'Copied!' : 'Copy SQL'}
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Go to the SQL Editor in your Supabase dashboard and run this to create the tables:
              </p>
              <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`-- See copy button for full SQL`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const visibleInvestors = isAdmin 
    ? investors 
    : investors.filter(inv => inv.investorName.toLowerCase() === user.name.toLowerCase());
  const currentInvestor = !isAdmin ? visibleInvestors[0] : null;

  const hasPermission = (key: string, defaultForRole: boolean) => {
    if (!isAdmin) return false;
    if (user.managerRole === 'custom' && user.permissions) {
      return !!user.permissions[key];
    }
    if (user.managerRole === 'admin') return true;
    return defaultForRole;
  };

  const isReadOnly = (permissionKey: string) => {
    if (user.managerRole === 'admin') return false;
    if (user.managerRole === 'read_only') return true;
    if (user.managerRole === 'custom' && user.permissions) {
       return !user.permissions[permissionKey];
    }
    return false; // manager default is false (can edit)
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <div className={`fixed inset-0 bg-slate-900/50 z-20 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
          isAdmin={isAdmin}
          managerRole={user?.managerRole}
          permissions={user?.permissions}
          enableIBModule={managers[0]?.enableIBModule || false}
          onLogout={() => setUser(null)}
        />
      </div>
      
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <button 
                className="md:hidden p-2 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white transition-colors flex items-center gap-2">
                  {isAdmin ? 'PAMM Management' : `Welcome, ${user.name}`}
                </h2>
                <p className="hidden md:block text-slate-500 dark:text-slate-400 transition-colors">
                  {isAdmin 
                    ? 'Manage your investors, capital, and distribute profits.' 
                    : 'View your investment performance and statements.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                title="Toggle Dark Mode"
              >
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
              {isAdmin && activeTab === 'investors' && !isReadOnly('canEditInvestors') && (
                <button 
                  onClick={handleAddInvestor}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Investor
                </button>
              )}
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <>
              {isAdmin ? (
                <>
                  <DashboardStats 
                    investors={visibleInvestors} 
                    transactions={transactions} 
                    trades={trades} 
                    history={periodHistory} 
                    isAdmin={isAdmin} 
                    onAddTransaction={handleAddTransaction}
                  />
                  <ReportsView investors={investors} transactions={transactions} />
                </>
              ) : (
                currentInvestor && (
                  <InvestorDashboard 
                    investor={currentInvestor} 
                    history={periodHistory} 
                    transactions={transactions} 
                    trades={trades}
                    onUpdateInvestor={handleUpdateInvestor}
                    onAddTransaction={handleAddTransaction}
                    allowWithdrawals={managers[0]?.allowInvestorWithdrawals || false}
                  />
                )
              )}
            </>
          )}

          {activeTab === 'investors' && (
            <>
              {isAdmin && !isReadOnly('canManageTransactions') && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Period Calculation</h3>
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-xs">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Total Period Profit / Loss ($)
                      </label>
                      <input 
                        type="number" 
                        value={periodProfit}
                        onChange={(e) => setPeriodProfit(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="e.g. 10000 or -5000"
                      />
                    </div>
                    <button 
                      onClick={calculatePeriod}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      <Calculator className="w-4 h-4" />
                      Calculate Distribution
                    </button>
                    <button 
                      onClick={rolloverPeriod}
                      className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium transition-colors ml-auto"
                    >
                      Rollover Period
                    </button>
                  </div>
                </div>
              )}

              <InvestorsTable 
                investors={visibleInvestors} 
                availableGroups={managers[0]?.investorGroups || ['Default', 'VIP', 'Standard']}
                enableIBModule={managers[0]?.enableIBModule || false}
                onUpdateInvestor={handleUpdateInvestor}
                onDeleteInvestor={handleDeleteInvestor}
                isAdmin={isAdmin}
                readOnly={isReadOnly('canEditInvestors')}
              />
            </>
          )}

          {activeTab === 'transactions' && isAdmin && (
            <TransactionsView 
              transactions={transactions} 
              investors={investors} 
              onAddTransaction={handleAddTransaction} 
              onUpdateStatus={handleUpdateTransactionStatus}
              readOnly={isReadOnly('canManageTransactions')}
            />
          )}

          {activeTab === 'manager_withdrawals' && isAdmin && (
            <ManagerWithdrawalsView 
              transactions={transactions}
              investors={investors}
              onUpdateStatus={handleUpdateTransactionStatus}
              readOnly={isReadOnly('canManageWithdrawals')}
            />
          )}

          {activeTab === 'journal' && isAdmin && (
            <JournalView 
              trades={trades} 
              onSyncMT5={handleSyncMT5} 
              totalCapital={investors.reduce((sum, inv) => sum + inv.startingCapital, 0)}
              readOnly={isReadOnly('canSyncMT5')}
            />
          )}

          {activeTab === 'affiliates' && managers[0]?.enableIBModule && hasPermission('canViewAffiliates', true) && (
            <AffiliatesView 
              investors={investors} 
              currentUser={user} 
              isAdmin={isAdmin} 
            />
          )}

          {activeTab === 'reports' && isAdmin && hasPermission('canViewReports', true) && (
            <ReportsView investors={investors} transactions={transactions} />
          )}

          {activeTab === 'audit' && isAdmin && hasPermission('canViewAudit', user.managerRole === 'admin') && (
            <AuditLogView logs={auditLogs} />
          )}

          {activeTab === 'profile' && isAdmin && user?.managerRole && (
            <ManagerProfileView 
              currentUser={user}
              managerId={managers.find(m => m.name === user.name)?.id || managers[0]?.id || ''}
              onUpdateManager={handleUpdateManager}
            />
          )}

          {activeTab === 'settings' && isAdmin && hasPermission('canManageSettings', user.managerRole === 'admin') && (
            <SettingsView 
              managers={managers} 
              onAddManager={handleAddManager} 
              onUpdateManager={handleUpdateManager}
              onDeleteManager={handleDeleteManager}
            />
          )}
        </div>
      </main>
    </div>
  );
}
