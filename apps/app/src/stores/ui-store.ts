import { create } from 'zustand';

interface UIState {
  preferencesOpen: boolean;
  showSettings: boolean;

  togglePreferences: () => void;
  setPreferencesOpen: (open: boolean) => void;
  setShowSettings: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  preferencesOpen: false,
  showSettings: false,

  togglePreferences: () => {
    set((state) => ({ preferencesOpen: !state.preferencesOpen }));
  },
  setPreferencesOpen: (open) => {
    set({ preferencesOpen: open });
  },
  setShowSettings: (show) => {
    set({ showSettings: show });
  },
}));
