import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string; // 'SUPER_ADMIN' | 'LIBRARIAN' | 'ASSISTANT_LIBRARIAN' | 'STUDENT' | 'FACULTY' | 'STAFF'
  photoUrl?: string;
  borrowLimit: number;
  status: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe execution in SSR environments
  const isClient = typeof window !== 'undefined';
  const initialToken = isClient ? localStorage.getItem('lms_token') : null;
  const initialUser = isClient ? JSON.parse(localStorage.getItem('lms_user') || 'null') : null;

  return {
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    
    login: (token, user) => {
      if (isClient) {
        localStorage.setItem('lms_token', token);
        localStorage.setItem('lms_user', JSON.stringify(user));
      }
      set({ token, user, isAuthenticated: true });
    },
    
    logout: () => {
      if (isClient) {
        localStorage.removeItem('lms_token');
        localStorage.removeItem('lms_user');
      }
      set({ token: null, user: null, isAuthenticated: false });
    },

    updateUser: (updates) => {
      set((state) => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, ...updates };
        if (isClient) {
          localStorage.setItem('lms_user', JSON.stringify(updatedUser));
        }
        return { user: updatedUser };
      });
    }
  };
});
