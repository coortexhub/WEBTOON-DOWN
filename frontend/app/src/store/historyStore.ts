import { create } from 'zustand';
import { ReadingHistory } from '../types';
import { storageService } from '../services/storage';

interface HistoryState {
  history: ReadingHistory[];
  
  // Actions
  initialize: () => Promise<void>;
  addHistory: (history: ReadingHistory) => Promise<void>;
  clearHistory: () => Promise<void>;
  getHistoryByChapterId: (chapterId: string) => ReadingHistory | undefined;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],

  initialize: async () => {
    const history = await storageService.getHistory();
    set({ history });
  },

  addHistory: async (historyItem: ReadingHistory) => {
    await storageService.addHistory(historyItem);
    const history = await storageService.getHistory();
    set({ history });
  },

  clearHistory: async () => {
    await storageService.clearHistory();
    set({ history: [] });
  },

  getHistoryByChapterId: (chapterId: string) => {
    return get().history.find(h => h.chapter_id === chapterId);
  },
}));
