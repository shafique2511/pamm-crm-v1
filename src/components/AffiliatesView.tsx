import React, { useMemo } from 'react';
import { Investor } from '../types';
import { formatCurrency } from '../lib/utils';
import { Users, DollarSign, Percent } from 'lucide-react';

interface AffiliatesViewProps {
  investors: Investor[];
  currentUser?: { role: 'admin' | 'investor', name: string } | null;
  isAdmin?: boolean;
}

export function AffiliatesView({ investors, currentUser, isAdmin }: AffiliatesViewProps) {
  const affiliatesData = useMemo(() => {
    const ibMap = new Map<string, {
      name: string;
      referredInvestors: Investor[];
      totalCapitalReferred: number;
      totalIBCommission: number;
    }>();

    investors.forEach(inv => {
      if (inv.referredBy) {
        // If not admin, only process if the referredBy matches the current user's name
        if (!isAdmin && currentUser && inv.referredBy.toLowerCase() !== currentUser.name.toLowerCase()) {
          return;
        }

        const ibName = inv.referredBy;
        if (!ibMap.has(ibName)) {
          ibMap.set(ibName, {
            name: ibName,
            referredInvestors: [],
            totalCapitalReferred: 0,
            totalIBCommission: 0
          });
        }
        const ibData = ibMap.get(ibName)!;
        ibData.referredInvestors.push(inv);
        ibData.totalCapitalReferred += inv.startingCapital;
        
        // Calculate commission for this period (assuming netProfit > 0)
        // Commission is usually a percentage of the manager's fee, or a direct percentage of profit.
        // Here we use ibCommissionRate as a percentage of the investor's net profit for simplicity,
        // or percentage of the manager's fee. Let's assume it's a percentage of the manager's fee.
        if (inv.yourFee > 0 && inv.ibCommissionRate) {
          ibData.totalIBCommission += inv.yourFee * (inv.ibCommissionRate / 100);
        }
      }
    });

    return Array.from(ibMap.values()).sort((a, b) => b.totalIBCommission - a.totalIBCommission);
  }, [investors, currentUser, isAdmin]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Active IBs</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{affiliatesData.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Capital Referred</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(affiliatesData.reduce((sum, ib) => sum + ib.totalCapitalReferred, 0))}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Percent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total IB Commissions</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(affiliatesData.reduce((sum, ib) => sum + ib.totalIBCommission, 0))}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">IB Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">IB Name</th>
                <th className="px-6 py-4 font-medium">Referred Clients</th>
                <th className="px-6 py-4 font-medium">Total Capital</th>
                <th className="px-6 py-4 font-medium">Est. Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {affiliatesData.map((ib) => (
                <tr key={ib.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {ib.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {ib.referredInvestors.length}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {formatCurrency(ib.totalCapitalReferred)}
                  </td>
                  <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(ib.totalIBCommission)}
                  </td>
                </tr>
              ))}
              {affiliatesData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No active Introducing Brokers found. Assign an IB to an investor to see them here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
