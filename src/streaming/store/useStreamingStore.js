import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';

// Capacitor-compatible storage adapter for Zustand persist
const capacitorStorage = {
  getItem: async (name) => {
    const { value } = await Preferences.get({ key: name });
    return value ?? null;
  },
  setItem: async (name, value) => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name) => {
    await Preferences.remove({ key: name });
  },
};

export const useStreamingStore = create(
  persist(
    (set, get) => ({
      watchlist: [],
      history: [],
      activeTab: 'movies',

      addToWatchlist: (item) =>
        set(s => ({ watchlist: [item, ...s.watchlist.filter(w => w.id !== item.id)] })),

      removeFromWatchlist: (id) =>
        set(s => ({ watchlist: s.watchlist.filter(w => w.id !== id) })),

      isInWatchlist: (id) => get().watchlist.some(w => w.id === id),

      addToHistory: (item) =>
        set(s => ({
          history: [item, ...s.history.filter(h => !(h.id === item.id && h.season === item.season && h.episode === item.episode))].slice(0, 100)
        })),

      clearHistory: () => set({ history: [] }),

      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'streaming-store',
      storage: capacitorStorage,
    }
  )
);
