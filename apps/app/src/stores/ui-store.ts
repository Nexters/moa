import { create } from 'zustand';

interface UIState {
  preferencesOpen: boolean;
  showSettings: boolean;
  onResetApp: (() => void) | null;

  togglePreferences: () => void;
  setPreferencesOpen: (open: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setOnResetApp: (callback: (() => void) | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  preferencesOpen: false,
  showSettings: false,
  onResetApp: null,

  togglePreferences: () => {
    set((state) => ({ preferencesOpen: !state.preferencesOpen }));
  },
  setPreferencesOpen: (open) => {
    set({ preferencesOpen: open });
  },
  setShowSettings: (show) => {
    set({ showSettings: show });
  },
  setOnResetApp: (callback) => {
    set({ onResetApp: callback });
  },
}));
