import { create } from 'zustand';

export const usePlayerStore = create((set) => ({
  isOpen: false,
  config: null,
  isFullscreen: false,
  openPlayer: (config) => set({ isOpen: true, config }),
  closePlayer: () => set({ isOpen: false, config: null }),
  setFullscreen: (v) => set({ isFullscreen: v }),
}));
