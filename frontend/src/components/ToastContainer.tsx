'use client';

import { useUIStore } from '../store/uiStore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-indigo-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />
  };

  const borders = {
    success: 'border-emerald-500/20 dark:border-emerald-500/10',
    error: 'border-rose-500/20 dark:border-rose-500/10',
    info: 'border-indigo-500/20 dark:border-indigo-500/10',
    warning: 'border-amber-500/20 dark:border-amber-500/10'
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none no-print">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`flex items-start gap-3 p-4 rounded-xl border glass shadow-lg pointer-events-auto overflow-hidden relative ${borders[toast.type]}`}
          >
            <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Animated duration progress bar */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-0.5 ${
                toast.type === 'success' ? 'bg-emerald-500' :
                toast.type === 'error' ? 'bg-rose-500' :
                toast.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
