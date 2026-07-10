'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  BookOpen,
  Users,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Loader2,
  Clock,
  QrCode,
  ScanLine,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export default function CirculationPage() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  // Tab states: 'issue', 'return', 'ledger'
  const [activeTab, setActiveTab] = useState<'issue' | 'return' | 'ledger'>('issue');

  // Form states
  const [issueIsbn, setIssueIsbn] = useState('');
  const [issueMemberId, setIssueMemberId] = useState('');
  const [activeReturnSearch, setActiveReturnSearch] = useState('');

  // Autocomplete suggestion states
  const [bookSuggestions, setBookSuggestions] = useState<any[]>([]);
  const [memberSuggestions, setMemberSuggestions] = useState<any[]>([]);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [isBookLoading, setIsBookLoading] = useState(false);
  const [isMemberLoading, setIsMemberLoading] = useState(false);

  // Debounced search for books
  useEffect(() => {
    if (!issueIsbn || issueIsbn.trim().length < 2) {
      setBookSuggestions([]);
      return;
    }
    
    const matchingSuggestion = bookSuggestions.find(
      (b) => b.isbn === issueIsbn || b.title === issueIsbn
    );
    if (matchingSuggestion) return;

    setIsBookLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get('/books', { search: issueIsbn, limit: 5 });
        setBookSuggestions(res?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsBookLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [issueIsbn]);

  // Debounced search for members
  useEffect(() => {
    if (!issueMemberId || issueMemberId.trim().length < 2) {
      setMemberSuggestions([]);
      return;
    }

    const matchingSuggestion = memberSuggestions.find(
      (m) => m.id === issueMemberId || m.name === issueMemberId
    );
    if (matchingSuggestion) return;

    setIsMemberLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get('/members', { search: issueMemberId });
        setMemberSuggestions(res?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsMemberLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [issueMemberId]);

  // Fetch active issued transactions for Return tab & Ledger
  const { data: txResponse, isLoading: isTxLoading } = useQuery({
    queryKey: ['circulationTransactions'],
    queryFn: () => api.get('/circulation/transactions')
  });

  const transactions = txResponse?.data || [];
  const activeTransactions = transactions.filter((t: any) => t.status === 'ISSUED' || t.status === 'RENEWED');

  // Issue Book Mutation
  const issueMutation = useMutation({
    mutationFn: (data: { isbn: string; memberId: string }) => api.post('/circulation/issue', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['circulationTransactions'] });
      addToast('Book checked out successfully!', 'success');
      setIssueIsbn('');
      setIssueMemberId('');
    },
    onError: (err: any) => {
      addToast(err.message || 'Checkout failed', 'error');
    }
  });

  // Return Book Mutation
  const returnMutation = useMutation({
    mutationFn: (data: { transactionId: string; statusOverride?: string }) => api.post('/circulation/return', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['circulationTransactions'] });
      const fineMsg = res.fineAmount > 0 ? ` Outstanding fine: $${res.fineAmount.toFixed(2)}.` : '';
      addToast(`Book returned successfully!${fineMsg}`, 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Return failed', 'error');
    }
  });

  // Renew Book Mutation
  const renewMutation = useMutation({
    mutationFn: (transactionId: string) => api.post('/circulation/renew', { transactionId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['circulationTransactions'] });
      addToast(res.message || 'Checkout renewed successfully', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Renewal failed', 'error');
    }
  });

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueIsbn || !issueMemberId) {
      addToast('Please enter both ISBN and Member ID', 'warning');
      return;
    }
    issueMutation.mutate({ isbn: issueIsbn, memberId: issueMemberId });
  };

  // Simulate scanning a barcode (auto-fills forms for testing)
  const handleSimulateScan = (isbn: string, memberId?: string) => {
    if (activeTab === 'issue') {
      if (isbn) setIssueIsbn(isbn);
      if (memberId) setIssueMemberId(memberId);
      addToast(`Scanner Simulator: Filled ISBN ${isbn}`, 'info');
    } else if (activeTab === 'return') {
      setActiveReturnSearch(isbn);
      addToast(`Scanner Simulator: Loaded check-in search query`, 'info');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">

        {/* Header Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Circulation Workspace</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Manage checkouts, checkins, renewals and simulated point-of-sale scanner operations</p>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800/80 gap-6 text-xs font-semibold text-slate-500">
          {[
            { id: 'issue', name: 'Issue Book (Checkout)', icon: ArrowUpRight },
            { id: 'return', name: 'Return Book (Check-in)', icon: ArrowDownLeft },
            { id: 'ledger', name: 'Active Borrow Ledger', icon: FileCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 cursor-pointer transition-colors ${isActive
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent hover:text-slate-700 dark:hover:text-zinc-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab Content Rendering */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main workspace section */}
          <div className="lg:col-span-2">

            {/* 1. ISSUE TAB */}
            {activeTab === 'issue' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col gap-6"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Register Checkout</h3>
                  <span className="text-[10px] text-slate-400">Issue a physical catalog book to an active student or faculty card</span>
                </div>

                <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="text-slate-500">Book ISBN Code or Title</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="e.g. 978-0134685991 or Clean Code"
                          value={issueIsbn}
                          onChange={(e) => {
                            setIssueIsbn(e.target.value);
                            setShowBookDropdown(true);
                          }}
                          onFocus={() => setShowBookDropdown(true)}
                          onBlur={() => setTimeout(() => setShowBookDropdown(false), 200)}
                          className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500"
                        />
                        {showBookDropdown && (bookSuggestions.length > 0 || isBookLoading) && (
                          <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-zinc-800">
                            {isBookLoading ? (
                              <div className="p-3 text-center text-xs text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Searching books...
                              </div>
                            ) : (
                              bookSuggestions.map((book) => (
                                <div
                                  key={book.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIssueIsbn(book.isbn);
                                    setShowBookDropdown(false);
                                  }}
                                  className="p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/60 cursor-pointer text-left transition-colors flex flex-col gap-0.5"
                                >
                                  <div className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                                    {book.title}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 flex justify-between items-center">
                                    <span className="truncate">ISBN: {book.isbn} • {book.authors}</span>
                                    <span className={`font-bold ml-2 shrink-0 ${book.availableCopies > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {book.availableCopies} available
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSimulateScan('978-0134685991')}
                        className="px-3 border border-slate-200/60 dark:border-zinc-855 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Simulate ISBN scan"
                      >
                        <ScanLine className="w-3.5 h-3.5" />
                        Scan
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500">Member ID or Name</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Select, search, or enter student ID or name"
                          value={issueMemberId}
                          onChange={(e) => {
                            setIssueMemberId(e.target.value);
                            setShowMemberDropdown(true);
                          }}
                          onFocus={() => setShowMemberDropdown(true)}
                          onBlur={() => setTimeout(() => setShowMemberDropdown(false), 200)}
                          className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500"
                        />
                        {showMemberDropdown && (memberSuggestions.length > 0 || isMemberLoading) && (
                          <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-zinc-800">
                            {isMemberLoading ? (
                              <div className="p-3 text-center text-xs text-slate-400 dark:text-zinc-550 flex items-center justify-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Searching members...
                              </div>
                            ) : (
                              memberSuggestions.map((member) => (
                                <div
                                  key={member.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIssueMemberId(member.id);
                                    setShowMemberDropdown(false);
                                  }}
                                  className="p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/60 cursor-pointer text-left transition-colors flex flex-col gap-0.5"
                                >
                                  <div className="font-bold text-slate-800 dark:text-zinc-200 truncate flex justify-between items-center">
                                    <span>{member.name}</span>
                                    <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-slate-500 dark:text-zinc-400 uppercase">
                                      {member.role}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-zinc-550 flex justify-between items-center">
                                    <span className="truncate">{member.email}</span>
                                    <span className="font-mono text-[9px] text-slate-400 ml-2">ID: {member.id.substring(0, 8)}...</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSimulateScan('', 'student-sample-id')} // will fetch during seed or mock
                        className="px-3 border border-slate-200/60 dark:border-zinc-855 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Simulate membership card scan"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Scan Card
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={issueMutation.isPending}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {issueMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Checkout
                  </button>
                </form>
              </motion.div>
            )}

            {/* 2. RETURN TAB */}
            {activeTab === 'return' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col gap-6"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Process Check-in</h3>
                  <span className="text-[10px] text-slate-400">Scan book barcode or search active borrows to process returns</span>
                </div>

                <div className="relative text-xs">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search active checkouts by book title or ISBN..."
                    value={activeReturnSearch}
                    onChange={(e) => setActiveReturnSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200/60 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                {/* List matching borrows */}
                <div className="flex flex-col gap-3">
                  {isTxLoading ? (
                    <div className="p-8 text-center text-slate-400">Loading active borrowings...</div>
                  ) : activeTransactions.filter((t: any) =>
                    t.book.title.toLowerCase().includes(activeReturnSearch.toLowerCase()) ||
                    t.book.isbn.includes(activeReturnSearch)
                  ).length > 0 ? (
                    activeTransactions
                      .filter((t: any) =>
                        t.book.title.toLowerCase().includes(activeReturnSearch.toLowerCase()) ||
                        t.book.isbn.includes(activeReturnSearch)
                      )
                      .map((t: any) => {
                        const isLate = new Date() > new Date(t.dueDate);
                        return (
                          <div key={t.id} className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-850/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold">
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-800 dark:text-zinc-200">{t.book.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-1">Borrowed by: {t.member.name} • Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                              {isLate && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-500 mt-1 bg-rose-50 px-2 py-0.5 rounded">
                                  <Clock className="w-3 h-3" /> OVERDUE
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => renewMutation.mutate(t.id)}
                                className="px-3 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 cursor-pointer text-[10px] transition-colors"
                              >
                                Renew
                              </button>
                              <button
                                onClick={() => returnMutation.mutate({ transactionId: t.id })}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer text-[10px] transition-colors"
                              >
                                Process Return
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Mark this book as LOST? A fine equivalent to the purchase price will be billed.')) {
                                    returnMutation.mutate({ transactionId: t.id, statusOverride: 'LOST' });
                                  }
                                }}
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer text-[10px] transition-colors"
                              >
                                Mark Lost
                              </button>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="p-8 text-center border border-dashed rounded-xl text-slate-400 text-xs">
                      No active borrow records found.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 3. BORROW LEDGER TAB */}
            {activeTab === 'ledger' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-805 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Active Borrow Ledger</h3>
                  <span className="text-[10px] text-slate-400">Complete listing of currently checked-out resources</span>
                </div>

                {isTxLoading ? (
                  <div className="p-12 text-center text-slate-400">Loading ledger data...</div>
                ) : activeTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-zinc-300">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-850/50 border-b border-slate-200/50 dark:border-zinc-800/80 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                          <th className="px-6 py-4">Book Title</th>
                          <th className="px-6 py-4">Borrower</th>
                          <th className="px-6 py-4">Checkout Date</th>
                          <th className="px-6 py-4">Due Date</th>
                          <th className="px-6 py-4">Renewals</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                        {activeTransactions.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-zinc-200">{t.book.title}</td>
                            <td className="px-6 py-4">
                              <p className="font-semibold">{t.member.name}</p>
                              <p className="text-[9px] text-slate-400">{t.member.email}</p>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-550 dark:text-zinc-400">
                              {new Date(t.issueDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-semibold font-mono text-[10px]">
                              {new Date(t.dueDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-bold text-indigo-500">{t.renewalCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-16 text-center text-slate-400">
                    No active borrowing records in circulation.
                  </div>
                )}
              </motion.div>
            )}

          </div>

          {/* Scanner Simulator panel - right column */}
          <div className="flex flex-col gap-6">
            <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <ScanLine className="w-4.5 h-4.5 text-indigo-500" />
                  Scanner Simulator
                </h3>
                <span className="text-[10px] text-slate-400">Simulate physical scanner triggers by selecting catalog books or user cards below</span>
              </div>

              {/* Seed books to test barcode scans */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Catalog Books Barcodes</span>
                  <div className="flex flex-col gap-2">
                    {[
                      { title: 'Effective Java', isbn: '978-0134685991' },
                      { title: 'Clean Code', isbn: '978-0132350884' },
                      { title: 'Designing Data-Intensive Systems', isbn: '978-1491950296' }
                    ].map((b) => (
                      <button
                        key={b.isbn}
                        onClick={() => handleSimulateScan(b.isbn)}
                        className="w-full p-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-left text-xs hover:border-indigo-500/50 dark:hover:border-indigo-500/30 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-700 dark:text-zinc-300 truncate">{b.title}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{b.isbn}</p>
                        </div>
                        <ScanLine className="w-3.5 h-3.5 text-slate-350" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Member Cards</span>
                  <div className="flex flex-col gap-2">
                    {[
                      { name: 'Alice Smith (Student)', id: 'student-sample-id' },
                      { name: 'Dr. Robert California (Faculty)', id: 'faculty-sample-id' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSimulateScan('', m.id)}
                        className="w-full p-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-left text-xs hover:border-indigo-500/50 dark:hover:border-indigo-500/30 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-700 dark:text-zinc-300 truncate">{m.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{m.id}</p>
                        </div>
                        <QrCode className="w-3.5 h-3.5 text-slate-350" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[10px] text-indigo-500 leading-relaxed font-semibold">
                Tip: Scanning an ISBN fills the input immediately. Selecting a Member Card fills the Member ID form.
              </div>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
