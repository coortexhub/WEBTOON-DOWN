import { create } from 'zustand';
import { DownloadTask } from '../types';
import { downloadManager } from '../services/downloadManager';

interface DownloadState {
  tasks: DownloadTask[];
  
  // Actions
  initialize: () => void;
  addTask: (task: DownloadTask) => void;
  addMultipleTasks: (tasks: DownloadTask[]) => void;
  removeTask: (taskId: string) => void;
  pauseTask: (taskId: string) => void;
  resumeTask: (taskId: string) => void;
  clearCompleted: () => void;
  getActiveCount: () => number;
  getCompletedCount: () => number;
  getFailedCount: () => number;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  tasks: [],

  initialize: () => {
    // Subscribe to download manager updates
    downloadManager.subscribe((tasks) => {
      set({ tasks });
    });
    // Initialize with current queue
    set({ tasks: downloadManager.getQueue() });
  },

  addTask: (task: DownloadTask) => {
    downloadManager.addToQueue(task);
  },

  addMultipleTasks: (tasks: DownloadTask[]) => {
    downloadManager.addMultipleToQueue(tasks);
  },

  removeTask: (taskId: string) => {
    downloadManager.removeFromQueue(taskId);
  },

  pauseTask: (taskId: string) => {
    downloadManager.pauseDownload(taskId);
  },

  resumeTask: (taskId: string) => {
    downloadManager.resumeDownload(taskId);
  },

  clearCompleted: () => {
    downloadManager.clearCompleted();
  },

  getActiveCount: () => {
    return get().tasks.filter(t => t.status === 'downloading' || t.status === 'queued').length;
  },

  getCompletedCount: () => {
    return get().tasks.filter(t => t.status === 'completed').length;
  },

  getFailedCount: () => {
    return get().tasks.filter(t => t.status === 'failed').length;
  },
}));
