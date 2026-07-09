'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  AlertTriangle,
  Search,
  X,
  Loader2,
  Printer,
  Scale,
  CreditCard,
  History,
  CheckCircle
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export default function FinesLedgerPage() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeWaiveFine, setActiveWaiveFine] = useState<any | null>(null);
  const [activePayFine, setActivePayFine] = useState<any | null>(null);
  const [waiveAmount, setWaiveAmount] = useState('');
  const [waiveReason, setWaiveReason] = useState('');
  
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');
  
  const [printReceiptData, setPrintReceiptData] = useState<any | null>(null);

  // Fetch fines
  const { data: response, isLoading } = useQuery({
    queryKey: ['finesList', statusFilter],
    queryFn: () => api.get('/fines', { status: statusFilter })
  });

  const fines = response?.data || [];

  // Waive fine mutation
  const waiveMutation = useMutation({
    mutationFn: (data: { id: string; amount: number; reason: string }) => 
      api.post(`/fines/${data.id}/waive`, { amount: data.amount, reason: data.reason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['finesList'] });
      addToast(res.message || 'Fine waived successfully', 'success');
      setActiveWaiveFine(null);
      setWaiveAmount('');
      setWaiveReason('');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to waive fine', 'error');
    }
  });

  // Record payment mutation
  const payMutation = useMutation({
    mutationFn: (data: { id: string; amountPaid: number; paymentMethod: string }) =>
      api.post(`/fines/${data.id}/pay`, { amountPaid: data.amountPaid, paymentMethod: data.paymentMethod }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['finesList'] });
      addToast(res.message || 'Payment recorded successfully', 'success');
      
      // Auto open print receipt layout
      setPrintReceiptData(res.data.payment);
      setActivePayFine(null);
      setPayAmount('');
    },
    onError: (err: any) => {
      addToast(err.message || 'Payment failed', 'error');
    }
  });

  const handleWaiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiveAmount || Number(waiveAmount) <= 0) {
      addToast('Please enter a valid waive amount', 'warning');
      return;
    }
    waiveMutation.mutate({
      id: activeWaiveFine.id,
      amount: Number(waiveAmount),
      reason: waiveReason
    });
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      addToast('Please enter a valid payment amount', 'warning');
      return;
    }
    payMutation.mutate({
      id: activePayFine.id,
      amountPaid: Number(payAmount),
      paymentMethod: payMethod
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Header Block */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Fines Ledger</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Manage outstanding fee balances, waiving triggers, and print receipt records</p>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by member name, book..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors shadow-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs text-slate-655 dark:text-zinc-350 outline-none focus:border-indigo-500 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="UNPAID">Outstanding (Unpaid)</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Settle Paid</option>
            <option value="WAIVED">Waived</option>
          </select>
        </div>

        {/* Fines Table */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs text-slate-400 mt-2">Loading fine balances...</p>
            </div>
          ) : fines.length > 0 ? (
            <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-zinc-300">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-850/50 border-b border-slate-200/50 dark:border-zinc-805/80 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <th className="px-6 py-4">Borrower</th>
                  <th className="px-6 py-4">Book Reference</th>
                  <th className="px-6 py-4">Overdue Reason</th>
                  <th className="px-6 py-4">Fine Amount</th>
                  <th className="px-6 py-4">Paid / Waived</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {fines
                  .filter((f: any) => 
                    f.member.name.toLowerCase().includes(search.toLowerCase()) ||
                    f.transaction.book.title.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((f: any) => {
                    const balance = f.amount - f.paidAmount - f.waivedAmount;
                    return (
                      <tr key={f.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 dark:text-zinc-200">{f.member.name}</p>
                          <p className="text-[9px] text-slate-400">{f.member.email} • {f.member.role.toLowerCase()}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold">{f.transaction.book.title}</td>
                        <td className="px-6 py-4 text-slate-500 font-semibold max-w-[150px] truncate" title={f.reason}>{f.reason || 'N/A'}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-zinc-200">${f.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 font-semibold text-slate-500">
                          <span>${f.paidAmount.toFixed(2)} / ${f.waivedAmount.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            f.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' :
                            f.status === 'WAIVED' ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400' :
                            'bg-rose-500/10 text-rose-600'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {balance > 0 ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setActiveWaiveFine(f);
                                  setWaiveAmount(String(balance));
                                }}
                                className="px-2.5 py-1 border border-slate-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold text-indigo-500 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
                              >
                                Waive
                              </button>
                              <button
                                onClick={() => {
                                  setActivePayFine(f);
                                  setPayAmount(String(balance));
                                }}
                                className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Settle Pay
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Settle
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center">
              <DollarSign className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Clean Ledger</h3>
              <p className="text-xs text-slate-400 mt-1">No outstanding fines or late fees recorded.</p>
            </div>
          )}
        </div>

        {/* Waive Modal */}
        <AnimatePresence>
          {activeWaiveFine && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setActiveWaiveFine(null)} className="fixed inset-0 bg-black" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl p-6 relative z-10">
                <button onClick={() => setActiveWaiveFine(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-655"><X className="w-4 h-4" /></button>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Waive Library Fine</h3>
                
                <form onSubmit={handleWaiveSubmit} className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="text-slate-500">Waive Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={waiveAmount}
                      onChange={(e) => setWaiveAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500">Reason / Reference</label>
                    <input
                      type="text"
                      placeholder="Medical leave extension, etc."
                      value={waiveReason}
                      onChange={(e) => setWaiveReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={waiveMutation.isPending}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    {waiveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Waive Fine
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Pay Settle Modal */}
        <AnimatePresence>
          {activePayFine && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setActivePayFine(null)} className="fixed inset-0 bg-black" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl p-6 relative z-10">
                <button onClick={() => setActivePayFine(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-655"><X className="w-4 h-4" /></button>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Record Fine Payment</h3>
                
                <form onSubmit={handlePaySubmit} className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="text-slate-500">Payment Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500">Method</label>
                    <select
                      value={payMethod}
                      onChange={(e: any) => setPayMethod(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none"
                    >
                      <option value="CASH">Cash Payment</option>
                      <option value="CARD">Debit/Credit Card</option>
                      <option value="ONLINE">Online Portal</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={payMutation.isPending}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    {payMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Settle Payment
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Printable Payment Receipt View */}
        <AnimatePresence>
          {printReceiptData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setPrintReceiptData(null)} className="fixed inset-0 bg-black" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl p-6 relative z-10 text-center flex flex-col items-center">
                <button onClick={() => setPrintReceiptData(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-655"><X className="w-4 h-4" /></button>
                
                <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-6">Payment Recorded</h4>

                {/* Printable receipt structure */}
                <div className="w-[300px] border border-slate-100 rounded-2xl bg-white p-6 flex flex-col justify-between print-section shadow-sm text-slate-800 mb-6 font-sans text-xs text-left">
                  <div className="text-center border-b pb-3 mb-3">
                    <h5 className="font-bold text-[12px]">NEXUS ENTERPRISE LIBRARY</h5>
                    <p className="text-[8px] text-slate-400 mt-0.5">Transaction Receipt Ledger</p>
                  </div>

                  <div className="space-y-1.5 text-[9px] text-slate-550">
                    <p>Receipt Number: <span className="font-bold font-mono text-slate-800">{printReceiptData.receiptNumber}</span></p>
                    <p>Date: <span className="font-bold text-slate-800">{new Date(printReceiptData.paymentDate).toLocaleString()}</span></p>
                    <p>Method: <span className="font-bold text-slate-800">{printReceiptData.paymentMethod}</span></p>
                  </div>

                  <div className="border-t border-b py-3 my-3 text-[10px] font-bold text-slate-800 flex justify-between">
                    <span>Settle Late fine amount:</span>
                    <span>${printReceiptData.amountPaid.toFixed(2)}</span>
                  </div>

                  <div className="text-[8px] text-center text-slate-400 mt-2">
                    Thank you for settling library fines. Keep book return schedules active!
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-center w-full">
                  <button
                    onClick={() => setPrintReceiptData(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-zinc-805 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-655 dark:text-zinc-400 font-semibold rounded-xl text-xs cursor-pointer flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] flex-1"
                  >
                    <Printer className="w-4.5 h-4.5" />
                    Print Receipt
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
