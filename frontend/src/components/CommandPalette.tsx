'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  BookOpen,
  Users,
  RefreshCw,
  DollarSign,
  Settings,
  LayoutDashboard,
  Terminal,
  FileText
} from 'lucide-react';

interface PaletteItem {
  title: string;
  subtitle: string;
  category: string;
  icon: React.ComponentType<any>;
  action: () => void;
  roles: string[];
}

export default function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  const items: PaletteItem[] = [
    // Navigation
    {
      title: 'Go to Dashboard',
      subtitle: 'View analytics, stats, and recent activities',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => router.push('/dashboard'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']
    },
    {
      title: 'Browse Catalog',
      subtitle: 'Search the public books catalog',
      category: 'Navigation',
      icon: BookOpen,
      action: () => router.push('/catalog'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN', 'STUDENT', 'FACULTY', 'STAFF']
    },
    {
      title: 'Book Inventory',
      subtitle: 'Manage books, barcodes, and stock levels',
      category: 'Navigation',
      icon: BookOpen,
      action: () => router.push('/books'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']
    },
    {
      title: 'Members Directory',
      subtitle: 'Manage student and faculty library files',
      category: 'Navigation',
      icon: Users,
      action: () => router.push('/members'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']
    },
    {
      title: 'Circulation Module',
      subtitle: 'Issue, return, or renew books',
      category: 'Navigation',
      icon: RefreshCw,
      action: () => router.push('/circulation'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']
    },
    {
      title: 'Fines & Payments',
      subtitle: 'Track fines, process waivers, and record payments',
      category: 'Navigation',
      icon: DollarSign,
      action: () => router.push('/fines'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN', 'STUDENT', 'FACULTY', 'STAFF']
    },
    {
      title: 'System Settings',
      subtitle: 'Configure grace periods, fine rules, and hours',
      category: 'Navigation',
      icon: Settings,
      action: () => router.push('/settings'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN']
    },
    {
      title: 'Audit Trails',
      subtitle: 'Inspect database logs and activities',
      category: 'Navigation',
      icon: Terminal,
      action: () => router.push('/audit-logs'),
      roles: ['SUPER_ADMIN']
    },
    // Quick Actions
    {
      title: 'Issue Book (Checkout)',
      subtitle: 'Circulation: Register new checkout',
      category: 'Quick Action',
      icon: RefreshCw,
      action: () => router.push('/circulation?tab=issue'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']
    },
    {
      title: 'Process Return (Check-in)',
      subtitle: 'Circulation: Process return scan',
      category: 'Quick Action',
      icon: RefreshCw,
      action: () => router.push('/circulation?tab=return'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']
    },
    {
      title: 'Add New Book',
      subtitle: 'Inventory: Register new book title',
      category: 'Quick Action',
      icon: BookOpen,
      action: () => router.push('/books?action=new'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN']
    },
    {
      title: 'Add New Member',
      subtitle: 'Members: Create student/faculty record',
      category: 'Quick Action',
      icon: Users,
      action: () => router.push('/members?action=new'),
      roles: ['SUPER_ADMIN', 'LIBRARIAN']
    }
  ];

  // Filter items based on role and search query
  const filtered = items.filter(
    (item) =>
      item.roles.includes(user?.role || '') &&
      (item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 no-print">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          onClick={() => setCommandPaletteOpen(false)}
          className="fixed inset-0 bg-slate-950"
        />

        {/* Palette Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -10 }}
          onKeyDown={handleKeyDown}
          className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-slate-100 dark:border-zinc-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or route..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              className="flex-1 py-4 bg-transparent border-none text-slate-800 dark:text-zinc-100 placeholder-slate-400 text-sm outline-none"
            />
            <kbd className="inline-flex items-center h-5 select-none rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-slate-400 shadow-sm">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length > 0 ? (
              filtered.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.title}
                    onClick={() => {
                      item.action();
                      setCommandPaletteOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-50 dark:bg-zinc-800/80 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50/50 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-zinc-800'}`}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-none">{item.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{item.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-300 dark:text-zinc-600 border border-slate-200/50 dark:border-zinc-850 rounded px-1">{item.category}</span>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                No commands or routes found for "{search}"
              </div>
            )}
          </div>
          
          {/* Footer Guide */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-850 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-2">
              <span>Use <kbd className="border rounded px-0.5 font-sans">↑↓</kbd> to navigate</span>
              <span>•</span>
              <span>Press <kbd className="border rounded px-0.5 font-sans">Enter</kbd> to execute</span>
            </span>
            <span>Nexus Enterprise Suite</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
