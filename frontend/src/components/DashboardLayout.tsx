'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useThemeStore } from '../store/themeStore';
import CommandPalette from './CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  RefreshCw,
  DollarSign,
  Settings,
  History,
  Menu,
  ChevronLeft,
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User as UserIcon,
  Terminal,
  Bookmark,
  Library
} from 'lucide-react';
import Link from 'next/link';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
  { name: 'Catalog', href: '/catalog', icon: BookOpen, roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN', 'STUDENT', 'FACULTY', 'STAFF'] },
  { name: 'Book Inventory', href: '/books', icon: Library, roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
  { name: 'Members', href: '/members', icon: Users, roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
  { name: 'Circulation POS', href: '/circulation', icon: RefreshCw, roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'] },
  { name: 'Fines Ledger', href: '/fines', icon: DollarSign, roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN', 'STUDENT', 'FACULTY', 'STAFF'] },
  { name: 'Borrowed Items', href: '/borrowed', icon: History, roles: ['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN', 'STUDENT', 'FACULTY', 'STAFF'] },
  { name: 'Audit Logs', href: '/audit-logs', icon: Terminal, roles: ['SUPER_ADMIN'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'LIBRARIAN'] }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar, addToast } = useUIStore();
  const { theme, setTheme } = useThemeStore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keyboard shortcut listener for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Protect route
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [isMounted, isAuthenticated, router]);

  if (!isMounted || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter navigation by role
  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'success');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* 1. Sidebar - Desktop */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 80 : 260 }}
        className="hidden md:flex flex-col border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 h-screen overflow-hidden z-20"
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800 h-16">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm">
              N
            </div>
            {!isSidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
                Nexus LMS
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-300'}`} />
                  {!isSidebarCollapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {item.name}
                    </motion.span>
                  )}
                  {isSidebarCollapsed && (
                    <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-30">
                      {item.name}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors w-full flex items-center justify-center gap-2"
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-semibold">Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 no-print">
          {/* Left Breadcrumb / Global Search */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200/80 dark:hover:bg-zinc-800/80 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl px-3 py-1.5 cursor-pointer text-slate-400 dark:text-zinc-500 text-sm transition-colors"
              onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search records...</span>
              <kbd className="hidden lg:inline-flex items-center h-5 select-none rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-slate-400 dark:text-zinc-500 ml-4 shadow-sm">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800 text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
              </button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xl z-40"
                    >
                      <h4 className="font-semibold text-sm mb-3">System Alerts</h4>
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 text-xs">
                          <p className="font-medium text-slate-800 dark:text-zinc-200">Book Return Overdue</p>
                          <p className="text-slate-400 mt-1">Student Alice Smith has 1 overdue book</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 text-xs">
                          <p className="font-medium text-slate-800 dark:text-zinc-200">New Reservation</p>
                          <p className="text-slate-400 mt-1">"Introduction to Algorithms" reserved by Faculty Robert California</p>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                className="p-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800 text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
              >
                {theme === 'light' ? <Sun className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              </button>
              
              <AnimatePresence>
                {isThemeOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsThemeOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-36 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-xl z-40 flex flex-col gap-0.5"
                    >
                      {[
                        { name: 'Light', value: 'light', icon: Sun },
                        { name: 'Dark', value: 'dark', icon: Moon },
                        { name: 'System', value: 'system', icon: Monitor }
                      ].map((t) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.value}
                            onClick={() => {
                              setTheme(t.value as any);
                              setIsThemeOpen(false);
                            }}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer w-full text-left transition-colors ${
                              theme === t.value
                                ? 'bg-slate-100 dark:bg-zinc-850 text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {t.name}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 overflow-hidden flex items-center justify-center">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-indigo-500" />
                  )}
                </div>
                <div className="hidden lg:flex flex-col items-start leading-none text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{user.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 capitalize">{user.role.replace('_', ' ').toLowerCase()}</span>
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-xl z-40 flex flex-col gap-0.5"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 text-xs flex flex-col mb-1.5 text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">{user.name}</span>
                        <span className="mt-0.5">{user.email}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 cursor-pointer w-full text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 3. Sidebar - Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 z-40 p-6 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between mb-8 h-10">
                <span className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-sm">N</div>
                  Nexus LMS
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-1">
                {visibleNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <CommandPalette />
    </div>
  );
}
