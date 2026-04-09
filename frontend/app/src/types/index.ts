export interface Series {
  series_id: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  author?: string;
  description?: string;
  date_added: number;
}

export interface Chapter {
  chapter_id: string;
  series_id: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  episode_no?: number;
  downloaded: boolean;
  download_path?: string;
  image_count?: number;
  date_downloaded?: number;
}

export interface DownloadTask {
  id: string;
  series_id: string;
  series_title: string;
  chapter_id: string;
  chapter_title: string;
  chapter_url: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  current_image: number;
  total_images: number;
  error?: string;
  date_added: number;
}

export interface ReadingHistory {
  chapter_id: string;
  series_id: string;
  series_title: string;
  chapter_title: string;
  last_page: number;
  total_pages: number;
  last_read: number;
  thumbnail_url?: string;
}

export interface Bookmark {
  id: string;
  series_id: string;
  chapter_id: string;
  page_number: number;
  note?: string;
  date_created: number;
}
