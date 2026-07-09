'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  Filter,
  Grid,
  List,
  ChevronRight,
  Info,
  Clock,
  Sparkles,
  MapPin,
  Bookmark,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export default function CatalogPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const addToast = useUIStore((state) => state.addToast);

  // Fetch books matching criteria
  const { data: response, isLoading } = useQuery({
    queryKey: ['catalogBooks', search, category, status],
    queryFn: () =>
      api.get('/books', {
        search,
        category,
        status,
        limit: 100
      })
  });

  const books = response?.data || [];

  // Static list of categories for filter bar
  const categories = [
    'Computer Science',
    'Fiction',
    'Mathematics',
    'Science',
    'History',
    'Philosophy'
  ];



  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Banner header */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent border border-indigo-500/10 flex items-center justify-between">
          <div className="max-w-md">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              Nexus Search Catalog
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Browse and filter university titles, check real-time stock levels, and place quick reservations.</p>
          </div>
          <BookOpen className="w-12 h-12 text-indigo-500/35 hidden md:block" />
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, author, ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs placeholder-slate-400 outline-none focus:border-indigo-500 outline-none transition-colors shadow-sm"
            />
          </div>

          {/* Selector filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs text-slate-650 dark:text-zinc-350 outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs text-slate-650 dark:text-zinc-350 outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RENTED">Issued</option>
              <option value="LOST">Lost</option>
              <option value="DAMAGED">Damaged</option>
            </select>

            {/* View Mode controls */}
            <div className="flex items-center border border-slate-200/60 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900 ml-auto md:ml-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-zinc-800 text-indigo-500' : 'text-slate-450 hover:bg-slate-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-slate-100 dark:bg-zinc-800 text-indigo-500' : 'text-slate-450 hover:bg-slate-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Catalog Grid/List Loader */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-72 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : books.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {books.map((book: any, idx: number) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => setSelectedBook(book)}
                  className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden hover-card-trigger cursor-pointer flex flex-col group h-[320px]"
                >
                  {/* Mock Cover Image */}
                  <div className="h-40 bg-gradient-to-tr from-slate-100 to-slate-50 dark:from-zinc-850 dark:to-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350" />
                    ) : (
                      <BookOpen className="w-12 h-12 text-slate-350 dark:text-zinc-700" />
                    )}
                    {/* Floating status tag */}
                    <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      book.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {book.status}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">{book.category}</span>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-150 mt-1 truncate">{book.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{book.authors}</p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/60 pt-3 mt-3 text-[10px] font-semibold text-slate-500">
                      <span>Available: <b className="text-slate-800 dark:text-zinc-200">{book.availableCopies}</b>/{book.numberOfCopies}</span>
                      <span className="text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5">Details <ChevronRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // List View
            <div className="flex flex-col gap-3">
              {books.map((book: any, idx: number) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => setSelectedBook(book)}
                  className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 p-4 rounded-xl cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-850 flex items-center justify-between gap-4 text-xs font-medium"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-14 bg-slate-150 dark:bg-zinc-800 flex items-center justify-center rounded overflow-hidden flex-shrink-0">
                      {book.coverImage ? (
                        <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 dark:text-zinc-200 truncate">{book.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{book.authors} • {book.publisher}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <span className="text-[10px] text-slate-400">{book.category}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      book.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>{book.status}</span>
                    <span className="text-slate-500">Stock: {book.availableCopies}/{book.numberOfCopies}</span>
                    <ChevronRight className="w-4 h-4 text-slate-350" />
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="p-16 text-center border border-dashed border-slate-200 dark:border-zinc-850 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
            <BookOpen className="w-10 h-10 mx-auto text-slate-350 dark:text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">No books found</h3>
            <p className="text-xs text-slate-400 mt-1">Try modifying your search queries or category filters.</p>
          </div>
        )}

        {/* Book Details Modal overlay */}
        <AnimatePresence>
          {selectedBook && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedBook(null)}
                className="fixed inset-0 bg-black"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row max-h-[85vh] overflow-y-auto"
              >
                {/* Book Cover / left half */}
                <div className="w-full md:w-2/5 bg-slate-50 dark:bg-zinc-950 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-150 dark:border-zinc-800/80">
                  <div className="w-40 h-56 bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-slate-100 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
                    {selectedBook.coverImage ? (
                      <img src={selectedBook.coverImage} alt={selectedBook.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-16 h-16 text-slate-300" />
                    )}
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-4 ${
                    selectedBook.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {selectedBook.status}
                  </span>
                </div>

                {/* Details / right half */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{selectedBook.category}</span>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-1.5 leading-snug">{selectedBook.title}</h2>
                    {selectedBook.subtitle && <p className="text-xs text-slate-400 mt-1 italic">{selectedBook.subtitle}</p>}
                    <p className="text-xs font-semibold text-slate-650 dark:text-zinc-300 mt-2">by {selectedBook.authors}</p>
                    
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-4 leading-relaxed line-clamp-4">
                      {selectedBook.description || 'No description available for this book record in the database.'}
                    </p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 border-t border-slate-100 dark:border-zinc-800/80 pt-4 text-[10px] text-slate-500">
                      <div>ISBN: <span className="font-semibold text-slate-700 dark:text-zinc-300">{selectedBook.isbn}</span></div>
                      <div>Publisher: <span className="font-semibold text-slate-700 dark:text-zinc-300">{selectedBook.publisher}</span></div>
                      <div>Edition: <span className="font-semibold text-slate-700 dark:text-zinc-300">{selectedBook.edition || 'N/A'}</span></div>
                      <div>Shelf/Rack: <span className="font-semibold text-slate-700 dark:text-zinc-300">{selectedBook.shelfNumber}/{selectedBook.rackNumber}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                    <div className="text-[10px] font-semibold text-slate-500">
                      <p>Available Copies</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{selectedBook.availableCopies}/{selectedBook.numberOfCopies}</p>
                    </div>
                    {selectedBook.availableCopies <= 0 && (
                      <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                        <AlertTriangle className="w-4 h-4" />
                        Out of stock
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
