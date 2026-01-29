import { create } from 'zustand';

export type AppRoute = 'loading' | 'onboarding' | 'home' | 'settings';

interface UIState {
  preferencesOpen: boolean;
  currentRoute: AppRoute;

  togglePreferences: () => void;
  setPreferencesOpen: (open: boolean) => void;
  navigate: (route: AppRoute) => void;
  resetToHome: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  preferencesOpen: false,
  currentRoute: 'loading',

  togglePreferences: () => {
    set((state) => ({ preferencesOpen: !state.preferencesOpen }));
  },
  setPreferencesOpen: (open) => {
    set({ preferencesOpen: open });
  },
  navigate: (route) => {
    set({ currentRoute: route });
  },
  resetToHome: () => {
    const { currentRoute } = get();

    if (currentRoute !== 'onboarding') {
      set({ currentRoute: 'home' });
    }
  },
}));
