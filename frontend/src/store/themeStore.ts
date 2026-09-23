import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('kirston_theme') as ThemeMode;
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return 'dark';
};

const applyThemeToDOM = (theme: ThemeMode) => {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }
  localStorage.setItem('kirston_theme', theme);
};

export const useThemeStore = create<ThemeState>((set) => {
  const initialTheme = getInitialTheme();
  applyThemeToDOM(initialTheme);

  return {
    theme: initialTheme,
    setTheme: (theme) => {
      applyThemeToDOM(theme);
      set({ theme });
    },
    toggleTheme: () => {
      set((state) => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        applyThemeToDOM(nextTheme);
        return { theme: nextTheme };
      });
    },
  };
});
