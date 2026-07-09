'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function RootEntryPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
    } else {
      if (['SUPER_ADMIN', 'LIBRARIAN', 'ASSISTANT_LIBRARIAN'].includes(user.role)) {
        router.push('/dashboard');
      } else {
        router.push('/catalog');
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
