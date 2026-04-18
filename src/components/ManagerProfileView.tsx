import React, { useState } from 'react';
import { Key, CheckCircle2 } from 'lucide-react';
import { evaluatePasswordStrength, hashPassword } from '../lib/utils';
import { Manager } from '../types';

interface ManagerProfileViewProps {
  currentUser: { name: string; username?: string; managerRole?: string; };
  managerId: string;
  onUpdateManager: (id: string, updates: Partial<Manager>) => void;
}

export function ManagerProfileView({ currentUser, managerId, onUpdateManager }: ManagerProfileViewProps) {
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) return;
    onUpdateManager(managerId, { password: newPassword });
    setPasswordMessage('Password updated successfully.');
    setNewPassword('');
    setTimeout(() => setPasswordMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Personal Account Setting</h2>
        <p className="text-slate-500">Update your security preferences and profile rules.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Key className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Account Security</h3>
        </div>
        <div className="p-6">
          <div className="max-w-md">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Change Password</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input 
                  type="password" 
                  placeholder="New Password" 
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button 
                  onClick={handlePasswordChange}
                  disabled={!newPassword.trim()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  Update
                </button>
              </div>
              {newPassword && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden flex">
                    <div className={`h-full ${evaluatePasswordStrength(newPassword).color}`} style={{ width: `${(evaluatePasswordStrength(newPassword).score / 4) * 100}%` }}></div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{evaluatePasswordStrength(newPassword).label}</span>
                </div>
              )}
            </div>
            {passwordMessage && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {passwordMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
