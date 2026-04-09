import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const BASE_URL = `${API_URL}/api`;

export interface SeriesInfo {
  title: string;
  series_id: string;
  thumbnail_url?: string;
  author?: string;
  description?: string;
}

export interface Chapter {
  chapter_id: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  episode_no?: number;
}

export interface ChaptersResponse {
  chapters: Chapter[];
  total_count: number;
}

export interface ChapterImagesResponse {
  images: string[];
  chapter_title: string;
}

export const apiService = {
  async getSeriesInfo(url: string): Promise<SeriesInfo> {
    const response = await fetch(`${BASE_URL}/webtoon/series-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch series info');
    }
    
    return response.json();
  },

  async getChapters(url: string): Promise<ChaptersResponse> {
    const response = await fetch(`${BASE_URL}/webtoon/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch chapters');
    }
    
    return response.json();
  },

  async getChapterImages(chapterUrl: string): Promise<ChapterImagesResponse> {
    const response = await fetch(`${BASE_URL}/webtoon/chapter-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chapter_url: chapterUrl }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch chapter images');
    }
    
    return response.json();
  },

  getWebtoonHeaders(referer?: string) {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': referer || 'https://www.webtoons.com/',
    };
  },
};
