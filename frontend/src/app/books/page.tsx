'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash,
  Edit2,
  Copy,
  Printer,
  FileDown,
  Upload,
  Search,
  BookOpen,
  X,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useUIStore } from '../../store/uiStore';

const bookSchema = zod.object({
  isbn: zod.string().min(10, 'ISBN must be at least 10 characters'),
  title: zod.string().min(1, 'Title is required'),
  subtitle: zod.string().optional(),
  authors: zod.string().min(1, 'Authors (comma separated) required'),
  publisher: zod.string().min(1, 'Publisher is required'),
  edition: zod.string().optional(),
  publicationYear: zod.coerce.number().min(1800).max(new Date().getFullYear() + 2),
  language: zod.string().default('English'),
  category: zod.string().min(1, 'Category is required'),
  genre: zod.string().min(1, 'Genre is required'),
  shelfNumber: zod.string().min(1, 'Shelf is required'),
  rackNumber: zod.string().min(1, 'Rack is required'),
  callNumber: zod.string().min(1, 'Call number is required'),
  vendor: zod.string().optional(),
  purchasePrice: zod.coerce.number().optional(),
  numberOfCopies: zod.coerce.number().min(1, 'At least 1 copy required'),
  description: zod.string().optional(),
  coverImage: zod.string().optional(),
  keywords: zod.string().optional()
});

type BookFormFields = zod.infer<typeof bookSchema>;

export default function BookInventoryPage() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [activeBarcodeText, setActiveBarcodeText] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');

  // Fetch books
  const { data: response, isLoading } = useQuery({
    queryKey: ['inventoryBooks', search, page],
    queryFn: () =>
      api.get('/books', {
        search,
        page,
        limit: 10
      })
  });

  const books = response?.data || [];
  const pagination = response?.pagination || { totalPages: 1, total: 0 };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<BookFormFields>({
    resolver: zodResolver(bookSchema) as any,
    defaultValues: {
      language: 'English',
      numberOfCopies: 1
    }
  });

  // Mutate create/update
  const bookMutation = useMutation({
    mutationFn: (data: BookFormFields) => {
      if (editingBook) {
        return api.put(`/books/${editingBook.id}`, data);
      }
      return api.post('/books', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryBooks'] });
      addToast(res.message || 'Saved successfully', 'success');
      handleCloseModal();
    },
    onError: (err: any) => {
      addToast(err.message || 'Operation failed', 'error');
    }
  });

  // Mutate delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/books/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryBooks'] });
      addToast(res.message || 'Book deleted successfully', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to delete book', 'error');
    }
  });

  // Mutate duplicate
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/books/${id}/duplicate`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryBooks'] });
      addToast('Book record duplicated successfully', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to duplicate book', 'error');
    }
  });

  // Mutate bulk import
  const bulkImportMutation = useMutation({
    mutationFn: (booksList: any[]) => api.post('/books/bulk-import', { books: booksList }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryBooks'] });
      addToast(res.message || 'Import complete', 'success');
      setIsImportOpen(false);
      setImportJson('');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to import books', 'error');
    }
  });

  const handleOpenNewModal = () => {
    setEditingBook(null);
    reset({
      isbn: '',
      title: '',
      subtitle: '',
      authors: '',
      publisher: '',
      edition: '',
      publicationYear: new Date().getFullYear(),
      language: 'English',
      category: '',
      genre: '',
      shelfNumber: '',
      rackNumber: '',
      callNumber: '',
      vendor: '',
      purchasePrice: undefined,
      numberOfCopies: 1,
      description: '',
      coverImage: '',
      keywords: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: any) => {
    setEditingBook(book);
    setIsModalOpen(true);
    // Populate form fields
    Object.keys(bookSchema.shape).forEach((key) => {
      setValue(key as any, book[key]);
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
  };

  const onSubmit = (data: any) => {
    bookMutation.mutate(data);
  };

  // Client-side CSV export
  const handleExportCSV = () => {
    if (books.length === 0) return;
    const headers = ['ISBN', 'Barcode', 'Title', 'Authors', 'Category', 'Genre', 'Shelf', 'Copies', 'Status'];
    const rows = books.map((b: any) => [
      b.isbn,
      b.barcode,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.authors.replace(/"/g, '""')}"`,
      b.category,
      b.genre,
      b.shelfNumber,
      b.numberOfCopies,
      b.status
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `books_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImportSubmit = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Import data must be a JSON array of book objects');
      }
      bulkImportMutation.mutate(parsed);
    } catch (err: any) {
      addToast(err.message || 'Invalid JSON syntax', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Book Inventory</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Add, duplicate, edit book catalogs, export lists, and generate labels</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-3.5 py-2 border border-slate-200/60 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-350 font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Import JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 border border-slate-200/60 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-350 font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handleOpenNewModal}
              className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-650/10 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Book
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter catalog records..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors shadow-sm"
          />
        </div>

        {/* Main Data Table */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs text-slate-400 mt-2">Fetching inventory ledger...</p>
            </div>
          ) : books.length > 0 ? (
            <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-zinc-300">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-850/50 border-b border-slate-200/50 dark:border-zinc-800/80 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <th className="px-6 py-4">Title & Details</th>
                  <th className="px-6 py-4">ISBN</th>
                  <th className="px-6 py-4">Barcode</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Shelf-Rack</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {books.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 bg-slate-100 dark:bg-zinc-850 rounded flex items-center justify-center flex-shrink-0">
                          {b.coverImage ? (
                            <img src={b.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[180px]">{b.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">{b.authors}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold font-mono text-[10px]">{b.isbn}</td>
                    <td className="px-6 py-4 font-semibold font-mono text-[10px]">{b.barcode}</td>
                    <td className="px-6 py-4 font-semibold text-[10px]">{b.category}</td>
                    <td className="px-6 py-4 font-semibold text-[10px]">{b.shelfNumber}-{b.rackNumber}</td>
                    <td className="px-6 py-4 font-semibold">
                      {b.availableCopies} / {b.numberOfCopies}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        b.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveBarcodeText(b.barcode)}
                          title="Print Barcode Label"
                          className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => duplicateMutation.mutate(b.id)}
                          title="Duplicate Book"
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          title="Edit Details"
                          className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this book record?')) {
                              deleteMutation.mutate(b.id);
                            }
                          }}
                          title="Delete Book"
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Empty Book Stock</h3>
              <p className="text-xs text-slate-400 mt-1">No books match the current search filters.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-450 font-semibold">Showing page {page} of {pagination.totalPages}</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="p-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal popup */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
                className="fixed inset-0 bg-black"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 relative z-10 max-h-[90vh] overflow-y-auto"
              >
                <button onClick={handleCloseModal} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6">
                  {editingBook ? 'Edit Book Details' : 'Register New Book Title'}
                </h3>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Title */}
                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                      <label className="text-slate-500">Book Title</label>
                      <input
                        type="text"
                        placeholder="Effective Java"
                        {...register('title')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                      {errors.title && <span className="text-[10px] text-rose-500 font-semibold">{errors.title.message}</span>}
                    </div>

                    {/* Subtitle */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Subtitle (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Best Practices"
                        {...register('subtitle')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    {/* Authors */}
                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                      <label className="text-slate-500">Authors (Comma Separated)</label>
                      <input
                        type="text"
                        placeholder="Joshua Bloch, Martin Fowler"
                        {...register('authors')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                      {errors.authors && <span className="text-[10px] text-rose-500 font-semibold">{errors.authors.message}</span>}
                    </div>

                    {/* ISBN */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">ISBN Code</label>
                      <input
                        type="text"
                        placeholder="978-0134685991"
                        {...register('isbn')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                      {errors.isbn && <span className="text-[10px] text-rose-500 font-semibold">{errors.isbn.message}</span>}
                    </div>

                    {/* Publisher */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Publisher</label>
                      <input
                        type="text"
                        placeholder="Addison-Wesley"
                        {...register('publisher')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                      {errors.publisher && <span className="text-[10px] text-rose-500 font-semibold">{errors.publisher.message}</span>}
                    </div>

                    {/* Edition */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Edition</label>
                      <input
                        type="text"
                        placeholder="3rd Edition"
                        {...register('edition')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    {/* Publication Year */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Publication Year</label>
                      <input
                        type="number"
                        placeholder="2018"
                        {...register('publicationYear')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                      {errors.publicationYear && <span className="text-[10px] text-rose-500 font-semibold">{errors.publicationYear.message}</span>}
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Category</label>
                      <input
                        type="text"
                        placeholder="Computer Science"
                        {...register('category')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-indigo-500 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                      {errors.category && <span className="text-[10px] text-rose-500 font-semibold">{errors.category.message}</span>}
                    </div>

                    {/* Genre */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Genre</label>
                      <input
                        type="text"
                        placeholder="Software Engineering"
                        {...register('genre')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                      {errors.genre && <span className="text-[10px] text-rose-500 font-semibold">{errors.genre.message}</span>}
                    </div>

                    {/* Shelf Location */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Shelf - Rack - Call Number</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" placeholder="S-12" {...register('shelfNumber')} className="w-full px-2.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500" />
                        <input type="text" placeholder="R-03" {...register('rackNumber')} className="w-full px-2.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500" />
                        <input type="text" placeholder="QA76.73" {...register('callNumber')} className="w-full px-2.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500" />
                      </div>
                    </div>

                    {/* Copies & Price */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Number of Copies</label>
                      <input
                        type="number"
                        placeholder="1"
                        {...register('numberOfCopies')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Purchase Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="45.99"
                        {...register('purchasePrice')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Cover Image URL</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        {...register('coverImage')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500">Short Description</label>
                    <textarea
                      rows={3}
                      placeholder="Add summary info..."
                      {...register('description')}
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-zinc-800/85">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookMutation.isPending}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      {bookMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Book
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Barcode Print Dialog overlay */}
        <AnimatePresence>
          {activeBarcodeText && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveBarcodeText(null)}
                className="fixed inset-0 bg-black"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 relative z-10 text-center"
              >
                <button
                  onClick={() => setActiveBarcodeText(null)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-6">Print Barcode Label</h4>

                {/* Printable Section */}
                <div className="p-4 border rounded-xl bg-white flex flex-col items-center justify-center print-section shadow-sm mb-6">
                  <img
                    src={`http://localhost:5000/api/books/barcode/${activeBarcodeText}`}
                    alt="Barcode"
                    className="max-w-full h-auto"
                  />
                </div>

                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={() => setActiveBarcodeText(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Printer className="w-4.5 h-4.5" />
                    Print Label
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* JSON Import Dialog overlay */}
        <AnimatePresence>
          {isImportOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsImportOpen(false)}
                className="fixed inset-0 bg-black"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 relative z-10 flex flex-col gap-4"
              >
                <button
                  onClick={() => setIsImportOpen(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Import Books List</h3>
                  <p className="text-[10px] text-slate-450 mt-1">Paste a JSON array containing book objects matching the DB schema structure.</p>
                </div>

                <textarea
                  rows={8}
                  placeholder={`[\n  {\n    "isbn": "978-0134685991",\n    "title": "Effective Java",\n    "authors": "Joshua Bloch",\n    "publisher": "Addison-Wesley",\n    "category": "Computer Science",\n    "genre": "Programming"\n  }\n]`}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  className="w-full p-3 font-mono text-[10px] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl outline-none focus:border-indigo-505 resize-none leading-relaxed"
                />

                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => {
                      setIsImportOpen(false);
                      setImportJson('');
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={bulkImportMutation.isPending}
                    onClick={handleBulkImportSubmit}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {bulkImportMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Confirm Import
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
