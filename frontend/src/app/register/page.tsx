'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useUIStore } from '../../store/uiStore';
import { api } from '../../lib/api';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Phone, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const registerSchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters'),
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  role: zod.enum(['STUDENT', 'FACULTY']),
  department: zod.string().min(2, 'Department is required'),
  course: zod.string().optional(),
  semester: zod.string().optional(),
  phone: zod.string().optional()
});

type RegisterFields = zod.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const addToast = useUIStore((state) => state.addToast);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'STUDENT'
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFields) => {
    setLoading(true);
    try {
      await api.post('/auth/register', data);
      addToast('Account created successfully! Please sign in.', 'success');
      router.push('/login');
    } catch (err: any) {
      addToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 px-4 py-12">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center mx-auto text-white font-bold text-lg shadow-lg">
            N
          </div>
          <h2 className="text-2xl font-bold text-white mt-4 tracking-tight">Create Member Account</h2>
          <p className="text-xs text-zinc-400 mt-1.5">Register as a Student or Faculty member to access the LMS</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Alice Smith"
                  {...register('name')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-xs focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              {errors.name && <span className="text-[10px] text-rose-500 font-semibold">{errors.name.message}</span>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="alice@gmail.com"
                  {...register('email')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-xs focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              {errors.email && <span className="text-[10px] text-rose-500 font-semibold">{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-xs focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              {errors.password && <span className="text-[10px] text-rose-500 font-semibold">{errors.password.message}</span>}
            </div>

            {/* Role Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">I am a</label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 text-xs focus:border-indigo-500 outline-none transition-all"
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty Member</option>
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-300">Department</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Computer Science / Business Admin"
                  {...register('department')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-xs focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              {errors.department && <span className="text-[10px] text-rose-500 font-semibold">{errors.department.message}</span>}
            </div>

            {selectedRole === 'STUDENT' && (
              <>
                {/* Course */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Course</label>
                  <input
                    type="text"
                    placeholder="B.Tech CSE"
                    {...register('course')}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-xs focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Semester */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Semester</label>
                  <input
                    type="text"
                    placeholder="6th Semester"
                    {...register('semester')}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-xs focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </>
            )}

            {/* Phone */}
            <div className={`space-y-1.5 ${selectedRole !== 'STUDENT' ? 'col-span-1 sm:col-span-2' : ''}`}>
              <label className="text-xs font-semibold text-zinc-300">Phone (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="+1 555-0199"
                  {...register('phone')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-xs focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-650/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-zinc-800/80 pt-4">
          <p className="text-xs text-zinc-400">
            Already have an ID?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
