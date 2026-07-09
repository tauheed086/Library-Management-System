'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { motion } from 'framer-motion';
import {
  History,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export default function BorrowedItemsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Fetch active user's transactions
  // Role-based filtering on the backend automatically restricts this list to the logged-in user
  const { data: response, isLoading } = useQuery({
    queryKey: ['borrowedItemsList'],
    queryFn: () => api.get('/circulation/transactions')
  });

  const transactions = response?.data || [];

  // Categorize transactions
  const activeCheckouts = transactions.filter(
    (tx: any) => tx.status === 'ISSUED' || tx.status === 'RENEWED'
  );

  const borrowHistory = transactions.filter(
    (tx: any) => tx.status === 'RETURNED' || tx.status === 'LOST' || tx.status === 'DAMAGED'
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <History className="w-5.5 h-5.5 text-indigo-500" />
              Borrowed Items
            </h1>
            <p className="text-xs text-slate-400 dark:text-zinc-400">
              View your current active loans, due dates, and past borrowing history
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-2xl border border-slate-200/40 dark:border-zinc-800/40 w-fit self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'active'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-550 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Active ({activeCheckouts.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'history'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-550 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Borrowing History ({borrowHistory.length})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold animate-pulse">Loading items...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm"
          >
            {activeTab === 'active' ? (
              /* ACTIVE LOANS TABLE */
              activeCheckouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-slate-50 dark:bg-zinc-850/80 border-b border-slate-100 dark:border-zinc-800 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="px-6 py-4">Book Reference</th>
                        <th className="px-6 py-4">Checkout Date</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4 text-center">Renewals</th>
                        <th className="px-6 py-4 text-right">Time Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {activeCheckouts.map((tx: any) => {
                        const isOverdue = new Date(tx.dueDate) < new Date();
                        const daysRemaining = Math.ceil(
                          (new Date(tx.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/20 transition-colors">
                            {/* Book Title & ISBN */}
                            <td className="px-6 py-4 max-w-sm">
                              <div className="flex gap-3 items-center">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500 flex-shrink-0">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-700 dark:text-zinc-200 truncate">{tx.book.title}</p>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">ISBN: {tx.book.isbn}</p>
                                </div>
                              </div>
                            </td>

                            {/* Checkout Date */}
                            <td className="px-6 py-4 text-slate-600 dark:text-zinc-300 font-mono">
                              {new Date(tx.issueDate).toLocaleDateString()}
                            </td>

                            {/* Due Date */}
                            <td className="px-6 py-4 font-mono">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${isOverdue
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : 'bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10'
                                }`}>
                                {new Date(tx.dueDate).toLocaleDateString()}
                              </span>
                            </td>

                            {/* Renewals */}
                            <td className="px-6 py-4 text-center text-slate-700 dark:text-zinc-300 font-bold">
                              {tx.renewalCount}
                            </td>

                            {/* Status / Time Remaining */}
                            <td className="px-6 py-4 text-right">
                              {isOverdue ? (
                                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                                </span>
                              ) : (
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${daysRemaining <= 3
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                                    : 'bg-emerald-500/10 text-emerald-600'
                                  }`}>
                                  {daysRemaining > 0
                                    ? `${daysRemaining} days left`
                                    : 'Due today'
                                  }
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center">
                  <BookOpen className="w-10 h-10 text-slate-350 dark:text-zinc-700 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-600 dark:text-zinc-400">No Active Loans</h3>
                  <p className="text-xs text-slate-400 mt-1">You don't have any books borrowed right now.</p>
                </div>
              )
            ) : (
              /* BORROWING HISTORY TABLE */
              borrowHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-slate-50 dark:bg-zinc-850/80 border-b border-slate-100 dark:border-zinc-800 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="px-6 py-4">Book Reference</th>
                        <th className="px-6 py-4">Checkout Date</th>
                        <th className="px-6 py-4">Return Date</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {borrowHistory.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/20 transition-colors">
                          {/* Book Title & ISBN */}
                          <td className="px-6 py-4 max-w-sm">
                            <div className="flex gap-3 items-center">
                              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 flex-shrink-0">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-700 dark:text-zinc-200 truncate">{tx.book.title}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">ISBN: {tx.book.isbn}</p>
                              </div>
                            </div>
                          </td>

                          {/* Checkout Date */}
                          <td className="px-6 py-4 text-slate-600 dark:text-zinc-300 font-mono">
                            {new Date(tx.issueDate).toLocaleDateString()}
                          </td>

                          {/* Return Date */}
                          <td className="px-6 py-4 text-slate-600 dark:text-zinc-300 font-mono">
                            {tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : 'N/A'}
                          </td>

                          {/* Final Status */}
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${tx.status === 'RETURNED'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : tx.status === 'LOST'
                                  ? 'bg-rose-500/10 text-rose-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center">
                  <History className="w-10 h-10 text-slate-350 dark:text-zinc-700 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-600 dark:text-zinc-400">No Borrowing History</h3>
                  <p className="text-xs text-slate-400 mt-1">Your past borrowing records will appear here.</p>
                </div>
              )
            )}
          </motion.div>
        )}

      </div>
    </DashboardLayout>
  );
}
