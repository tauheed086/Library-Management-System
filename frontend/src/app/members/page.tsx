'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  AlertTriangle,
  Users,
  Search,
  X,
  Loader2,
  Printer,
  Ban,
  UserCheck,
  CalendarRange,
  Bookmark,
  DollarSign,
  History
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useUIStore } from '../../store/uiStore';

const memberSchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters'),
  email: zod.string().email('Please enter a valid email address'),
  role: zod.enum(['STUDENT', 'FACULTY', 'STAFF']),
  phone: zod.string().optional(),
  address: zod.string().optional(),
  photoUrl: zod.string().optional(),
  department: zod.string().min(2, 'Department is required'),
  course: zod.string().optional(),
  semester: zod.string().optional()
});

type MemberFields = zod.infer<typeof memberSchema>;

export default function MembersDirectoryPage() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [printCardMember, setPrintCardMember] = useState<any | null>(null);

  // Fetch full details of member for print card (includes active transactions)
  const { data: memberDetailsResponse, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['memberDetails', printCardMember?.id],
    queryFn: () => api.get(`/members/${printCardMember.id}`),
    enabled: !!printCardMember?.id
  });

  const memberDetails = memberDetailsResponse?.data;
  const borrowedBooks = memberDetails?.transactions?.filter((t: any) => t.status === 'ISSUED' || t.status === 'RENEWED') || [];

  // Fetch members
  const { data: response, isLoading } = useQuery({
    queryKey: ['directoryMembers', search, roleFilter, statusFilter],
    queryFn: () =>
      api.get('/members', {
        search,
        role: roleFilter,
        status: statusFilter
      })
  });

  const members = response?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<MemberFields>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      role: 'STUDENT'
    }
  });

  const selectedRole = watch('role');

  const memberMutation = useMutation({
    mutationFn: (data: MemberFields) => {
      if (editingMember) {
        return api.put(`/members/${editingMember.id}`, data);
      }
      return api.post('/members', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['directoryMembers'] });
      addToast(res.message || 'Saved successfully', 'success');
      handleCloseModal();
    },
    onError: (err: any) => {
      addToast(err.message || 'Operation failed', 'error');
    }
  });

  // Suspend/Unsuspend mutation
  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/members/${id}/suspend`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['directoryMembers'] });
      addToast(res.message || 'Status updated', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Suspension toggle failed', 'error');
    }
  });

  // Renew membership mutation
  const renewMutation = useMutation({
    mutationFn: (id: string) => api.post(`/members/${id}/renew`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['directoryMembers'] });
      addToast('Membership extended successfully for 1 year', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Renewal operation failed', 'error');
    }
  });

  const handleOpenNewModal = () => {
    setEditingMember(null);
    reset({
      name: '',
      email: '',
      role: 'STUDENT',
      phone: '',
      address: '',
      photoUrl: '',
      department: '',
      course: '',
      semester: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: any) => {
    setEditingMember(member);
    setIsModalOpen(true);
    Object.keys(memberSchema.shape).forEach((key) => {
      setValue(key as any, member[key]);
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const onSubmit = (data: MemberFields) => {
    memberMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Members Directory</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Manage library memberships, track borrows and fines, and print cards</p>
          </div>
          
          <button
            onClick={handleOpenNewModal}
            className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-650/10 active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {/* Filters and search bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs text-slate-650 dark:text-zinc-350 outline-none focus:border-indigo-500 shadow-sm"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="STAFF">Staff</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs text-slate-650 dark:text-zinc-350 outline-none focus:border-indigo-500 shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* Directory Ledger Table */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs text-slate-400 mt-2">Loading membership directory...</p>
            </div>
          ) : members.length > 0 ? (
            <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-zinc-300">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-850/50 border-b border-slate-200/50 dark:border-zinc-800/80 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <th className="px-6 py-4">Member Name</th>
                  <th className="px-6 py-4">Department & College</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Active Borrows</th>
                  <th className="px-6 py-4">Fine Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {members.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-4 h-4 text-indigo-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[150px]">{m.name}</p>
                          <p className="text-[9px] text-slate-450 mt-0.5 lowercase">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 dark:text-zinc-250">{m.department}</p>
                      {m.course && <p className="text-[9px] text-slate-400 mt-0.5">{m.course} • {m.semester}</p>}
                    </td>
                    <td className="px-6 py-4 font-semibold font-mono text-[10px]">
                      {new Date(m.membershipExpiry).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {m.currentBorrowedBooks} / {m.borrowLimit}
                    </td>
                    <td className="px-6 py-4 font-semibold text-rose-500">
                      {m.fineBalance > 0 ? `$${m.fineBalance.toFixed(2)}` : '$0.00'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        m.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPrintCardMember(m)}
                          title="Print Membership Card"
                          className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => renewMutation.mutate(m.id)}
                          title="Renew Membership 1 Year"
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer"
                        >
                          <CalendarRange className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => suspendMutation.mutate(m.id)}
                          title={m.status === 'ACTIVE' ? 'Suspend Member' : 'Activate Member'}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer"
                        >
                          {m.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          title="Edit Details"
                          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center">
              <Users className="w-10 h-10 mx-auto text-slate-350 dark:text-zinc-700 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">No Members Found</h3>
              <p className="text-xs text-slate-400 mt-1">Try modifying your search query or role selections.</p>
            </div>
          )}
        </div>

        {/* Member Form Modal */}
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
                className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 relative z-10"
              >
                <button onClick={handleCloseModal} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-655 transition-colors">
                  <X className="w-4 h-4" />
                </button>

                <h3 className="text-sm font-bold text-slate-855 dark:text-white mb-6">
                  {editingMember ? 'Edit Member File' : 'Register New Member'}
                </h3>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Full Name</label>
                      <input
                        type="text"
                        placeholder="Alice Smith"
                        {...register('name')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-805 rounded-xl outline-none focus:border-indigo-500"
                      />
                      {errors.name && <span className="text-[10px] text-rose-500 font-semibold">{errors.name.message}</span>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Email Address</label>
                      <input
                        type="email"
                        placeholder="alice@gmail.com"
                        {...register('email')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-805 rounded-xl outline-none focus:border-indigo-500"
                      />
                      {errors.email && <span className="text-[10px] text-rose-500 font-semibold">{errors.email.message}</span>}
                    </div>

                    {/* Role Select */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Membership Role</label>
                      <select
                        {...register('role')}
                        className="w-full px-3 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-805 rounded-xl outline-none focus:border-indigo-500"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="FACULTY">Faculty</option>
                        <option value="STAFF">Staff</option>
                      </select>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Phone</label>
                      <input
                        type="text"
                        placeholder="+1 555-0100"
                        {...register('phone')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-805 rounded-xl outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Department */}
                    <div className="space-y-1.5 col-span-1 sm:col-span-2">
                      <label className="text-slate-500">Department</label>
                      <input
                        type="text"
                        placeholder="Computer Science"
                        {...register('department')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-805 rounded-xl outline-none focus:border-indigo-500"
                      />
                      {errors.department && <span className="text-[10px] text-rose-500 font-semibold">{errors.department.message}</span>}
                    </div>

                    {selectedRole === 'STUDENT' && (
                      <>
                        {/* Course */}
                        <div className="space-y-1.5">
                          <label className="text-slate-500">Course</label>
                          <input
                            type="text"
                            placeholder="B.Tech CSE"
                            {...register('course')}
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-805 rounded-xl outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Semester */}
                        <div className="space-y-1.5">
                          <label className="text-slate-500">Semester</label>
                          <input
                            type="text"
                            placeholder="6th Semester"
                            {...register('semester')}
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-805 rounded-xl outline-none focus:border-indigo-500"
                          />
                        </div>
                      </>
                    )}

                    {/* PhotoUrl */}
                    <div className="space-y-1.5 col-span-1 sm:col-span-2">
                      <label className="text-slate-500">Photo URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        {...register('photoUrl')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-805 rounded-xl outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5 col-span-1 sm:col-span-2">
                      <label className="text-slate-500">Address (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Residential Address details..."
                        {...register('address')}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-zinc-850/50 border border-slate-200 dark:border-zinc-805 rounded-xl outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-zinc-805/85">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={memberMutation.isPending}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                    >
                      {memberMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Member
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Membership Card Print Dialog */}
        <AnimatePresence>
          {printCardMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setPrintCardMember(null)}
                className="fixed inset-0 bg-black"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 relative z-10 flex flex-col items-center"
              >
                <button
                  onClick={() => setPrintCardMember(null)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-6">Print Library Membership Card</h4>

                {/* Printable Card Area */}
                <div className="w-[340px] h-[200px] border border-slate-200 rounded-2xl bg-white p-4 flex flex-col justify-between print-section shadow-md text-slate-800 mb-6 font-sans relative overflow-hidden">
                  {/* Decorative badge background */}
                  <div className="absolute right-0 bottom-0 w-24 h-24 rounded-tl-full bg-indigo-50/60 pointer-events-none" />
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-[13px] tracking-tight">Nexus Library System</h4>
                      <p className="text-[9px] text-slate-400">Membership Identity Card</p>
                    </div>
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                      {printCardMember.role}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="flex gap-4 items-center flex-1 my-2">
                    <div className="w-14 h-14 bg-slate-100 border rounded-xl overflow-hidden flex items-center justify-center">
                      {printCardMember.photoUrl ? (
                        <img src={printCardMember.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-slate-350" />
                      )}
                    </div>
                    
                    <div className="text-[10px] leading-tight flex-1">
                      <p className="font-bold text-[12px]">{printCardMember.name}</p>
                      <p className="text-slate-500 mt-1">ID: <span className="font-semibold font-mono text-[9px]">{printCardMember.id.substr(0, 18)}</span></p>
                      <p className="text-slate-500">Dept: <span className="font-semibold">{printCardMember.department}</span></p>
                      {printCardMember.course && <p className="text-slate-500">Course: <span className="font-semibold">{printCardMember.course}</span></p>}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex justify-between items-end border-t border-slate-100 pt-2 text-[8px] text-slate-400">
                    <div>
                      <span>Expires: <b className="text-slate-655 font-mono">{new Date(printCardMember.membershipExpiry).toLocaleDateString()}</b></span>
                    </div>
                    
                    {/* Simulated QR Code for membership check-in scanner */}
                    <div className="w-8 h-8 border bg-slate-50 flex items-center justify-center p-0.5">
                      <img src={`http://localhost:5000/api/books/qrcode/${printCardMember.id}`} alt="QR" className="w-full h-full object-contain" />
                    </div>
                  </div>
                </div>

                {/* Active Borrowed Books Section (Hidden on printout) */}
                <div className="w-full mt-2 border-t border-slate-100 dark:border-zinc-800 pt-4 no-print">
                  <h5 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 mb-3">
                    <History className="w-3.5 h-3.5 text-indigo-500" />
                    Active Borrowed Books ({borrowedBooks.length})
                  </h5>
                  
                  {isLoadingDetails ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    </div>
                  ) : borrowedBooks.length > 0 ? (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {borrowedBooks.map((tx: any) => {
                        const isOverdue = new Date(tx.dueDate) < new Date();
                        return (
                          <div key={tx.id} className="p-3 bg-slate-50 dark:bg-zinc-850/50 rounded-2xl border border-slate-200/40 dark:border-zinc-800/40 flex items-center justify-between text-[10px]">
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="font-bold text-slate-700 dark:text-zinc-250 truncate">{tx.book.title}</p>
                              <p className="text-[8px] text-slate-400 mt-0.5 font-mono">ISBN: {tx.book.isbn}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-slate-450 dark:text-zinc-500">Due: <span className={`font-bold font-mono ${isOverdue ? 'text-rose-500 font-extrabold' : 'text-indigo-500 dark:text-indigo-400'}`}>{new Date(tx.dueDate).toLocaleDateString()}</span></p>
                              <p className="text-[8px] text-slate-400 mt-0.5">Renewals: <span className="font-bold">{tx.renewalCount}</span></p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center bg-slate-50 dark:bg-zinc-850/30 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                      <p className="text-[10px] text-slate-400 font-semibold">No active checkouts</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 justify-center w-full mt-6">
                  <button
                    onClick={() => setPrintCardMember(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-zinc-805 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-655 dark:text-zinc-400 font-semibold rounded-xl text-xs cursor-pointer flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] flex-1"
                  >
                    <Printer className="w-4.5 h-4.5" />
                    Print Card
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
