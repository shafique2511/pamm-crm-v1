import React, { useRef, useState } from 'react';
import { Investor, Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { PieChart as PieChartIcon, BarChart3, TrendingUp, Download, Users, FileText, Loader2, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function ReportsView({ investors, transactions }: { investors: Investor[], transactions: Transaction[] }) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const totalCapital = investors.reduce((sum, inv) => sum + inv.startingCapital, 0);
  const totalHWM = investors.reduce((sum, inv) => sum + inv.highWaterMark, 0);
  const totalFeesCollected = investors.reduce((sum, inv) => sum + inv.feeCollected, 0);
  const managerWithdrawals = transactions.filter(t => t.type === 'manager_withdrawal').reduce((sum, t) => sum + t.amount, 0);
  const managerBalance = totalFeesCollected - managerWithdrawals;

  const totalNetProfit = investors.reduce((sum, inv) => sum + inv.netProfit, 0);
  const activeInvestors = investors.filter(i => i.status === 'active' || !i.status).length;
  const averageAccountSize = investors.length > 0 ? totalCapital / investors.length : 0;

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

  // Status stats for pie chart
  const statuses = investors.reduce((acc, inv) => {
    const s = inv.status || 'active';
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statuses).map(([name, value]) => ({ name, value }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];
  const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const exportToCSV = async () => {
    setIsExportingCSV(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const headers = [
        'Investor Name', 'Group', 'Tier', 'Status', 'Starting Capital', 
        'High Water Mark', 'Net Profit', 'Ending Capital', 'Fee Collected', 'Unpaid Fee'
      ];
      
      const rows = investors.map(inv => [
        `"${inv.investorName.replace(/"/g, '""')}"`,
        `"${(inv.group || 'Default').replace(/"/g, '""')}"`,
        `"${(inv.memberTier || 'Standard').replace(/"/g, '""')}"`,
        `"${(inv.status || 'Active').replace(/"/g, '""')}"`,
        inv.startingCapital,
        inv.highWaterMark,
        inv.netProfit,
        inv.endingCapital,
        inv.feeCollected,
        inv.unpaidFee
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `fund_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export CSV', e);
      alert('Failed to export data to CSV');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsExportingPDF(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#f8fafc' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Fund_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF Report.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
           <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-500" />
           <div>
             <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Executive Reports</h2>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Fund performance, capital allocation, and business telemetry.</p>
           </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={exportToCSV}
            disabled={isExportingCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm font-bold active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {isExportingCSV ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isExportingCSV ? 'CSV...' : 'Export CSV'}
          </button>
          <button 
            onClick={exportToPDF}
            disabled={isExportingPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-md font-bold active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExportingPDF ? 'PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 pb-8 bg-slate-50 dark:bg-slate-950 print:bg-white print:p-8 rounded-3xl">
        
        {/* Print Header (Only visible in PDF/Print) */}
        <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6">
          <div className="flex justify-between items-end">
            <div>
               <h1 className="text-4xl font-black tracking-tight text-slate-900">Fund Performance</h1>
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Executive Summary Report</p>
            </div>
            <div className="text-right">
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Generated On</p>
               <p className="font-bold text-slate-900">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}</p>
            </div>
          </div>
        </div>

        {/* Primary KPIs - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl"><TrendingUp className="w-5 h-5"/></div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Total AUM</h3>
            </div>
            <div>
               <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalCapital)}</p>
               <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                 Avg Account: <span className="text-slate-700 dark:text-slate-300 font-bold">{formatCurrency(averageAccountSize)}</span>
               </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><Wallet className="w-5 h-5"/></div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Total Net Profit</h3>
            </div>
            <div>
               <p className={`text-3xl font-black tracking-tight ${totalNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                 {totalNetProfit > 0 ? '+' : ''}{formatCurrency(totalNetProfit)}
               </p>
               <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                 Aggregated period returns
               </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl"><BarChart3 className="w-5 h-5"/></div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Total High Water Mark</h3>
            </div>
            <div>
               <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalHWM)}</p>
               <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                 Peak equity benchmark
               </p>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-slate-800 dark:border-slate-700 relative overflow-hidden flex flex-col justify-between group text-white">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500 opacity-20 group-hover:opacity-30 transition-opacity rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white/10 text-indigo-300 rounded-xl"><PieChartIcon className="w-5 h-5"/></div>
              <h3 className="font-bold text-white text-sm">Manager Balance</h3>
            </div>
            <div>
               <p className="text-3xl font-black text-white tracking-tight">{formatCurrency(managerBalance)}</p>
               <p className="text-xs font-medium text-indigo-300 mt-1 flex items-center gap-1">
                 Fees Collected: {formatCurrency(totalFeesCollected)}
               </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="mb-6">
               <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Capital Allocation by Group</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Distribution of Assets Under Management across investor groups.</p>
            </div>
            {groupData.length > 0 ? (
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val > 1000 ? (val/1000).toFixed(0) + 'k' : val}`} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <RechartsTooltip 
                      formatter={(value: number) => [formatCurrency(value), 'AUM']}
                      contentStyle={{ backgroundColor: 'var(--tw-prose-body)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      cursor={{fill: '#94a3b8', opacity: 0.1}}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {groupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 min-h-[300px]">
                No group allocation data available
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="mb-4">
               <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Account Status</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Breakdown of {investors.length} total profiles.</p>
            </div>
            {statusData.length > 0 ? (
              <div className="flex-1 min-h-[250px] flex flex-col">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value} accounts`, 'Count']}
                      contentStyle={{ backgroundColor: 'var(--tw-prose-body)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                No status data available
              </div>
            )}
          </div>
        </div>

        {/* Detailed Leaderboard Row */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center"><Users className="w-5 h-5" /></div>
             <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Top Investors Ledger</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Highest equity individual profiles and their performance.</p>
             </div>
          </div>
          
          <div className="space-y-3">
            {investors
              .sort((a, b) => b.startingCapital - a.startingCapital)
              .slice(0, 5)
              .map((inv, i) => (
                <div key={inv.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4 mb-3 sm:mb-0">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-900 dark:text-white font-black text-sm border border-slate-200 dark:border-slate-600">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-base">{inv.investorName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className="px-2 py-0.5 bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider">{inv.group || 'Ungrouped'}</span>
                         {inv.status !== 'active' && <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded text-[10px] font-bold uppercase tracking-wider">{inv.status}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 sm:gap-10 sm:text-right">
                    <div>
                      <span className="block text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">AUM Cap</span>
                      <p className="font-black text-slate-900 dark:text-white">{formatCurrency(inv.startingCapital)}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{((inv.startingCapital / (totalCapital || 1)) * 100).toFixed(1)}% of Pool</p>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">Period Net</span>
                      <p className={`font-black flex items-center sm:justify-end gap-1 ${inv.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                        {inv.netProfit > 0 ? <ArrowUpRight className="w-3 h-3" /> : (inv.netProfit < 0 ? <ArrowDownRight className="w-3 h-3" /> : null)}
                        {formatCurrency(Math.abs(inv.netProfit))}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">Gross: {formatPercent(inv.sharePercentage)}</p>
                    </div>
                  </div>
                </div>
            ))}
            {investors.length === 0 && (
              <div className="text-center text-slate-400 dark:text-slate-500 font-medium py-10 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                No active investments registered to display rankings.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility local to this component as formatPercent might not deal with raw floats properly if expected as fraction
function formatPercent(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
