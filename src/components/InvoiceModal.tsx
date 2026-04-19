import React, { useRef, useState } from 'react';
import { Investor } from '../types';
import { formatCurrency, formatPercent } from '../lib/utils';
import { X, Printer, Download, Building, Building2, CheckCircle2, Loader2, Info } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceModalProps {
  investor: Investor;
  onClose: () => void;
}

export function InvoiceModal({ investor, onClose }: InvoiceModalProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPDF(true);
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Statement_${investor.investorName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF statement.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const invoiceNumber = `INV-${investor.id.toUpperCase().substring(0, 8)}-${new Date().getTime().toString().slice(-4)}`;
  const displayCurrency = investor.baseCurrency || 'USD';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        {/* Header - Hidden when printing */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 print:hidden bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Statement Details</h2>
              <p className="text-sm font-medium text-slate-500">View, print, or download financial statement</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isGeneratingPDF ? 'Generating...' : 'Save PDF'}
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-bold transition-all"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <div className="w-px h-10 bg-slate-200 mx-1"></div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-12 overflow-y-auto print:p-0 bg-white relative print:overflow-visible" ref={printRef}>
          {/* Subtle Watermark */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
            <Building className="w-[500px] h-[500px] text-slate-900" />
          </div>

          <div className="relative z-10">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-16">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">Que PAMM</h1>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Investment Management</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Statement Date</p>
                <p className="font-bold text-slate-900 text-lg">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-1">Invoice Reference</p>
                <p className="font-mono font-bold text-slate-600 text-sm bg-slate-50 px-3 py-1 rounded-lg inline-block border border-slate-100">{invoiceNumber}</p>
              </div>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="p-6 bg-slate-50/50 outline outline-1 outline-slate-100 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Prepared For</p>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{investor.investorName}</h3>
                <div className="space-y-1">
                  {investor.idNumber && <p className="text-sm font-medium text-slate-600"><span className="text-slate-400">ID:</span> {investor.idNumber}</p>}
                  {investor.address && <p className="text-sm font-medium text-slate-600"><span className="text-slate-400">Addr:</span> {investor.address}</p>}
                  {investor.country && <p className="text-sm font-medium text-slate-600"><span className="text-slate-400">Country:</span> {investor.country}</p>}
                </div>
                {investor.bankAccount && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 mb-1">Registered Payment Details:</p>
                    <p className="text-sm font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200 break-all">{investor.bankAccount}</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-indigo-50/50 outline outline-1 outline-indigo-100 rounded-2xl flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Account Group</p>
                    <p className="font-bold text-indigo-900">{investor.group || 'Standard'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Base Currency</p>
                    <p className="font-bold text-indigo-900">{displayCurrency}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">High Water Mark</p>
                    <p className="font-bold text-indigo-900">{formatCurrency(investor.highWaterMark, displayCurrency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Fee Structure</p>
                    <p className="font-bold text-indigo-900">{investor.feePercentage}% <span className="text-xs text-indigo-500 font-medium">performance</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="mb-10 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-900 text-white text-xs uppercase tracking-widest font-black">
                  <tr>
                    <th className="px-6 py-4">Transaction Description</th>
                    <th className="px-6 py-4 text-right">Amount ({displayCurrency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-6 py-5 text-slate-600 font-medium">Starting Capital for Period</td>
                    <td className="px-6 py-5 text-right font-bold text-slate-900">{formatCurrency(investor.startingCapital, displayCurrency)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-5 text-slate-600 font-medium">
                      <div className="flex flex-col">
                        <span>Gross Profit Share Allocation</span>
                        <span className="text-xs text-slate-400 font-normal mt-0.5">Represents {formatPercent(investor.sharePercentage)} of the total pool growth</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-emerald-600">
                      {investor.individualProfitShare > 0 ? '+' : ''}{formatCurrency(investor.individualProfitShare, displayCurrency)}
                    </td>
                  </tr>
                  {investor.lossCarryover > 0 && (
                    <tr className="bg-rose-50/30">
                      <td className="px-6 py-5 text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-rose-400" />
                          <span>Loss Carryover Applied</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-rose-600">
                        -{formatCurrency(Math.min(investor.lossCarryover, Math.max(0, investor.individualProfitShare)), displayCurrency)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="px-6 py-5 text-slate-600 font-medium">
                      Management Performance Fee Deducted
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-rose-600">
                      -{formatCurrency(investor.yourFee, displayCurrency)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-6 py-5 font-black text-slate-900 uppercase tracking-widest text-xs">Period Net Profit</td>
                    <td className={`px-6 py-5 text-right font-black text-lg ${investor.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {investor.netProfit > 0 ? '+' : ''}{formatCurrency(investor.netProfit, displayCurrency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Distribution & Fees */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Capital Distribution</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium text-sm">Target Reinvested Amount</span>
                    <span className="font-bold text-slate-900">{formatCurrency(investor.reinvestAmt, displayCurrency)}</span>
                  </div>
                  <div className="w-full h-px bg-slate-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium text-sm">Target Cash Payout</span>
                    <span className="font-black text-blue-600 text-lg">{formatCurrency(investor.cashPayout, displayCurrency)}</span>
                  </div>
                </div>
              </div>
              
              <div className="border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Management Fee Accounting</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium text-sm">Total Fee Collected</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(investor.feeCollected, displayCurrency)}</span>
                  </div>
                  <div className="w-full h-px bg-slate-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium text-sm">Outstanding Fee Balance</span>
                    <span className="font-black text-amber-600 text-lg">{formatCurrency(investor.unpaidFee, displayCurrency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grand Total */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 flex justify-between items-center shadow-xl shadow-slate-900/10">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Final Asset Value</span>
                <span className="text-sm font-medium text-slate-300">Total Ending Capital for the period</span>
              </div>
              <span className="text-4xl font-black tracking-tight text-white">{formatCurrency(investor.endingCapital, displayCurrency)}</span>
            </div>

            {/* Footer */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center justify-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full text-xs uppercase tracking-widest border border-emerald-100">Verified Statement</span>
              </div>
              <p className="text-xs font-medium text-slate-500">Thank you for your continued trust and investment in Que PAMM.</p>
              <p className="mt-1 text-xs text-slate-400">This is a computer-generated document. For inquiries, please contact your fund manager.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
