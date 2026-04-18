import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  PieChart, 
  ArrowRightLeft,
  LogOut,
  BookOpen,
  Shield,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  managerRole?: 'admin' | 'manager' | 'read_only' | 'custom';
  permissions?: any;
  enableIBModule?: boolean;
  onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, isAdmin, managerRole, permissions, enableIBModule, onLogout }: SidebarProps) {
  const hasPermission = (key: string, defaultForRole: boolean) => {
    if (managerRole === 'custom' && permissions) {
      return !!permissions[key];
    }
    if (managerRole === 'admin') return true;
    return defaultForRole;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'investors', label: isAdmin ? 'Investors' : 'Statements', icon: Users, show: true },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft, show: isAdmin && hasPermission('canManageTransactions', true) },
    { id: 'manager_withdrawals', label: 'Manager Withdrawals', icon: ArrowRightLeft, show: isAdmin && hasPermission('canManageWithdrawals', managerRole !== 'read_only') },
    { id: 'journal', label: 'Trading Journal', icon: BookOpen, show: isAdmin && hasPermission('canSyncMT5', true) },
    { id: 'affiliates', label: 'IB Affiliates', icon: Users, show: enableIBModule && isAdmin && hasPermission('canViewAffiliates', true) },
    { id: 'reports', label: 'Reports', icon: PieChart, show: isAdmin && hasPermission('canViewReports', true) },
    { id: 'audit', label: 'Audit Logs', icon: Shield, show: isAdmin && hasPermission('canViewAudit', managerRole === 'admin') },
    { id: 'settings', label: 'Settings', icon: Settings, show: isAdmin && hasPermission('canManageSettings', managerRole === 'admin') },
    { id: 'profile', label: 'My Profile', icon: User, show: isAdmin },
  ].filter(item => item.show);

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-slate-300 h-screen border-r border-slate-800">
      <div className="flex items-center justify-center h-20 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <PieChart className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Que PAMM</h1>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 py-6 px-4 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-blue-600/10 text-blue-500 font-medium" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-500" : "text-slate-400")} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 text-slate-400" />
          Logout
        </button>
      </div>
    </div>
  );
}
