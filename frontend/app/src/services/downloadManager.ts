import * as FileSystem from 'expo-file-system';
import { apiService } from './api';
import { storageService, getChapterDirectory } from './storage';
import { DownloadTask } from '../types';

export class DownloadManager {
  private downloadQueue: DownloadTask[] = [];
  private activeDownloads = new Map<string, boolean>();
  private maxConcurrent = 3;
  private listeners: ((tasks: DownloadTask[]) => void)[] = [];

  subscribe(listener: (tasks: DownloadTask[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.downloadQueue]));
  }

  addToQueue(task: DownloadTask) {
    const exists = this.downloadQueue.find(t => t.chapter_id === task.chapter_id);
    if (!exists) {
      this.downloadQueue.push(task);
      this.notify();
      this.processQueue();
    }
  }

  addMultipleToQueue(tasks: DownloadTask[]) {
    tasks.forEach(task => {
      const exists = this.downloadQueue.find(t => t.chapter_id === task.chapter_id);
      if (!exists) {
        this.downloadQueue.push(task);
      }
    });
    this.notify();
    this.processQueue();
  }

  removeFromQueue(taskId: string) {
    this.downloadQueue = this.downloadQueue.filter(t => t.id !== taskId);
    this.notify();
  }

  pauseDownload(taskId: string) {
    const task = this.downloadQueue.find(t => t.id === taskId);
    if (task && task.status === 'downloading') {
      task.status = 'paused';
      this.activeDownloads.delete(taskId);
      this.notify();
    }
  }

  resumeDownload(taskId: string) {
    const task = this.downloadQueue.find(t => t.id === taskId);
    if (task && task.status === 'paused') {
      task.status = 'queued';
      this.notify();
      this.processQueue();
    }
  }

  getQueue(): DownloadTask[] {
    return [...this.downloadQueue];
  }

  clearCompleted() {
    this.downloadQueue = this.downloadQueue.filter(t => t.status !== 'completed');
    this.notify();
  }

  private async processQueue() {
    const activeCount = this.activeDownloads.size;
    if (activeCount >= this.maxConcurrent) return;

    const queuedTasks = this.downloadQueue.filter(t => t.status === 'queued');
    const availableSlots = this.maxConcurrent - activeCount;
    const tasksToStart = queuedTasks.slice(0, availableSlots);

    tasksToStart.forEach(task => {
      this.downloadChapter(task);
    });
  }

  private async downloadChapter(task: DownloadTask) {
    this.activeDownloads.set(task.id, true);
    task.status = 'downloading';
    task.progress = 0;
    this.notify();

    try {
      // Get image URLs
      const { images, chapter_title } = await apiService.getChapterImages(task.chapter_url);
      task.total_images = images.length;
      task.current_image = 0;
      this.notify();

      // Create chapter directory
      const chapterDir = getChapterDirectory(task.series_id, task.chapter_id);
      await FileSystem.makeDirectoryAsync(chapterDir, { intermediates: true });

      // Download images
      const headers = apiService.getWebtoonHeaders(task.chapter_url);
      
      for (let i = 0; i < images.length; i++) {
        // Check if paused
        if (task.status === 'paused') {
          break;
        }

        const imageUrl = images[i];
        const imagePath = `${chapterDir}${String(i + 1).padStart(3, '0')}.jpg`;

        try {
          // Download image
          const downloadResult = await FileSystem.downloadAsync(
            imageUrl,
            imagePath,
            { headers }
          );

          if (downloadResult.status === 200) {
            task.current_image = i + 1;
            task.progress = Math.round(((i + 1) / images.length) * 100);
            this.notify();
          }
        } catch (error) {
          console.error(`Failed to download image ${i + 1}:`, error);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mark as completed if all images downloaded
      if (task.current_image === task.total_images) {
        task.status = 'completed';
        task.progress = 100;

        // Update chapter in storage
        await storageService.updateChapter({
          chapter_id: task.chapter_id,
          series_id: task.series_id,
          title: task.chapter_title,
          url: task.chapter_url,
          downloaded: true,
          download_path: chapterDir,
          image_count: task.total_images,
          date_downloaded: Date.now(),
        });
      } else if (task.status === 'downloading') {
        task.status = 'failed';
        task.error = 'Incomplete download';
      }
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message || 'Download failed';
      console.error('Download error:', error);
    } finally {
      this.activeDownloads.delete(task.id);
      this.notify();
      this.processQueue(); // Start next download
    }
  }
}

export const downloadManager = new DownloadManager();
