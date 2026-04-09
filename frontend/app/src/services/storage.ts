import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Series, Chapter, ReadingHistory, Bookmark } from '../types';

const KEYS = {
  SERIES: 'webtoon_series',
  CHAPTERS: 'webtoon_chapters',
  FAVORITES: 'webtoon_favorites',
  HISTORY: 'webtoon_history',
  BOOKMARKS: 'webtoon_bookmarks',
};

export const getDocumentDirectory = () => {
  return FileSystem.documentDirectory!;
};

export const getSeriesDirectory = (seriesId: string) => {
  return `${getDocumentDirectory()}webtoons/${seriesId}/`;
};

export const getChapterDirectory = (seriesId: string, chapterId: string) => {
  return `${getSeriesDirectory(seriesId)}${chapterId}/`;
};

export const storageService = {
  // Series
  async getSeries(): Promise<Series[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SERIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting series:', error);
      return [];
    }
  },

  async addSeries(series: Series): Promise<void> {
    try {
      const existing = await this.getSeries();
      const filtered = existing.filter(s => s.series_id !== series.series_id);
      await AsyncStorage.setItem(KEYS.SERIES, JSON.stringify([...filtered, series]));
    } catch (error) {
      console.error('Error adding series:', error);
    }
  },

  async removeSeries(seriesId: string): Promise<void> {
    try {
      const existing = await this.getSeries();
      const filtered = existing.filter(s => s.series_id !== seriesId);
      await AsyncStorage.setItem(KEYS.SERIES, JSON.stringify(filtered));
      
      // Delete series directory
      const seriesDir = getSeriesDirectory(seriesId);
      const dirInfo = await FileSystem.getInfoAsync(seriesDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(seriesDir, { idempotent: true });
      }
    } catch (error) {
      console.error('Error removing series:', error);
    }
  },

  // Chapters
  async getChapters(): Promise<Chapter[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHAPTERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting chapters:', error);
      return [];
    }
  },

  async addChapters(chapters: Chapter[]): Promise<void> {
    try {
      const existing = await this.getChapters();
      const existingIds = new Set(existing.map(c => c.chapter_id));
      const newChapters = chapters.filter(c => !existingIds.has(c.chapter_id));
      await AsyncStorage.setItem(KEYS.CHAPTERS, JSON.stringify([...existing, ...newChapters]));
    } catch (error) {
      console.error('Error adding chapters:', error);
    }
  },

  async updateChapter(chapter: Chapter): Promise<void> {
    try {
      const existing = await this.getChapters();
      const filtered = existing.filter(c => c.chapter_id !== chapter.chapter_id);
      await AsyncStorage.setItem(KEYS.CHAPTERS, JSON.stringify([...filtered, chapter]));
    } catch (error) {
      console.error('Error updating chapter:', error);
    }
  },

  async getChaptersBySeriesId(seriesId: string): Promise<Chapter[]> {
    const chapters = await this.getChapters();
    return chapters.filter(c => c.series_id === seriesId);
  },

  async removeChapter(chapterId: string): Promise<void> {
    try {
      const existing = await this.getChapters();
      const chapter = existing.find(c => c.chapter_id === chapterId);
      const filtered = existing.filter(c => c.chapter_id !== chapterId);
      await AsyncStorage.setItem(KEYS.CHAPTERS, JSON.stringify(filtered));
      
      // Delete chapter directory
      if (chapter?.download_path) {
        const dirInfo = await FileSystem.getInfoAsync(chapter.download_path);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(chapter.download_path, { idempotent: true });
        }
      }
    } catch (error) {
      console.error('Error removing chapter:', error);
    }
  },

  // Favorites
  async getFavorites(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  },

  async addFavorite(seriesId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(seriesId)) {
        await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify([...favorites, seriesId]));
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  },

  async removeFavorite(seriesId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const filtered = favorites.filter(id => id !== seriesId);
      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  },

  async isFavorite(seriesId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.includes(seriesId);
  },

  // Reading History
  async getHistory(): Promise<ReadingHistory[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  },

  async addHistory(history: ReadingHistory): Promise<void> {
    try {
      const existing = await this.getHistory();
      const filtered = existing.filter(h => h.chapter_id !== history.chapter_id);
      const updated = [history, ...filtered].slice(0, 100); // Keep last 100
      await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding history:', error);
    }
  },

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },

  // Bookmarks
  async getBookmarks(): Promise<Bookmark[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  },

  async addBookmark(bookmark: Bookmark): Promise<void> {
    try {
      const existing = await this.getBookmarks();
      await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify([...existing, bookmark]));
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  },

  async removeBookmark(bookmarkId: string): Promise<void> {
    try {
      const existing = await this.getBookmarks();
      const filtered = existing.filter(b => b.id !== bookmarkId);
      await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  },
};
