import React, { useMemo, useState } from 'react';
import { IBPayoutRequest, Investor, PeriodHistory } from '../types';
import { formatCurrency } from '../lib/utils';
import { toFiniteMoney } from '../lib/money';
import { buildIbCommissionLedger, generateReferralCode } from '../lib/ib';
import { CheckCircle2, Copy, DollarSign, FileText, Percent, ShieldAlert, Users, Wallet, XCircle } from 'lucide-react';

interface AffiliatesViewProps {
  investors: Investor[];
  periodHistory?: PeriodHistory[];
  currentUser?: { role: 'admin' | 'investor', name: string } | null;
  isAdmin?: boolean;
}

export function AffiliatesView({ investors, periodHistory = [], currentUser, isAdmin }: AffiliatesViewProps) {
  const [payoutRequests, setPayoutRequests] = useState<IBPayoutRequest[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const ledgerEntries = useMemo(() => {
    const entries = buildIbCommissionLedger(investors, periodHistory);

    if (isAdmin || !currentUser) return entries;
    return entries.filter(entry => entry.ibName.toLowerCase() === currentUser.name.toLowerCase());
  }, [investors, periodHistory, currentUser, isAdmin]);

  const affiliatesData = useMemo(() => {
    const ibMap = new Map<string, {
      ibId: string;
      name: string;
      referralCode: string;
      referralLink: string;
      referredInvestors: Investor[];
      totalCapitalReferred: number;
      periodCommissions: number;
      lifetimeCommissions: number;
      pendingPayouts: number;
      paidPayouts: number;
    }>();

    const visibleInvestors = investors.filter(inv => {
      if (!inv.referredBy) return false;
      return isAdmin || !currentUser || inv.referredBy.toLowerCase() === currentUser.name.toLowerCase();
    });

    visibleInvestors.forEach(inv => {
      const ibName = inv.referredBy!.trim();
      const referralCode = generateReferralCode(ibName);

      if (!ibMap.has(ibName)) {
        ibMap.set(ibName, {
          ibId: referralCode,
          name: ibName,
          referralCode,
          referralLink: `${window.location.origin}/apply?ref=${encodeURIComponent(referralCode)}`,
          referredInvestors: [],
          totalCapitalReferred: 0,
          periodCommissions: 0,
          lifetimeCommissions: 0,
          pendingPayouts: 0,
          paidPayouts: 0,
        });
      }

      const ibData = ibMap.get(ibName)!;
      ibData.referredInvestors.push(inv);
      ibData.totalCapitalReferred += toFiniteMoney(inv.startingCapital);
    });

    ledgerEntries.forEach(entry => {
      const ibData = ibMap.get(entry.ibName);
      if (!ibData) return;
      ibData.periodCommissions += entry.status === 'approved' ? entry.commissionAmount : 0;
      ibData.lifetimeCommissions += entry.commissionAmount;
    });

    payoutRequests.forEach(request => {
      const ibData = ibMap.get(request.ibName);
      if (!ibData) return;
      if (request.status === 'pending' || request.status === 'approved') ibData.pendingPayouts += request.amount;
      if (request.status === 'paid') ibData.paidPayouts += request.amount;
    });

    return Array.from(ibMap.values()).sort((a, b) => b.lifetimeCommissions - a.lifetimeCommissions);
  }, [investors, ledgerEntries, payoutRequests, currentUser, isAdmin]);

  const totalAvailableCommission = affiliatesData.reduce((sum, ib) => sum + Math.max(0, ib.lifetimeCommissions - ib.pendingPayouts - ib.paidPayouts), 0);

  const handleCopyReferralLink = async (ibName: string, link: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedCode(ibName);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const createPayoutRequest = (ibName: string, amount: number) => {
    if (amount <= 0) return;

    setPayoutRequests(prev => [{
      id: window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
      ibId: generateReferralCode(ibName),
      ibName,
      amount,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      notes: 'IB commission payout request',
    }, ...prev]);
  };

  const updatePayoutStatus = (id: string, status: IBPayoutRequest['status']) => {
    setPayoutRequests(prev => prev.map(request => request.id === id ? {
      ...request,
      status,
      resolvedAt: new Date().toISOString(),
    } : request));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Active IBs" value={affiliatesData.length.toString()} icon={Users} color="emerald" />
        <MetricCard title="Referred Capital" value={formatCurrency(affiliatesData.reduce((sum, ib) => sum + ib.totalCapitalReferred, 0))} icon={DollarSign} color="blue" />
        <MetricCard title="Ledger Commission" value={formatCurrency(ledgerEntries.reduce((sum, entry) => sum + entry.commissionAmount, 0))} icon={Percent} color="purple" />
        <MetricCard title="Available Payout" value={formatCurrency(totalAvailableCommission)} icon={Wallet} color="amber" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">IB Referral Dashboard</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Referral links, referred AUM, ledger commissions, and payout availability.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">IB</th>
                <th className="px-6 py-4 font-medium">Invite Link</th>
                <th className="px-6 py-4 font-medium">Referred Investors</th>
                <th className="px-6 py-4 font-medium">Capital</th>
                <th className="px-6 py-4 font-medium">Period Commission</th>
                <th className="px-6 py-4 font-medium">Pending Payout</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {affiliatesData.map((ib) => {
                const available = Math.max(0, ib.lifetimeCommissions - ib.pendingPayouts - ib.paidPayouts);
                return (
                  <tr key={ib.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{ib.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{ib.referralCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleCopyReferralLink(ib.name, ib.referralLink)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {copiedCode === ib.name ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedCode === ib.name ? 'Copied' : 'Copy /apply link'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{ib.referredInvestors.length}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatCurrency(ib.totalCapitalReferred)}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(ib.periodCommissions)}</td>
                    <td className="px-6 py-4 text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(ib.pendingPayouts)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={available <= 0}
                        onClick={() => createPayoutRequest(ib.name, available)}
                        className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white disabled:opacity-40 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900"
                      >
                        Request Payout
                      </button>
                    </td>
                  </tr>
                );
              })}
              {affiliatesData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No IB referrals yet. Add `referredBy` to an investor or onboard with a referral code.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LedgerTable entries={ledgerEntries} />
        <PayoutRequestsTable requests={payoutRequests} isAdmin={!!isAdmin} onUpdateStatus={updatePayoutStatus} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: 'emerald' | 'blue' | 'purple' | 'amber' }) {
  const styles = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${styles[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function LedgerTable({ entries }: { entries: ReturnType<typeof buildIbCommissionLedger> }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <FileText className="w-5 h-5 text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">IB Commission Ledger</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-4 font-medium">IB</th>
              <th className="px-6 py-4 font-medium">Investor</th>
              <th className="px-6 py-4 font-medium">Source</th>
              <th className="px-6 py-4 font-medium">Base</th>
              <th className="px-6 py-4 font-medium">Rate</th>
              <th className="px-6 py-4 font-medium">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {entries.map(entry => (
              <tr key={entry.id}>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{entry.ibName}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{entry.investorName}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{entry.source.replace('_', ' ')}</td>
                <td className="px-6 py-4">{formatCurrency(entry.baseAmount)}</td>
                <td className="px-6 py-4">{entry.commissionRate}%</td>
                <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(entry.commissionAmount)}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">No commission ledger entries for the current period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayoutRequestsTable({ requests, isAdmin, onUpdateStatus }: { requests: IBPayoutRequest[]; isAdmin: boolean; onUpdateStatus: (id: string, status: IBPayoutRequest['status']) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">IB Payout Requests</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-4 font-medium">IB</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {requests.map(request => (
              <tr key={request.id}>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{request.ibName}</td>
                <td className="px-6 py-4">{formatCurrency(request.amount)}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    <ShieldAlert className="w-3 h-3" />
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {isAdmin && request.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onUpdateStatus(request.id, 'approved')} className="p-2 rounded-lg bg-emerald-600 text-white">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onUpdateStatus(request.id, 'rejected')} className="p-2 rounded-lg bg-rose-600 text-white">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {isAdmin && request.status === 'approved' && (
                    <button onClick={() => onUpdateStatus(request.id, 'paid')} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">No payout requests yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
