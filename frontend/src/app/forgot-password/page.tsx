'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useUIStore } from '../../store/uiStore';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, KeyRound, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Schema for Step 1: Request OTP
const requestSchema = zod.object({
  email: zod.string().email('Please enter a valid email address')
});

type RequestFields = zod.infer<typeof requestSchema>;

// Schema for Step 2: Reset Password
const resetSchema = zod.object({
  otp: zod.string().length(6, 'Verification code must be exactly 6 digits'),
  newPassword: zod.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: zod.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ResetFields = zod.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const addToast = useUIStore((state) => state.addToast);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Forms
  const requestForm = useForm<RequestFields>({
    resolver: zodResolver(requestSchema)
  });

  const resetForm = useForm<ResetFields>({
    resolver: zodResolver(resetSchema)
  });

  const onRequestSubmit = async (data: RequestFields) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      addToast(res.message || 'OTP verification code sent!', 'success');
      
      // Auto-show OTP if the backend returned it as a demo fallback
      if (res.otp) {
        addToast(`💡 Demo Notice: Since email dispatch could not complete, your code is: ${res.otp}`, 'info');
      }

      setStep(2);
    } catch (err: any) {
      addToast(err.message || 'Failed to request OTP code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetFields) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp: data.otp,
        newPassword: data.newPassword
      });
      addToast('Password reset successfully. Please log in.', 'success');
      router.push('/login');
    } catch (err: any) {
      addToast(err.message || 'Invalid or expired OTP code', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 px-4">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-[100px] pointer-events-none" />

      {/* Card Wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10 text-zinc-200"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center mx-auto text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
            N
          </div>
          <h2 className="text-2xl font-bold text-white mt-4 tracking-tight">Reset Password</h2>
          <p className="text-xs text-zinc-400 mt-1.5">
            {step === 1 
              ? 'Enter your email to receive a 6-digit verification code' 
              : `Verification code sent to ${email}`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={requestForm.handleSubmit(onRequestSubmit)}
              className="space-y-5"
            >
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="user@enterprise-lms.com"
                    {...requestForm.register('email')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                {requestForm.formState.errors.email && (
                  <span className="text-[10px] text-rose-500 font-semibold">
                    {requestForm.formState.errors.email.message}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-650/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={resetForm.handleSubmit(onResetSubmit)}
              className="space-y-4"
            >
              {/* OTP Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Verification Code (OTP)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    {...resetForm.register('otp')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-sm tracking-[0.2em] font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                {resetForm.formState.errors.otp && (
                  <span className="text-[10px] text-rose-500 font-semibold">
                    {resetForm.formState.errors.otp.message}
                  </span>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...resetForm.register('newPassword')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                {resetForm.formState.errors.newPassword && (
                  <span className="text-[10px] text-rose-500 font-semibold">
                    {resetForm.formState.errors.newPassword.message}
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...resetForm.register('confirmPassword')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-600 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                {resetForm.formState.errors.confirmPassword && (
                  <span className="text-[10px] text-rose-500 font-semibold">
                    {resetForm.formState.errors.confirmPassword.message}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-650/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800/40 text-zinc-400 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Resend Code / Change Email
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center border-t border-zinc-800/80 pt-6">
          <Link href="/login" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center justify-center gap-1.5 mx-auto w-fit">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
