import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const isClient = typeof window !== 'undefined';
  const initialTheme = isClient ? (localStorage.getItem('lms_theme') as Theme) || 'system' : 'system';

  const applyTheme = (theme: Theme) => {
    if (!isClient) return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  return {
    theme: initialTheme,
    setTheme: (theme) => {
      if (isClient) {
        localStorage.setItem('lms_theme', theme);
      }
      applyTheme(theme);
      set({ theme });
    },
    initializeTheme: () => {
      applyTheme(initialTheme);
    }
  };
});
