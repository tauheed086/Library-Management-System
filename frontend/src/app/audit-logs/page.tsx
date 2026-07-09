'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { Loader2, Search, Terminal, AlertTriangle, ChevronLeft, ChevronRight, User } from 'lucide-react';

export default function AuditTrailsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  // Fetch audit logs
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['auditLogsList', search, page, actionFilter],
    queryFn: () =>
      api.get('/audit', {
        search,
        page,
        action: actionFilter,
        limit: 15
      })
  });

  const logs = response?.data || [];
  const pagination = response?.pagination || { totalPages: 1, total: 0 };

  const actions = [
    'USER_LOGIN',
    'USER_REGISTER',
    'PASSWORD_CHANGE',
    'BOOK_CREATE',
    'BOOK_UPDATE',
    'BOOK_DELETE',
    'BOOK_DUPLICATE',
    'BOOK_ISSUE',
    'BOOK_RETURN',
    'BOOK_RENEW',
    'BOOK_RESERVE',
    'FINE_WAIVE',
    'FINE_PAYMENT',
    'SETTINGS_UPDATE',
    'SYSTEM_SEED'
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Audit Trails</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Immutable security activity logs tracking all user logins, settings, and database alterations</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs by action or details..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors shadow-sm"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs text-slate-655 dark:text-zinc-350 outline-none focus:border-indigo-500 shadow-sm"
          >
            <option value="">All Actions</option>
            {actions.map((act) => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-805 rounded-2xl shadow-sm overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs text-slate-400 mt-2">Loading security ledger...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-rose-50 text-rose-600 rounded-2xl">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">Access restricted or backend is offline</p>
            </div>
          ) : logs.length > 0 ? (
            <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-zinc-300">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-850/50 border-b border-slate-200/50 dark:border-zinc-805/85 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Action Event</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Context Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-805/50 font-semibold">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold uppercase text-slate-655 dark:text-zinc-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{log.user.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">SYSTEM</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-[10px]">{log.ipAddress || 'N/A'}</td>
                    <td className="px-6 py-4 max-w-[280px] truncate text-[10px] text-slate-500 dark:text-zinc-400" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center">
              <Terminal className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Empty Logs</h3>
              <p className="text-xs text-slate-400 mt-1">No activities found matching filters.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-450 font-semibold">Page {page} of {pagination.totalPages}</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-slate-205 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="p-1.5 border border-slate-205 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
