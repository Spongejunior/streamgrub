export type Platform = 'youtube' | 'vimeo' | 'soundcloud' | 'dailymotion' | 'other';

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'error';

export type FormatType = 'video' | 'audio';

export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution?: string;
  filesize?: number;
  filesize_approx?: number;
  note?: string;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  platform: Platform;
  url: string;
  formats: VideoFormat[];
  uploader?: string;
}

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  platform: Platform;
  thumbnail?: string;
  format: VideoFormat;
  status: DownloadStatus;
  progress: number;
  speed?: number;
  downloadedBytes?: number;
  totalBytes?: number;
  eta?: number;
  error?: string;
  addedAt: number;
  completedAt?: number;
  outputPath?: string;
}

export interface AppSettings {
  defaultFormat: FormatType;
  defaultQuality: string;
  concurrentDownloads: number;
  downloadPath: string;
}

export function detectPlatform(url: string): Platform {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('youtube')) {
    return 'youtube';
  }
  if (lowerUrl.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (lowerUrl.includes('soundcloud.com')) {
    return 'soundcloud';
  }
  if (lowerUrl.includes('dailymotion.com')) {
    return 'dailymotion';
  }
  return 'other';
}

export function getPlatformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    soundcloud: 'SoundCloud',
    dailymotion: 'Dailymotion',
    other: 'Website'
  };
  return names[platform];
}

export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    youtube: '#ff0000',
    vimeo: '#1ab7ea',
    soundcloud: '#ff5500',
    dailymotion: '#00aaff',
    other: '#71717a'
  };
  return colors[platform];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + '/s';
}

export function formatEta(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
