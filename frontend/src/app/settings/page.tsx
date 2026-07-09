'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useUIStore } from '../../store/uiStore';
import { Loader2, Settings, AlertTriangle, Save, CalendarDays, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

const settingsSchema = zod.object({
  library_name: zod.string().min(1, 'Library Name is required'),
  fine_rate_student: zod.coerce.number().min(0, 'Must be positive'),
  fine_rate_faculty: zod.coerce.number().min(0, 'Must be positive'),
  grace_period_days: zod.coerce.number().min(0, 'Must be positive'),
  borrow_limit_student: zod.coerce.number().min(1, 'At least 1'),
  borrow_limit_faculty: zod.coerce.number().min(1, 'At least 1'),
  borrow_duration_student_days: zod.coerce.number().min(1, 'At least 1'),
  borrow_duration_faculty_days: zod.coerce.number().min(1, 'At least 1')
});

type SettingsFields = zod.infer<typeof settingsSchema>;

export default function SettingsPanelPage() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  // Fetch settings map
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['librarySettings'],
    queryFn: () => api.get('/settings')
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<SettingsFields>({
    resolver: zodResolver(settingsSchema) as any
  });

  // Populate values when loaded
  useEffect(() => {
    if (response?.success && response.data) {
      const data = response.data;
      setValue('library_name', data.library_name || '');
      setValue('fine_rate_student', Number(data.fine_rate_student) || 2.0);
      setValue('fine_rate_faculty', Number(data.fine_rate_faculty) || 5.0);
      setValue('grace_period_days', Number(data.grace_period_days) || 3);
      setValue('borrow_limit_student', Number(data.borrow_limit_student) || 5);
      setValue('borrow_limit_faculty', Number(data.borrow_limit_faculty) || 10);
      setValue('borrow_duration_student_days', Number(data.borrow_duration_student_days) || 14);
      setValue('borrow_duration_faculty_days', Number(data.borrow_duration_faculty_days) || 30);
    }
  }, [response, setValue]);

  // Mutation to update settings
  const settingsMutation = useMutation({
    mutationFn: (data: SettingsFields) => api.put('/settings', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['librarySettings'] });
      addToast('Library settings saved successfully', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to update settings', 'error');
    }
  });

  const onSubmit = (data: any) => {
    settingsMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Global Settings</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Configure business rules, grace limits, borrow terms, and fine values</p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            <p className="text-xs text-slate-400 mt-2">Loading system parameters...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">Failed to fetch parameters</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl text-xs font-semibold">
            
            {/* General Settings */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-805 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-855 dark:text-white">Organization parameters</h3>
                <span className="text-[10px] text-slate-400">Basic configurations for this library deployment</span>
              </div>

              <div className="space-y-1.5 max-w-md">
                <label className="text-slate-500">Library Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nexus Enterprise Library"
                  {...register('library_name')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none focus:border-indigo-500"
                />
                {errors.library_name && <span className="text-[10px] text-rose-500 font-semibold">{errors.library_name.message}</span>}
              </div>
            </div>

            {/* Borrow Rules */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-805 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-855 dark:text-white">Borrowing Limitations</h3>
                <span className="text-[10px] text-slate-400">Friction thresholds and borrow capacities by user categories</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Students */}
                <div className="space-y-4 border-r border-slate-100 pr-6">
                  <span className="text-[10px] uppercase font-bold text-indigo-500">Student rules</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Borrow Book Limit</label>
                      <input type="number" {...register('borrow_limit_student')} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Duration (Days)</label>
                      <input type="number" {...register('borrow_duration_student_days')} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none" />
                    </div>
                  </div>
                </div>

                {/* Faculty */}
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold text-indigo-500">Faculty rules</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Borrow Book Limit</label>
                      <input type="number" {...register('borrow_limit_faculty')} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Duration (Days)</label>
                      <input type="number" {...register('borrow_duration_faculty_days')} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fine Rules */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-805 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-855 dark:text-white">Late Return Fines</h3>
                <span className="text-[10px] text-slate-400">Daily fine rates and grace period limits</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500">Student Fine Rate ($/day)</label>
                  <input type="number" step="0.01" {...register('fine_rate_student')} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500">Faculty Fine Rate ($/day)</label>
                  <input type="number" step="0.01" {...register('fine_rate_faculty')} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500">Grace Period (Days)</label>
                  <input type="number" {...register('grace_period_days')} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-850 border rounded-xl outline-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={settingsMutation.isPending}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
              >
                {settingsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Configurations
              </button>
            </div>

          </form>
        )}

      </div>
    </DashboardLayout>
  );
}
