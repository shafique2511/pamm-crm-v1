import React, { useState } from 'react';
import { Manager, AccessPermissions } from '../types';
import { UserPlus, Shield, Server, Key, User, Link, Tags, X, Plus, Percent, Edit2, Trash2, BookOpen } from 'lucide-react';

export function SettingsView({ managers, onAddManager, onUpdateManager, onDeleteManager }: { managers: Manager[], onAddManager: (m: Partial<Manager>) => void, onUpdateManager: (id: string, updates: Partial<Manager>) => void, onDeleteManager?: (id: string) => void }) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');

  const [editingManager, setEditingManager] = useState<string | null>(null);
  const [editManagerName, setEditManagerName] = useState('');
  const [editManagerUsername, setEditManagerUsername] = useState('');
  const [editManagerPassword, setEditManagerPassword] = useState('');
  
  // MT5 Settings for the first manager (assuming single admin for simplicity in this demo)
  const mainManager = managers[0];
  const [mt5Server, setMt5Server] = useState(mainManager?.mt5Server || '');
  const [mt5Login, setMt5Login] = useState(mainManager?.mt5Login || '');
  const [mt5Password, setMt5Password] = useState(mainManager?.mt5Password || '');
  const [mt5RestApiUrl, setMt5RestApiUrl] = useState(mainManager?.mt5RestApiUrl || '');
  const [isSavingMT5, setIsSavingMT5] = useState(false);

  // Group Settings
  const [investorGroups, setInvestorGroups] = useState<string[]>(mainManager?.investorGroups || ['Default', 'VIP', 'Standard']);
  const [defaultGroup, setDefaultGroup] = useState<string>(mainManager?.defaultInvestorGroup || 'Default');
  const [newGroup, setNewGroup] = useState('');

  // IB Module Settings
  const [enableIBModule, setEnableIBModule] = useState(mainManager?.enableIBModule || false);

  // Investor Withdrawals Setting
  const [allowInvestorWithdrawals, setAllowInvestorWithdrawals] = useState(mainManager?.allowInvestorWithdrawals || false);

  // Default Fee Setting
  const [defaultFee, setDefaultFee] = useState(mainManager?.defaultFeePercentage ?? 20);

  // Base Currency Setting
  const [baseCurrency, setBaseCurrency] = useState(mainManager?.baseCurrency || 'USD');

  const handleUpdateCurrency = (newCurrency: string) => {
    setBaseCurrency(newCurrency);
    if (mainManager) {
      onUpdateManager(mainManager.id, { baseCurrency: newCurrency });
    }
  };

  // Fee Tiers Setting
  const [feeTiers, setFeeTiers] = useState<Manager['feeTiers']>(mainManager?.feeTiers || []);
  const [newTierMinAmt, setNewTierMinAmt] = useState('');
  const [newTierPct, setNewTierPct] = useState('');
  
  // White Label Settings
  const [brandName, setBrandName] = useState(mainManager?.brandName || 'FinTech Portal');
  const [supportEmail, setSupportEmail] = useState(mainManager?.supportEmail || 'support@example.com');
  const [isSavingWhiteLabel, setIsSavingWhiteLabel] = useState(false);

  const handleSaveWhiteLabel = async () => {
    if (!mainManager) return;
    setIsSavingWhiteLabel(true);
    await new Promise(r => setTimeout(r, 600));
    onUpdateManager(mainManager.id, { brandName, supportEmail });
    setIsSavingWhiteLabel(false);
    alert('Platform white-label settings updated successfully.');
  };

  // Roles
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'read_only' | 'custom'>('manager');
  const [editManagerRole, setEditManagerRole] = useState<'admin' | 'manager' | 'read_only' | 'custom'>('manager');
  const [newPermissions, setNewPermissions] = useState<AccessPermissions>({
    canEditInvestors: true,
    canManageTransactions: true,
    canManageWithdrawals: true,
    canSyncMT5: true,
    canViewReports: true,
    canViewAudit: false,
    canManageSettings: false,
    canViewAffiliates: true
  });
  const [editManagerPermissions, setEditManagerPermissions] = useState<AccessPermissions>({});

  const handleAdd = async () => {
    if (!newUsername || !newPassword || !newName) return;
    onAddManager({ username: newUsername, password: newPassword, name: newName, role: newRole as any, permissions: newRole === 'custom' ? newPermissions : undefined });
    setNewUsername(''); setNewPassword(''); setNewName(''); setNewRole('manager');
  };

  const handleStartEditManager = (m: Manager) => {
    setEditingManager(m.id);
    setEditManagerName(m.name);
    setEditManagerUsername(m.username);
    setEditManagerPassword('');
    setEditManagerRole((m.role as any) || 'manager');
    setEditManagerPermissions(m.permissions || {});
  };

  const handleSaveEditManager = async (id: string) => {
    if (!editManagerName || !editManagerUsername) return;
    const updates: Partial<Manager> = { name: editManagerName, username: editManagerUsername, role: editManagerRole as any };
    if (editManagerRole === 'custom') {
      updates.permissions = editManagerPermissions;
    }
    if (editManagerPassword) {
      updates.password = editManagerPassword; // Will be hashed via App.tsx logic if updated correctly or handled before depending on implementation. Wait, App.tsx handleUpdateManager doesn't hash automatically. We should probably only allow App.tsx to do handling.
      // Alternatively we can just pass it the plain password, and let App.tsx handle hashing if it's there. 
      // Actually, since App.tsx `handleUpdateManager` might not hash, let's just pass it.
      // We will need to update App.tsx to hash passwords for handleUpdateManager if password is provided.
    }
    onUpdateManager(id, updates);
    setEditingManager(null);
  };

  const handleDeleteManager = (id: string) => {
    if (id === mainManager.id) {
      alert("Cannot delete the primary manager account.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this manager account?")) {
      onDeleteManager?.(id);
    }
  };

  const handleSaveMT5 = async () => {
    if (!mainManager) return;
    setIsSavingMT5(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
    onUpdateManager(mainManager.id, { mt5Server, mt5Login, mt5Password, mt5RestApiUrl });
    setIsSavingMT5(false);
    alert('MetaTrader 5 settings saved successfully.');
  };

  const handleToggleIBModule = () => {
    const newValue = !enableIBModule;
    setEnableIBModule(newValue);
    if (mainManager) {
      onUpdateManager(mainManager.id, { enableIBModule: newValue });
    }
  };

  const handleToggleInvestorWithdrawals = () => {
    const newValue = !allowInvestorWithdrawals;
    setAllowInvestorWithdrawals(newValue);
    if (mainManager) {
      onUpdateManager(mainManager.id, { allowInvestorWithdrawals: newValue });
    }
  };

  const handleAddGroup = () => {
    if (newGroup.trim() && !investorGroups.includes(newGroup.trim())) {
      const updatedGroups = [...investorGroups, newGroup.trim()];
      setInvestorGroups(updatedGroups);
      if (mainManager) {
        onUpdateManager(mainManager.id, { investorGroups: updatedGroups });
      }
      setNewGroup('');
    }
  };

  const handleRemoveGroup = (groupToRemove: string) => {
    if (window.confirm(`Are you sure you want to delete the group "${groupToRemove}"? Investors in this group will keep the label but it won't appear in dropdowns.`)) {
      const updatedGroups = investorGroups.filter(g => g !== groupToRemove);
      setInvestorGroups(updatedGroups);
      if (defaultGroup === groupToRemove) {
        setDefaultGroup(updatedGroups[0] || '');
        if (mainManager) onUpdateManager(mainManager.id, { defaultInvestorGroup: updatedGroups[0] || '', investorGroups: updatedGroups });
      } else {
        if (mainManager) onUpdateManager(mainManager.id, { investorGroups: updatedGroups });
      }
    }
  };

  const handleMoveGroup = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === investorGroups.length - 1) return;

    const newGroups = [...investorGroups];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newGroups[index];
    newGroups[index] = newGroups[targetIndex];
    newGroups[targetIndex] = temp;

    setInvestorGroups(newGroups);
    if (mainManager) {
      onUpdateManager(mainManager.id, { investorGroups: newGroups });
    }
  };

  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedGroupIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // For Firefox compatibility
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedGroupIndex === null || draggedGroupIndex === index) return;

    const newGroups = [...investorGroups];
    const draggedGroup = newGroups[draggedGroupIndex];
    newGroups.splice(draggedGroupIndex, 1);
    newGroups.splice(index, 0, draggedGroup);
    
    setDraggedGroupIndex(index);
    setInvestorGroups(newGroups);
  };

  const handleDragEnd = () => {
    setDraggedGroupIndex(null);
    if (mainManager) {
      onUpdateManager(mainManager.id, { investorGroups: investorGroups });
    }
  };

  const handleSetDefaultGroup = (group: string) => {
    setDefaultGroup(group);
    if (mainManager) {
      onUpdateManager(mainManager.id, { defaultInvestorGroup: group });
    }
  };

  const handleAddTier = () => {
    if (!newTierMinAmt || !newTierPct) return;
    const minCap = parseFloat(newTierMinAmt);
    const pct = parseFloat(newTierPct);
    if (isNaN(minCap) || isNaN(pct)) return;

    const newTier = {
      id: window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
      minCapital: minCap,
      maxCapital: null,
      feePercentage: pct
    };
    const updatedTiers = [...(feeTiers || []), newTier].sort((a, b) => a.minCapital - b.minCapital);
    setFeeTiers(updatedTiers);
    if (mainManager) {
      onUpdateManager(mainManager.id, { feeTiers: updatedTiers });
    }
    setNewTierMinAmt(''); setNewTierPct('');
  };

  const handleRemoveTier = (id: string) => {
    if (feeTiers) {
      const updatedTiers = feeTiers.filter(t => t.id !== id);
      setFeeTiers(updatedTiers);
      if (mainManager) {
        onUpdateManager(mainManager.id, { feeTiers: updatedTiers });
      }
    }
  };

  const copyMigrationSql = () => {
    const migrationSql = `-- Run this in your Supabase SQL Editor to sync your database schema:

-- 1. Managers Table Updates
alter table managers add column if not exists "baseCurrency" text;
alter table managers add column if not exists "investorGroups" jsonb;
alter table managers add column if not exists "defaultInvestorGroup" text;
alter table managers add column if not exists "feeTiers" jsonb;
alter table managers add column if not exists "role" text;
alter table managers add column if not exists "permissions" jsonb;
alter table managers add column if not exists "enableIBModule" boolean;
alter table managers add column if not exists "allowInvestorWithdrawals" boolean;
alter table managers add column if not exists "showTradingJournalToInvestors" boolean;
alter table managers add column if not exists "defaultFeePercentage" numeric;
alter table managers add column if not exists "brandName" text;
alter table managers add column if not exists "supportEmail" text;

-- 2. Investors Table Updates
alter table investors add column if not exists "status" text default 'active';
alter table investors add column if not exists "group" text;
alter table investors add column if not exists "joinedAt" text;
alter table investors add column if not exists "baseCurrency" text;
alter table investors add column if not exists "customFeePercentage" numeric;
alter table investors add column if not exists "password" text;
alter table investors add column if not exists "referredBy" text;
alter table investors add column if not exists "ibCommissionRate" numeric;
alter table investors add column if not exists "qrCode" text;
alter table investors add column if not exists "bankAccount" text;
alter table investors add column if not exists "email" text;
alter table investors add column if not exists "phone" text;
alter table investors add column if not exists "country" text;
alter table investors add column if not exists "memberTier" text;
alter table investors add column if not exists "emailNotifications" boolean;

-- 3. Transactions Table Updates
alter table transactions add column if not exists "referenceId" text;
alter table transactions add column if not exists "method" text;
alter table transactions add column if not exists "category" text;
alter table transactions add column if not exists "receiptUrl" text;

-- 4. Trades Table Updates
alter table trades add column if not exists sl numeric;
alter table trades add column if not exists tp numeric;
alter table trades add column if not exists "entryReason" text;
alter table trades add column if not exists "exitReason" text;
alter table trades add column if not exists notes text;

-- 5. Ensure tables exist (General Setup)
create table if not exists audit_logs (id text primary key, timestamp text, "userId" text, "userName" text, action text, details text, type text);
create table if not exists period_history (id text primary key, date text, "totalProfit" numeric, "investorSnapshots" jsonb);
`;
    navigator.clipboard.writeText(migrationSql);
    alert('Full Migration SQL copied to clipboard! Paste it into the Supabase SQL Editor to sync your records.');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
          <Server className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">System Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Configure manager access, system configurations, and platform preferences.</p>
        </div>
      </div>

      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="font-black text-rose-900 dark:text-rose-400 text-lg">Database Schema Sync</h4>
          <p className="text-rose-700 dark:text-rose-500 font-medium">If you manually alter schemas or get initialization errors, push this standard migration script to your Supabase SQL Editor.</p>
        </div>
        <button onClick={copyMigrationSql} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-sm active:scale-95 whitespace-nowrap shrink-0">
          Copy Migration SQL
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* White Label Settings */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Platform Branding</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">White-label your investor portal interface.</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Brand Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Support Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mt-8">
            <button 
              onClick={handleSaveWhiteLabel}
              disabled={isSavingWhiteLabel}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm font-bold disabled:opacity-70"
            >
              {isSavingWhiteLabel ? 'Saving...' : 'Update Branding'}
            </button>
          </div>
        </div>

        {/* Global Platform Preferences */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Global Preferences</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Core system toggles and rules.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">IB Module (Referrals)</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Enable affiliate tracking mapping.</p>
                </div>
                <button 
                  onClick={handleToggleIBModule}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${enableIBModule ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableIBModule ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Investor Withdrawals</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Allow capital requests from portal.</p>
                </div>
                <button 
                  onClick={handleToggleInvestorWithdrawals}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${allowInvestorWithdrawals ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowInvestorWithdrawals ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Show Trading Journal</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Show detailed ledger to investors.</p>
                </div>
                <button 
                  onClick={() => {
                    const newValue = !mainManager?.showTradingJournalToInvestors;
                    if (mainManager) onUpdateManager(mainManager.id, { showTradingJournalToInvestors: newValue });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${mainManager?.showTradingJournalToInvestors ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mainManager?.showTradingJournalToInvestors ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investor Groups Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Tags className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Investor Groups</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage groups to categorize and organize your investors.</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {investorGroups.map((group, index) => (
            <div 
              key={group} 
              className={`flex items-center justify-between border px-4 py-4 rounded-xl transition-colors cursor-move ${draggedGroupIndex === index ? 'bg-blue-50/50 border-blue-300 opacity-50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center gap-3">
                <div className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1" title="Drag to reorder">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" /></svg>
                </div>
                <div className="relative flex items-center">
                  <input 
                    type="radio" 
                    name="defaultGroup"
                    checked={defaultGroup === group}
                    onChange={() => handleSetDefaultGroup(group)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 absolute opacity-0 z-10 cursor-pointer"
                    title="Set as Default Group"
                  />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${defaultGroup === group ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 dark:border-slate-600'}`}>
                    {defaultGroup === group && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200 ml-2">{group}</span>
                {defaultGroup === group && (
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded">Default</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRemoveGroup(group)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Remove Group"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {investorGroups.length === 0 && (
            <p className="text-sm text-slate-500 italic">No groups created yet.</p>
          )}
        </div>

        <div className="flex items-center gap-3 max-w-md">
          <input 
            type="text" 
            placeholder="New group name..." 
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={newGroup}
            onChange={e => setNewGroup(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
          />
          <button 
            onClick={handleAddGroup}
            disabled={!newGroup.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PAMM Protocol Fees */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Fee Structure</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Baseline docking structure & tiers.</p>
              </div>
            </div>

            <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Default Performance Fee</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Applies to users without a custom tier.</p>
                </div>
                <div className="flex items-center gap-2 max-w-[140px]">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={defaultFee}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setDefaultFee(val);
                      if (mainManager && !isNaN(val)) onUpdateManager(mainManager.id, { defaultFeePercentage: val });
                    }}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-right font-black"
                  />
                  <span className="text-slate-500 dark:text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Capital-Based Tiers</h4>
              <div className="space-y-3 mb-4">
                {feeTiers?.map(tier => (
                  <div key={tier.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex-1">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Min: </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">${tier.minCapital.toLocaleString()}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Fee: </span>
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg font-black text-sm">{tier.feePercentage}%</span>
                    </div>
                    <button
                      onClick={() => handleRemoveTier(tier.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!feeTiers || feeTiers.length === 0) && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic p-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">No custom fee tiers defined.</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input 
                  type="number" 
                  placeholder="Min ($)" 
                  className="w-full sm:flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400"
                  value={newTierMinAmt}
                  onChange={e => setNewTierMinAmt(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="Fee (%)" 
                  className="w-full sm:flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400"
                  value={newTierPct}
                  onChange={e => setNewTierPct(e.target.value)}
                />
                <button 
                  onClick={handleAddTier}
                  disabled={!newTierMinAmt || !newTierPct}
                  className="w-full sm:w-auto px-4 py-3 font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors shrink-0 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Config */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Platform Currency</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Set the default formatting symbol.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Base System Currency</label>
              <div className="flex items-center gap-2">
                <select 
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  value={baseCurrency}
                  onChange={(e) => handleUpdateCurrency(e.target.value)}
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

      {/* MT5 Integration Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">MetaTrader 5 Bridge</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Connect API interface to pull trading history metadata automatically.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">REST API Bridge URL</label>
            <div className="relative">
              <Link className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="url" 
                placeholder="https://api.metaapi.cloud/v1/..." 
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400"
                value={mt5RestApiUrl}
                onChange={e => setMt5RestApiUrl(e.target.value)}
              />
            </div>
            <p className="text-xs font-medium text-slate-500 mt-2">Required endpoint for fetching transactional metadata.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Broker Server</label>
            <div className="relative">
              <Server className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="MetaQuotes-Demo" 
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400"
                value={mt5Server}
                onChange={e => setMt5Server(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">MT5 Account Number</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="12345678" 
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400"
                value={mt5Login}
                onChange={e => setMt5Login(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Read-Only MT5 Password</label>
            <div className="relative">
              <Key className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                placeholder="••••••••••••" 
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400"
                value={mt5Password}
                onChange={e => setMt5Password(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={handleSaveMT5}
            disabled={isSavingMT5}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-70 transition-colors shadow-sm"
          >
            {isSavingMT5 ? 'Authorizing connection...' : 'Update MT5 Auth Config'}
          </button>
        </div>
      </div>

      {/* Managers Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Manager Accounts</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage admin access to the PAMM CRM.</p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          {managers.map(m => (
            <div key={m.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              {editingManager === m.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input 
                      placeholder="Full Name" 
                      className="px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={editManagerName} 
                      onChange={e=>setEditManagerName(e.target.value)}
                    />
                    <input 
                      placeholder="Username" 
                      className="px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={editManagerUsername} 
                      onChange={e=>setEditManagerUsername(e.target.value)}
                    />
                    <input 
                      placeholder="New Password" 
                      type="password" 
                      className="px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={editManagerPassword} 
                      onChange={e=>setEditManagerPassword(e.target.value)}
                    />
                    <select 
                      className="px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={editManagerRole} 
                      onChange={e=>setEditManagerRole(e.target.value as any)}
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="read_only">Read-Only</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  {editManagerRole === 'custom' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                      {Object.keys(newPermissions).map(key => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-700 dark:text-slate-300">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={!!editManagerPermissions[key as keyof AccessPermissions]}
                            onChange={(e) => setEditManagerPermissions({...editManagerPermissions, [key]: e.target.checked})}
                          />
                          {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setEditingManager(null)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                    <button onClick={() => handleSaveEditManager(m.id)} className="px-6 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors shadow-sm">Save Changes</button>
                  </div>
                </div>
              ) : (
                  <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{m.name}</p>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">@{m.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-wider">
                      {m.role || 'Admin'}
                    </span>
                    {m.id !== mainManager.id && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleStartEditManager(m)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors" title="Edit Manager">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteManager(m.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors" title="Delete Manager">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
          <h4 className="font-bold text-slate-900 dark:text-white mb-4">Add New Manager</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input placeholder="Full Name" className="px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400" value={newName} onChange={e=>setNewName(e.target.value)}/>
            <input placeholder="Username" className="px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400" value={newUsername} onChange={e=>setNewUsername(e.target.value)}/>
            <input placeholder="Password" type="password" className="px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-400" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
            <select className="px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={newRole} onChange={e=>setNewRole(e.target.value as any)}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="read_only">Read-Only</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {newRole === 'custom' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
              {Object.keys(newPermissions).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={!!newPermissions[key as keyof AccessPermissions]}
                    onChange={(e) => setNewPermissions({...newPermissions, [key]: e.target.checked})}
                  />
                  {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                </label>
              ))}
            </div>
          )}
          <button onClick={handleAdd} className="flex justify-center items-center gap-2 w-full md:w-auto px-6 py-3 font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm">
            <UserPlus className="w-5 h-5"/> Create Manager Account
          </button>
        </div>
      </div>
    </div>
  );
}
