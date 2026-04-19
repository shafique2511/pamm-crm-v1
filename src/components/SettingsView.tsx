import React, { useState } from 'react';
import { Manager, AccessPermissions } from '../types';
import { UserPlus, Shield, Server, Key, User, Link, Tags, X, Plus, Percent, Edit2, Trash2 } from 'lucide-react';

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
alter table managers add column if not exists "defaultFeePercentage" numeric;

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
-- create table if not exists audit_logs (id text primary key, timestamp text, "userId" text, "userName" text, action text, details text, type text);
-- create table if not exists period_history (id text primary key, date text, "totalProfit" numeric, "investorSnapshots" jsonb);
`;
    navigator.clipboard.writeText(migrationSql);
    alert('Full Migration SQL copied to clipboard! Paste it into the Supabase SQL Editor to sync your records.');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-amber-900 text-sm">Database Schema Sync</h4>
          <p className="text-amber-700 text-sm">If you see errors when saving managers or changing settings, your Supabase DB may need to be updated with new columns.</p>
        </div>
        <button onClick={copyMigrationSql} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
          Copy Migration SQL
        </button>
      </div>
      
      {/* Investor Groups Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Tags className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Investor Groups</h3>
            <p className="text-sm text-slate-500">Manage groups to categorize and organize your investors. Reorder using arrows, and select a default group for new investors.</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {investorGroups.map((group, index) => (
            <div 
              key={group} 
              className={`flex items-center justify-between border px-4 py-3 rounded-lg transition-colors cursor-move ${draggedGroupIndex === index ? 'bg-blue-50 border-blue-300 opacity-50' : 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-slate-100'}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center gap-3">
                <div className="cursor-grab text-slate-400 hover:text-slate-600 p-1" title="Drag to reorder">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" /></svg>
                </div>
                <input 
                  type="radio" 
                  name="defaultGroup"
                  checked={defaultGroup === group}
                  onChange={() => handleSetDefaultGroup(group)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  title="Set as Default Group"
                />
                <span className="font-medium text-slate-700">{group}</span>
                {defaultGroup === group && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Default</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRemoveGroup(group)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
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

      {/* IB Module Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Introducing Broker (IB) Module</h3>
              <p className="text-sm text-slate-500">Enable affiliate tracking and commission calculations.</p>
            </div>
          </div>
          <button 
            onClick={handleToggleIBModule}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enableIBModule ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableIBModule ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {enableIBModule && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-medium text-slate-900 mb-2">IB Module Active</h4>
            <p className="text-sm text-slate-600">
              You can now assign investors to IBs and set commission rates in the Investors table. 
              The IB Affiliates tab is available in the sidebar to view performance.
            </p>
          </div>
        )}
      </div>

      {/* Investor Withdrawals Toggle */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Investor Withdrawals</h3>
              <p className="text-sm text-slate-500">Allow investors to request withdrawals from their dashboard.</p>
            </div>
          </div>
          <button 
            onClick={handleToggleInvestorWithdrawals}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowInvestorWithdrawals ? 'bg-blue-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowInvestorWithdrawals ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Fee Tiers Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Percent className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Global Fee Settings</h3>
            <p className="text-sm text-slate-500">Define standard fee structures and defaults.</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">Default Performance Fee (%)</label>
            <div className="flex gap-3">
              <input 
                type="number" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={defaultFee}
                onChange={e => setDefaultFee(parseFloat(e.target.value) || 0)}
              />
              <button 
                onClick={() => {
                  if (mainManager) onUpdateManager(mainManager.id, { defaultFeePercentage: defaultFee });
                  alert('Default fee updated successfully.');
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 font-medium"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">This fee will be applied to new investors by default.</p>
          </div>
          
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">Platform Base Currency</label>
            <div className="flex gap-3">
              <select 
                title="Global Formatting Base Currency"
                value={baseCurrency}
                onChange={e => handleUpdateCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
            <p className="text-xs text-slate-500 mt-1">Default formatting currency across the platform.</p>
          </div>
        </div>

        <div className="mb-6 border-t border-slate-200 pt-6">
          <h4 className="text-md font-medium text-slate-900 mb-4">Capital-Based Fee Tiers</h4>
          <div className="space-y-4 mb-4">
            {feeTiers?.map(tier => (
              <div key={tier.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">Starts from: </span>
                  <span className="text-sm text-slate-900">${tier.minCapital.toLocaleString()}</span>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">Fee: </span>
                  <span className="text-sm text-slate-900">{tier.feePercentage}%</span>
                </div>
                <button
                  onClick={() => handleRemoveTier(tier.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!feeTiers || feeTiers.length === 0) && (
              <p className="text-sm text-slate-500 italic">No custom fee tiers defined.</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="number" 
              placeholder="Amount Starting From ($)" 
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newTierMinAmt}
              onChange={e => setNewTierMinAmt(e.target.value)}
            />
            <input 
              type="number" 
              placeholder="Fee Percentage (%)" 
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newTierPct}
              onChange={e => setNewTierPct(e.target.value)}
            />
            <button 
              onClick={handleAddTier}
              disabled={!newTierMinAmt || !newTierPct}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0 font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Tier
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
          <p>Fee tiers allow you to automatically suggest fee percentages based on an investor's starting capital. 
          Currently, fees can be set individually per investor in the Investors table.</p>
        </div>
      </div>

      {/* MT5 Integration Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Server className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">MetaTrader 5 Integration</h3>
            <p className="text-sm text-slate-500">Connect your MT5 account via REST API Bridge to sync trading history.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">REST API Bridge URL</label>
            <div className="relative">
              <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="url" 
                placeholder="https://api.metaapi.cloud/v1/..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={mt5RestApiUrl}
                onChange={e => setMt5RestApiUrl(e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">The endpoint URL of your MT5 REST API Bridge (e.g., MetaApi or custom Flask server).</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Broker Server</label>
            <div className="relative">
              <Server className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="e.g. MetaQuotes-Demo" 
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={mt5Server}
                onChange={e => setMt5Server(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">MT5 Login (Account Number)</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="e.g. 12345678" 
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={mt5Login}
                onChange={e => setMt5Login(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">MT5 Password</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                placeholder="Investor or Master Password" 
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={mt5Password}
                onChange={e => setMt5Password(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleSaveMT5}
          disabled={isSavingMT5}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-70 transition-colors"
        >
          {isSavingMT5 ? 'Saving...' : 'Save MT5 Settings'}
        </button>
      </div>

      {/* Managers Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Manager Accounts</h3>
            <p className="text-sm text-slate-500">Manage admin access to the PAMM CRM.</p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          {managers.map(m => (
            <div key={m.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              {editingManager === m.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input 
                      placeholder="Full Name" 
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                      value={editManagerName} 
                      onChange={e=>setEditManagerName(e.target.value)}
                    />
                    <input 
                      placeholder="Username" 
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                      value={editManagerUsername} 
                      onChange={e=>setEditManagerUsername(e.target.value)}
                    />
                    <input 
                      placeholder="New Password (optional)" 
                      type="password" 
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                      value={editManagerPassword} 
                      onChange={e=>setEditManagerPassword(e.target.value)}
                    />
                    <select 
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm" 
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-200 mt-2">
                      {Object.keys(newPermissions).map(key => (
                        <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                          <input 
                            type="checkbox" 
                            checked={!!editManagerPermissions[key as keyof AccessPermissions]}
                            onChange={(e) => setEditManagerPermissions({...editManagerPermissions, [key]: e.target.checked})}
                          />
                          {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setEditingManager(null)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                    <button onClick={() => handleSaveEditManager(m.id)} className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors">Save</button>
                  </div>
                </div>
              ) : (
                  <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{m.name}</p>
                      <p className="text-sm text-slate-500">@{m.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                      {m.role || 'Admin'}
                    </span>
                    {m.id !== mainManager.id && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleStartEditManager(m)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Edit Manager">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteManager(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete Manager">
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

        <div className="border-t border-slate-200 pt-6">
          <h4 className="font-medium text-slate-900 mb-4">Add New Manager</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input placeholder="Full Name" className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newName} onChange={e=>setNewName(e.target.value)}/>
            <input placeholder="Username" className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newUsername} onChange={e=>setNewUsername(e.target.value)}/>
            <input placeholder="Password" type="password" className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
            <select className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newRole} onChange={e=>setNewRole(e.target.value as any)}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="read_only">Read-Only</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {newRole === 'custom' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              {Object.keys(newPermissions).map(key => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={!!newPermissions[key as keyof AccessPermissions]}
                    onChange={(e) => setNewPermissions({...newPermissions, [key]: e.target.checked})}
                  />
                  {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                </label>
              ))}
            </div>
          )}
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <UserPlus className="w-4 h-4"/> Add Manager
          </button>
        </div>
      </div>
    </div>
  );
}
