'use client';

import { DownloadItem, formatBytes, formatSpeed, formatEta, getPlatformName } from '@/lib/types';
import { useApp } from '@/lib/store';

interface DownloadCardProps {
  item: DownloadItem;
  onCancel: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

export default function DownloadCard({ item, onCancel, onPause, onResume }: DownloadCardProps) {
  const isActive = item.status === 'downloading';
  const isPaused = item.status === 'paused';
  const isQueued = item.status === 'queued';
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';

  return (
    <div className={`card p-4 animate-slide-up ${isActive ? 'ring-2 ring-[var(--secondary)]/50' : ''}`}>
      <div className="flex gap-4">
        <div className="w-24 h-16 rounded-lg overflow-hidden bg-[var(--surface-elevated)] flex-shrink-0">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium truncate">{item.title}</h4>
            <span className={`platform-badge flex-shrink-0`} style={{ backgroundColor: item.platform === 'youtube' ? '#ff0000' : item.platform === 'vimeo' ? '#1ab7ea' : item.platform === 'soundcloud' ? '#ff5500' : item.platform === 'dailymotion' ? '#00aaff' : 'var(--surface-elevated)' }}>
              {getPlatformName(item.platform)}
            </span>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className={`status-${item.status}`}>
                {isActive && item.speed ? formatSpeed(item.speed) : 
                 isActive ? 'Starting...' :
                 isPaused ? 'Paused' :
                 isQueued ? 'Waiting...' :
                 isCompleted ? 'Completed' :
                 isError ? 'Error' : 'Unknown'}
              </span>
              <span className="text-[var(--text-secondary)]">
                {isActive && item.eta ? `ETA: ${formatEta(item.eta)}` :
                 isActive && item.totalBytes ? `${formatBytes(item.downloadedBytes || 0)} / ${formatBytes(item.totalBytes)}` :
                 item.format.resolution || item.format.ext.toUpperCase()}
              </span>
            </div>

            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${isCompleted ? 100 : item.progress}%` }}
              />
            </div>
          </div>

          {item.error && (
            <p className="text-sm text-[var(--error)] mt-2">{item.error}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isActive && (
            <>
              <button 
                onClick={() => onPause(item.id)}
                className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
                title="Pause"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                onClick={() => onCancel(item.id)}
                className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center hover:bg-[var(--error)]/20 hover:text-[var(--error)] transition-colors"
                title="Cancel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          {isPaused && (
            <>
              <button 
                onClick={() => onResume(item.id)}
                className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center hover:bg-[var(--success)]/20 hover:text-[var(--success)] transition-colors"
                title="Resume"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                onClick={() => onCancel(item.id)}
                className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center hover:bg-[var(--error)]/20 hover:text-[var(--error)] transition-colors"
                title="Cancel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          {isQueued && (
            <button 
              onClick={() => onCancel(item.id)}
              className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center hover:bg-[var(--error)]/20 hover:text-[var(--error)] transition-colors"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {isCompleted && (
            <button 
              onClick={() => onCancel(item.id)}
              className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center hover:bg-[var(--error)]/20 hover:text-[var(--error)] transition-colors"
              title="Remove from list"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {isError && (
            <button 
              onClick={() => onCancel(item.id)}
              className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center hover:bg-[var(--error)]/20 hover:text-[var(--error)] transition-colors"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
