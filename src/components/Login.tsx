import React, { useState } from 'react';
import { PieChart, Lock, User, Shield, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: (role: 'admin' | 'investor', name: string, username?: string, password?: string) => void;
  onResetPassword?: (role: 'admin' | 'investor', identifier: string, newPassword: string) => Promise<boolean>;
}

export function Login({ onLogin, onResetPassword }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');
  const [role, setRole] = useState<'admin' | 'investor'>('admin');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  
  // For reset password
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      if (role === 'admin') {
        if (username.trim() && password.trim()) {
          onLogin('admin', 'Admin', username.trim(), password.trim());
        } else {
          alert('Please enter username and password.');
        }
      } else {
        if (name.trim() && password.trim()) {
          onLogin('investor', name.trim(), undefined, password.trim());
        } else {
          alert('Please enter your investor name and password.');
        }
      }
    } else if (mode === 'forgot_password' && onResetPassword) {
      if (!newPassword.trim()) {
        alert('Please enter a new password.');
        return;
      }
      
      const identifier = role === 'admin' ? username.trim() : name.trim();
      if (!identifier) {
        alert(`Please enter your ${role === 'admin' ? 'username' : 'investor name'}.`);
        return;
      }

      setIsResetting(true);
      try {
        const success = await onResetPassword(role, identifier, newPassword.trim());
        if (success) {
          alert('Password successfully reset! Please login with your new password.');
          setMode('login');
          setPassword('');
          setNewPassword('');
        } else {
          alert(`Account not found. Please check your ${role === 'admin' ? 'username' : 'investor name'}.`);
        }
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center relative">
          {mode === 'forgot_password' && (
            <button 
              onClick={() => setMode('login')}
              className="absolute left-4 top-4 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg mt-2">
            <PieChart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Que PAMM</h1>
          <p className="text-slate-400 mt-2">
            {mode === 'login' ? 'Sign in to your account' : 'Reset your password'}
          </p>
        </div>

        <div className="p-8">
          <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                role === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              Manager
            </button>
            <button
              type="button"
              onClick={() => setRole('investor')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                role === 'investor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              Investor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Manager username"
                  />
                </div>
              </div>
            )}

            {role === 'investor' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Investor Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Alice Smith"
                  />
                </div>
              </div>
            )}

            {mode === 'login' ? (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <button 
                    type="button"
                    onClick={() => setMode('forgot_password')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isResetting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-6 transition-colors disabled:opacity-70"
            >
              {mode === 'login' ? 'Sign In' : (isResetting ? 'Resetting...' : 'Reset Password')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
