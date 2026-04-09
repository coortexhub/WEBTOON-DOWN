import { create } from 'zustand';
import { Series, Chapter } from '../types';
import { storageService } from '../services/storage';

interface LibraryState {
  series: Series[];
  chapters: Chapter[];
  favorites: string[];
  loading: boolean;
  initialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  addSeries: (series: Series) => Promise<void>;
  removeSeries: (seriesId: string) => Promise<void>;
  addChapters: (chapters: Chapter[]) => Promise<void>;
  updateChapter: (chapter: Chapter) => Promise<void>;
  removeChapter: (chapterId: string) => Promise<void>;
  getSeriesById: (seriesId: string) => Series | undefined;
  getChaptersBySeriesId: (seriesId: string) => Chapter[];
  toggleFavorite: (seriesId: string) => Promise<void>;
  isFavorite: (seriesId: string) => boolean;
  getFavoriteSeries: () => Series[];
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  series: [],
  chapters: [],
  favorites: [],
  loading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    
    set({ loading: true });
    try {
      const [series, chapters, favorites] = await Promise.all([
        storageService.getSeries(),
        storageService.getChapters(),
        storageService.getFavorites(),
      ]);
      set({ series, chapters, favorites, initialized: true });
    } catch (error) {
      console.error('Failed to initialize library:', error);
    } finally {
      set({ loading: false });
    }
  },

  addSeries: async (series: Series) => {
    await storageService.addSeries(series);
    const allSeries = await storageService.getSeries();
    set({ series: allSeries });
  },

  removeSeries: async (seriesId: string) => {
    await storageService.removeSeries(seriesId);
    const allSeries = await storageService.getSeries();
    const allChapters = await storageService.getChapters();
    set({ series: allSeries, chapters: allChapters });
  },

  addChapters: async (chapters: Chapter[]) => {
    await storageService.addChapters(chapters);
    const allChapters = await storageService.getChapters();
    set({ chapters: allChapters });
  },

  updateChapter: async (chapter: Chapter) => {
    await storageService.updateChapter(chapter);
    const allChapters = await storageService.getChapters();
    set({ chapters: allChapters });
  },

  removeChapter: async (chapterId: string) => {
    await storageService.removeChapter(chapterId);
    const allChapters = await storageService.getChapters();
    set({ chapters: allChapters });
  },

  getSeriesById: (seriesId: string) => {
    return get().series.find(s => s.series_id === seriesId);
  },

  getChaptersBySeriesId: (seriesId: string) => {
    return get().chapters.filter(c => c.series_id === seriesId);
  },

  toggleFavorite: async (seriesId: string) => {
    const { favorites } = get();
    if (favorites.includes(seriesId)) {
      await storageService.removeFavorite(seriesId);
    } else {
      await storageService.addFavorite(seriesId);
    }
    const updatedFavorites = await storageService.getFavorites();
    set({ favorites: updatedFavorites });
  },

  isFavorite: (seriesId: string) => {
    return get().favorites.includes(seriesId);
  },

  getFavoriteSeries: () => {
    const { series, favorites } = get();
    return series.filter(s => favorites.includes(s.series_id));
  },
}));
