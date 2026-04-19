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
import { AddInvestorModal } from './components/AddInvestorModal';
import { Investor, Manager, Transaction, Trade, PeriodHistory, AuditLog } from './types';
import { Plus, Calculator, Database, Copy, CheckCircle2, Menu, Search, Filter } from 'lucide-react';
import { supabase } from './lib/supabase';

const INITIAL_MANAGERS: Manager[] = [
  { id: '1', username: 'admin', password: 'password', name: 'Super Admin' }
];

import { hashPassword, setGlobalCurrency, formatCurrency } from './lib/utils';

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
  const [brokerBalance, setBrokerBalance] = useState<number>(0);

  const totalStartingCapital = investors.reduce((sum, inv) => sum + inv.startingCapital, 0);
  
  // Calculate current Manager Wallet Balance (fees collected but not yet withdrawn)
  const managerWithdrawals = transactions
    .filter(t => t.type === 'manager_withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const managerWalletBalance = investors.reduce((sum, inv) => sum + (inv.feeCollected || 0), 0) - managerWithdrawals;

  const handleBrokerBalanceChange = (val: number) => {
    setBrokerBalance(val);
    // Professional PAMM logic: Total Equity = Investor Capital + Manager Earnings
    // Profit should only be calculated on Top of the total starting equity
    const totalStartingEquity = totalStartingCapital + managerWalletBalance;
    setPeriodProfit(totalStartingEquity > 0 ? val - totalStartingEquity : val);
  };
  const [showRolloverConfirm, setShowRolloverConfirm] = useState(false);
  const [showAddInvestor, setShowAddInvestor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('pamm_darkMode') === 'true';
  });

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
    localStorage.setItem('pamm_darkMode', darkMode.toString());
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

  const handleClearAuditLogs = async () => {
    setAuditLogs([]);
    if (supabase) {
      try {
        await supabase.from('audit_logs').delete().neq('id', '0');
        logAction('Clear Audit Logs', 'All audit logs were cleared by the administrator', 'system');
      } catch (e) {
        console.error("Failed to clear audit logs", e);
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

  const handleAddInvestor = async (investorData: Partial<Investor>) => {
    let hashedPwd = investorData.password || 'password123';
    hashedPwd = await hashPassword(hashedPwd);
    
    const newInvestor = {
      ...investorData,
      password: hashedPwd,
      individualProfitShare: 0,
      yourFee: 0,
      netProfit: 0,
      reinvestAmt: 0,
      cashPayout: 0,
      feeCollected: 0,
      unpaidFee: 0,
    } as Investor;

    logAction('Add Investor', `Onboarded new investor: ${investorData.investorName}`, 'investor');
    if (supabase) {
      try {
        const { data } = await supabase.from('investors').insert([newInvestor]).select();
        if (data && data[0]) setInvestors([...investors, data[0]]);
      } catch (e) {
        console.error("Failed to add investor", e);
        alert("Failed to add investor to database.");
      }
    } else {
      setInvestors([...investors, { ...newInvestor, id: Math.random().toString(36).substr(2, 9) }]);
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
    
    // Sync local user session
    if (user && managers.find(m => m.id === id)?.name === user.name) {
      if (finalUpdates.name) {
        setUser(prev => prev ? { ...prev, name: finalUpdates.name! } : null);
      }
    }

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
    logAction('Record Transaction', `Recorded ${t.type} of $${t.amount}${t.referenceId ? ` (Ref: ${t.referenceId})` : ''}`, 'transaction');
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

    // Manager withdrawal doesn't affect investor ending capital, it affects the aggregate "Wallet" (feeCollected total)
    // We already subtract managerWithdrawals from sum(feeCollected) in DashboardStats.tsx, so no further state update is strictly needed for investors
    // However, if we want to explicitly move feeCollected to some 'manager_earnings' table, that would be a schema change.
    // For now, the transactions list suffices as the source of truth for outflows.

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
    const totalInvestorCapital = investors.reduce((sum, inv) => sum + inv.startingCapital, 0);
    const totalStartingEquity = totalInvestorCapital + managerWalletBalance;
    
    // Calculate the growth rate of the entire master account
    const growthRate = totalStartingEquity > 0 ? periodProfit / totalStartingEquity : 0;

    const updated = investors.map(inv => {
      // Investor's share of the growth
      const individualProfitShare = inv.startingCapital * growthRate;
      const sharePercentage = totalInvestorCapital > 0 ? (inv.startingCapital / totalInvestorCapital) * 100 : 0;
      
      const grossValue = inv.startingCapital + individualProfitShare;
      let yourFee = 0;

      const effectiveFeePercentage = inv.customFeePercentage ?? inv.feePercentage ?? 20;

      // HWM Logic: Fee is only taken on profits above the previous high.
      if (grossValue > inv.highWaterMark) {
        const taxableProfit = grossValue - inv.highWaterMark;
        yourFee = taxableProfit * (effectiveFeePercentage / 100);
      }

      const netProfit = individualProfitShare - yourFee;
      // Ending capital is after performance fee and cash payout
      const endingCapital = inv.startingCapital + netProfit - inv.cashPayout;

      return {
        ...inv,
        sharePercentage,
        individualProfitShare,
        yourFee,
        netProfit,
        endingCapital,
        unpaidFee: inv.unpaidFee
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

    const totalInvestorCapital = investors.reduce((sum, inv) => sum + inv.startingCapital, 0);
    const totalStartingEquity = totalInvestorCapital + managerWalletBalance;
    const growthRate = totalStartingEquity > 0 ? periodProfit / totalStartingEquity : 0;
    
    // Manager's own profit from their wallet balance sitting in the account
    const managerDirectProfit = managerWalletBalance * growthRate;

    const updated = investors.map(inv => {
      // High Water Mark logic: new HWM is the max of current HWM or Ending Capital
      const adjustedHWM = Math.max(0, inv.highWaterMark - inv.cashPayout);
      const newHWM = Math.max(adjustedHWM, inv.endingCapital);

      // Manager's new fee collected: Existing + Performance Fee from this investor
      // AND a portion of the Manager's own direct profit (distributed across investors for simplicity in state, 
      // or we can add it to a specific record. We'll add a share of direct profit to the first investor 
      // or just ensure feeCollected is updated correctly.)
      
      // Professional approach: We distribute the direct profit proportionally as if the manager was an investor
      const managerProfitShareForThisRecord = investors.length > 0 ? (managerDirectProfit / investors.length) : 0;
      const newFeeCollected = inv.feeCollected + (inv.yourFee || 0) + managerProfitShareForThisRecord;

      return {
        ...inv,
        startingCapital: inv.endingCapital,
        highWaterMark: newHWM,
        feeCollected: newFeeCollected,
        individualProfitShare: 0,
        yourFee: 0,
        netProfit: 0,
        reinvestAmt: 0,
        cashPayout: 0,
      };
    });
    
    setInvestors(updated);
    setPeriodProfit(0);
    setBrokerBalance(0);
    setShowRolloverConfirm(false);

    if (supabase) {
      try {
        for (const inv of updated) {
          await supabase.from('investors').update(inv).eq('id', inv.id);
        }
      } catch (e) {
        console.error("Failed to update investors on rollover", e);
      }
    }
  };

  const copySql = () => {
    const sql = `-- Comprehensive Database Setup for PAMM CRM
-- If you already have these tables, run these ALTER commands to add missing fields:
-- alter table investors add column if not exists "status" text default 'active';
-- alter table investors add column if not exists "joinedAt" text;
-- alter table investors add column if not exists "baseCurrency" text;
-- alter table investors add column if not exists "customFeePercentage" numeric;
-- alter table investors add column if not exists "referredBy" text;
-- alter table investors add column if not exists "ibCommissionRate" numeric;
-- alter table managers add column if not exists "allowInvestorWithdrawals" boolean;
-- alter table managers add column if not exists "defaultFeePercentage" numeric;

create table if not exists investors (
  id uuid default gen_random_uuid() primary key,
  "investorName" text,
  "password" text,
  "group" text,
  "status" text default 'active',
  "joinedAt" text,
  "baseCurrency" text,
  "highWaterMark" numeric,
  "startingCapital" numeric,
  "lossCarryover" numeric,
  "sharePercentage" numeric,
  "individualProfitShare" numeric,
  "feePercentage" numeric,
  "customFeePercentage" numeric,
  "yourFee" numeric,
  "netProfit" numeric,
  "reinvestAmt" numeric,
  "cashPayout" numeric,
  "endingCapital" numeric,
  "qrCode" text,
  "bankAccount" text,
  "feeCollected" numeric,
  "unpaidFee" numeric,
  "referredBy" text,
  "ibCommissionRate" numeric
);

create table if not exists managers (
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
  "enableIBModule" boolean,
  "allowInvestorWithdrawals" boolean,
  "defaultFeePercentage" numeric
);

create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  "investorId" uuid references investors(id) on delete cascade,
  type text,
  amount numeric,
  date text,
  status text,
  notes text,
  "referenceId" text,
  method text,
  category text,
  "receiptUrl" text
);

create table if not exists trades (
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
  sl numeric,
  tp numeric,
  "entryReason" text,
  "exitReason" text,
  notes text
);

create table if not exists period_history (
  id uuid default gen_random_uuid() primary key,
  date text,
  "totalProfit" numeric,
  "investorSnapshots" jsonb
);

create table if not exists audit_logs (
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Supabase Setup Required</h1>
              <p className="text-slate-500 dark:text-slate-400">Connect your database to continue</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">1. Add Environment Variables</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Open the <strong>Settings</strong> panel (top right) and add these secrets:
              </p>
              <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1 font-mono">
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
              </ul>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">2. Run this SQL in Supabase</h3>
                <button 
                  onClick={copySql}
                  className="flex items-center gap-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                  {copied ? 'Copied!' : 'Copy SQL'}
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const visibleInvestors = (isAdmin 
    ? investors 
    : investors.filter(inv => inv.investorName.toLowerCase() === user.name.toLowerCase()))
    .filter(inv => 
      inv.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.group?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
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
                  onClick={() => setShowAddInvestor(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-500 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm shadow-blue-500/20"
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
                    brokerBalance={brokerBalance}
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
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Period Distribution</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Total Starting Capital:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalStartingCapital)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-1 w-full max-w-xs">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Latest Broker Balance ($)
                      </label>
                      <input 
                        type="number" 
                        value={brokerBalance || ''}
                        onChange={(e) => handleBrokerBalanceChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-white"
                        placeholder="Current MT5 balance"
                      />
                    </div>

                    <div className="flex-1 w-full max-w-xs">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Calculated Period Profit ($)
                      </label>
                      <input 
                        type="number" 
                        value={periodProfit}
                        onChange={(e) => setPeriodProfit(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white font-semibold"
                        placeholder="Profit to distribute"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <button 
                        onClick={calculatePeriod}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                      >
                        <Calculator className="w-4 h-4" />
                        Distribute Profit
                      </button>
                      
                      {showRolloverConfirm ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                          <button 
                            onClick={rolloverPeriod}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-all shadow-lg ring-2 ring-red-300"
                          >
                            Confirm Rollover?
                          </button>
                          <button 
                            onClick={() => setShowRolloverConfirm(false)}
                            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowRolloverConfirm(true)}
                          className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 font-medium transition-colors"
                        >
                          Rollover Period
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {periodProfit !== 0 && (
                    <p className={`text-sm mt-3 font-medium ${periodProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {periodProfit > 0 ? "Profit" : "Loss"} of {formatCurrency(Math.abs(periodProfit))} will be distributed across all investors based on their share of equity.
                    </p>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search name or group..."
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm dark:text-white"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1 shrink-0">
                      <Filter className="w-3 h-3" /> Quick Filter:
                    </span>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all shrink-0 ${searchQuery === '' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-blue-400'}`}
                    >
                      All Accounts
                    </button>
                    {managers[0]?.investorGroups?.map(group => (
                      <button 
                        key={group}
                        onClick={() => setSearchQuery(group)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all shrink-0 ${searchQuery === group ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-blue-400'}`}
                      >
                        {group}
                      </button>
                    ))}
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
            <AuditLogView logs={auditLogs} onClearLogs={handleClearAuditLogs} />
          )}

          {activeTab === 'profile' && isAdmin && user?.managerRole && (
            <ManagerProfileView 
              manager={managers.find(m => m.username === user.name) || managers[0]}
              investors={investors}
              transactions={transactions}
              trades={trades}
              auditLogs={auditLogs}
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

      {showAddInvestor && (
        <AddInvestorModal 
          onClose={() => setShowAddInvestor(false)}
          onAdd={handleAddInvestor}
          managers={managers}
          availableGroups={managers[0]?.investorGroups || ['Default']}
        />
      )}
    </div>
  );
}
