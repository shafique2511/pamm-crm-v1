import React from 'react';
import { Investor } from '../types';
import { formatCurrency, formatPercent } from '../lib/utils';
import { X, Printer, Download } from 'lucide-react';

interface InvoiceModalProps {
  investor: Investor;
  onClose: () => void;
}

export function InvoiceModal({ investor, onClose }: InvoiceModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Hidden when printing */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 print:hidden">
          <h2 className="text-xl font-bold text-slate-900">Statement / Invoice</h2>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-10 overflow-y-auto print:p-0 bg-white text-slate-900">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Que PAMM</h1>
              <p className="text-slate-500">Investment Management Statement</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Statement Date</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
              <p className="text-sm text-slate-500 mt-4 mb-1">Invoice #</p>
              <p className="font-medium font-mono text-sm">INV-{investor.id.toUpperCase()}-{new Date().getTime().toString().slice(-6)}</p>
            </div>
          </div>

          <div className="mb-10 p-6 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Prepared For</p>
            <h3 className="text-xl font-bold text-slate-900">{investor.investorName}</h3>
            {investor.bankAccount && (
              <p className="text-sm text-slate-600 mt-2">Account: {investor.bankAccount}</p>
            )}
          </div>

          <table className="w-full mb-10">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 text-slate-900 font-semibold">Description</th>
                <th className="text-right py-3 text-slate-900 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-4 text-slate-600">Starting Capital</td>
                <td className="py-4 text-right font-medium">{formatCurrency(investor.startingCapital)}</td>
              </tr>
              <tr>
                <td className="py-4 text-slate-600">
                  Gross Profit Share 
                  <span className="text-sm text-slate-400 ml-2">({formatPercent(investor.sharePercentage)} of pool)</span>
                </td>
                <td className="py-4 text-right font-medium text-green-600">
                  {investor.individualProfitShare > 0 ? '+' : ''}{formatCurrency(investor.individualProfitShare)}
                </td>
              </tr>
              {investor.lossCarryover > 0 && (
                <tr>
                  <td className="py-4 text-slate-600">Loss Carryover Applied</td>
                  <td className="py-4 text-right font-medium text-red-600">
                    -{formatCurrency(Math.min(investor.lossCarryover, Math.max(0, investor.individualProfitShare)))}
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-4 text-slate-600">
                  Management Fee 
                  <span className="text-sm text-slate-400 ml-2">({investor.feePercentage}%)</span>
                </td>
                <td className="py-4 text-right font-medium text-red-600">
                  -{formatCurrency(investor.yourFee)}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="py-4 px-4 font-semibold text-slate-900 rounded-l-lg">Net Profit</td>
                <td className="py-4 px-4 text-right font-bold text-slate-900 rounded-r-lg">
                  {formatCurrency(investor.netProfit)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 border-b pb-2">Distribution</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Reinvested Amount</span>
                  <span className="font-medium">{formatCurrency(investor.reinvestAmt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cash Payout</span>
                  <span className="font-medium text-blue-600">{formatCurrency(investor.cashPayout)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 border-b pb-2">Fee Status</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Fee Collected</span>
                  <span className="font-medium text-green-600">{formatCurrency(investor.feeCollected)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Unpaid Fee Balance</span>
                  <span className="font-medium text-orange-600">{formatCurrency(investor.unpaidFee)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-slate-900 pt-6 flex justify-between items-center">
            <span className="text-xl font-bold text-slate-900">Ending Capital</span>
            <span className="text-2xl font-bold text-slate-900">{formatCurrency(investor.endingCapital)}</span>
          </div>

          <div className="mt-12 text-center text-sm text-slate-500 print:mt-24">
            <p>Thank you for your continued trust and investment.</p>
            <p className="mt-1">This is a computer-generated document and requires no signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
