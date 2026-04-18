import React from 'react';
import { Investor, Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { PieChart, BarChart3, TrendingUp, Download } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export function ReportsView({ investors, transactions }: { investors: Investor[], transactions: Transaction[] }) {
  const [isExporting, setIsExporting] = React.useState(false);
  const totalCapital = investors.reduce((sum, inv) => sum + inv.startingCapital, 0);
  const totalHWM = investors.reduce((sum, inv) => sum + inv.highWaterMark, 0);
  const totalFeesCollected = investors.reduce((sum, inv) => sum + inv.feeCollected, 0);
  const managerWithdrawals = transactions.filter(t => t.type === 'manager_withdrawal').reduce((sum, t) => sum + t.amount, 0);
  const managerBalance = totalFeesCollected - managerWithdrawals;

  // Group stats for chart
  const groups = investors.reduce((acc, inv) => {
    const g = inv.group || 'Ungrouped';
    acc[g] = (acc[g] || 0) + inv.startingCapital;
    return acc;
  }, {} as Record<string, number>);

  const groupData = Object.entries(groups).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  const exportToCSV = async () => {
    setIsExporting(true);
    
    // Yield execution to let React render the button state
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const headers = [
        'Investor Name', 
        'Group', 
        'Starting Capital', 
        'High Water Mark', 
        'Net Profit', 
        'Ending Capital', 
        'Fee Collected', 
        'Unpaid Fee'
      ];
      
      const rows = investors.map(inv => [
        `"${inv.investorName.replace(/"/g, '""')}"`,
        `"${(inv.group || 'Default').replace(/"/g, '""')}"`,
        inv.startingCapital,
        inv.highWaterMark,
        inv.netProfit,
        inv.endingCapital,
        inv.feeCollected,
        inv.unpaidFee
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `pamm_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export CSV', e);
      alert('Failed to export data to CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Financial Reports</h2>
        <button 
          onClick={exportToCSV}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium disabled:opacity-70"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><TrendingUp className="w-5 h-5"/></div>
            <h3 className="font-semibold text-slate-700">Total AUM</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalCapital)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><BarChart3 className="w-5 h-5"/></div>
            <h3 className="font-semibold text-slate-700">Total High Water Mark</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalHWM)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><PieChart className="w-5 h-5"/></div>
            <h3 className="font-semibold text-slate-700">Manager Balance</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(managerBalance)}</p>
          <p className="text-sm text-slate-500 mt-1">Total Collected: {formatCurrency(totalFeesCollected)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6 text-slate-900">Capital by Group</h3>
          {groupData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={groupData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tickFormatter={(val) => `$${val / 1000}k`} stroke="#64748b" />
                  <YAxis dataKey="name" type="category" width={100} stroke="#64748b" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {groupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-500">
              No group data available
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6 text-slate-900">Top Investors</h3>
          <div className="space-y-4">
            {investors
              .sort((a, b) => b.startingCapital - a.startingCapital)
              .slice(0, 5)
              .map((inv, i) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{inv.investorName}</p>
                      <p className="text-xs text-slate-500">{inv.group || 'Ungrouped'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(inv.startingCapital)}</p>
                    <p className="text-xs text-slate-500">{((inv.startingCapital / totalCapital) * 100).toFixed(1)}% of AUM</p>
                  </div>
                </div>
            ))}
            {investors.length === 0 && (
              <div className="text-center text-slate-500 py-8">No investors found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
