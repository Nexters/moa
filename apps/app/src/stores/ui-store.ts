import { create } from 'zustand';

interface UIState {
  preferencesOpen: boolean;

  togglePreferences: () => void;
  setPreferencesOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  preferencesOpen: false,

  togglePreferences: () => {
    set((state) => ({ preferencesOpen: !state.preferencesOpen }));
  },
  setPreferencesOpen: (open) => {
    set({ preferencesOpen: open });
  },
}));
