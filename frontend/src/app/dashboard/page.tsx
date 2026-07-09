'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Users,
  TrendingUp,
  Bookmark,
  CalendarDays,
  Plus,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import Link from 'next/link';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function DashboardPage() {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.get('/dashboard/stats')
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-80 lg:col-span-2 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
            <div className="h-80 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !response?.success) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
          <h3 className="font-bold">Failed to load analytics</h3>
          <p className="text-xs mt-1">Please ensure the database service is running and seed was applied.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, trends, widgets } = response.data;

  const cardData = [
    { name: 'Total Inventory', value: stats.totalBooks, sub: 'Total physical copies', icon: BookOpen, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' },
    { name: 'Currently Issued', value: stats.issuedBooks, sub: `${((stats.issuedBooks / (stats.totalBooks || 1)) * 100).toFixed(0)}% check-out rate`, icon: Bookmark, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
    { name: 'Overdue Books', value: stats.overdueBooks, sub: 'Requires immediate action', icon: Clock, color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10', alert: stats.overdueBooks > 0 },
    { name: 'Fine Collected', value: `$${stats.fineCollection.toFixed(2)}`, sub: `$${stats.pendingFines.toFixed(2)} outstanding`, icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' }
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        
        {/* Title & Date Widget */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-650 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Library Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">Real-time analytical ledger of books, checkouts, and circulation fines</p>
          </div>
          <div className="flex items-center gap-2 self-start bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 shadow-sm shadow-slate-100/50">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* 1. Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cardData.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-6 rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden group hover-card-trigger ${
                  card.alert 
                    ? 'border-rose-200/80 dark:border-rose-950/50 bg-rose-50/10 dark:bg-rose-950/5' 
                    : 'border-slate-200/60 dark:border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{card.name}</span>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 tracking-tight">{card.value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 font-semibold flex items-center gap-1">
                  <span>{card.sub}</span>
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* 2. Primary Charts (Double Column layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Issue vs Returns Area Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Circulation Trend</h3>
                <span className="text-[10px] text-slate-400">Monthly breakdown of checkouts and returns</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-indigo-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Issues
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Returns
                </span>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.circulation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  />
                  <Area type="monotone" dataKey="issues" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorIssues)" />
                  <Area type="monotone" dataKey="returns" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReturns)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Book Category Distribution Donut Chart */}
          <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Genre Share</h3>
              <span className="text-[10px] text-slate-400">Inventory spread across genres</span>
            </div>
            <div className="h-64 w-full flex justify-center items-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trends.categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {trends.categories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} copies`]}
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text overlay */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                  {trends.categories.reduce((acc: number, cur: any) => acc + cur.value, 0)}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Total Copies</span>
              </div>
            </div>
            {/* Custom Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-auto text-[10px] font-semibold text-slate-500 dark:text-zinc-400 max-h-20 overflow-y-auto">
              {trends.categories.map((c: any, idx: number) => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate max-w-[80px]">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Secondary Widgets & Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Membership growth line chart */}
          <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Membership Growth</h3>
              <span className="text-[10px] text-slate-400">Total registered members timeline</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.members} margin={{ left: -30, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  />
                  <Line type="monotone" dataKey="members" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fine Collections Trend bar chart */}
          <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Fine Inflow</h3>
              <span className="text-[10px] text-slate-400">Monthly fines collected trend</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.fines} margin={{ left: -20, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Tooltip
                    formatter={(val) => [`$${val}`]}
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular books list */}
          <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Top Borrowed Books</h3>
              <span className="text-[10px] text-slate-400">Most checked out resources</span>
            </div>
            <div className="flex flex-col gap-3 justify-center flex-1 overflow-y-auto">
              {trends.popularBooks.map((book: any, idx: number) => (
                <div key={book.title} className="flex items-center gap-3 text-xs">
                  <div className="w-6 h-6 rounded bg-slate-100 dark:bg-zinc-850 flex items-center justify-center font-bold text-[10px] text-slate-500 dark:text-zinc-400">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 dark:text-zinc-200 truncate">{book.title}</p>
                    <p className="text-[9px] text-slate-400 truncate">{book.authors}</p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-500">{book.borrowCount} issues</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Widgets: Recent Activity & Latest Users */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent checkout/return logs */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
                <span className="text-[10px] text-slate-400">Real-time ledger checkouts/returns</span>
              </div>
              <Link href="/circulation?tab=transactions" className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                View Ledger <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {widgets.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-850/50 text-xs border border-slate-100 dark:border-zinc-800/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${tx.status === 'RETURNED' ? 'bg-emerald-500' : tx.status === 'OVERDUE' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-850 dark:text-zinc-200 truncate">{tx.book.title}</p>
                      <p className="text-[10px] text-slate-450 mt-0.5">Borrowed by {tx.member.name} ({tx.member.role.toLowerCase()})</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                    <p>{new Date(tx.issueDate).toLocaleDateString()}</p>
                    <p className="mt-0.5 uppercase tracking-wider font-bold text-[9px]" style={{ color: tx.status === 'RETURNED' ? '#10b981' : tx.status === 'OVERDUE' ? '#ef4444' : '#6366f1' }}>{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newest members joined */}
          <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Latest Members</h3>
                <span className="text-[10px] text-slate-400">Newly joined student & faculty</span>
              </div>
              <Link href="/members" className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                All Members <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              {widgets.latestMembers.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center overflow-hidden">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-4 h-4 text-indigo-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-zinc-200 truncate">{m.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{m.role.replace('_', ' ').toLowerCase()} • {m.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
