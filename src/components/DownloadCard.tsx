'use client';

import { DownloadItem, formatBytes, formatSpeed, formatEta, getPlatformName } from '@/lib/types';

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

  const getStatusColor = () => {
    if (isActive) return 'from-[var(--secondary)] to-[var(--secondary-light)]';
    if (isPaused) return 'from-[var(--warning)] to-[var(--warning-light)]';
    if (isCompleted) return 'from-[var(--success)] to-[var(--success-light)]';
    if (isError) return 'from-[var(--error)] to-[var(--error-light)]';
    return 'from-[var(--text-muted)] to-[var(--text-secondary)]';
  };

  return (
    <div className={`card card-hover p-4 ${isActive ? 'ring-2 ring-[var(--secondary)]/30' : ''}`}>
      <div className="flex gap-4">
        <div className="w-28 h-20 rounded-xl overflow-hidden bg-[var(--surface-elevated)] flex-shrink-0 relative group">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {isActive && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-[var(--secondary)] border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold truncate pr-2">{item.title}</h4>
            <span className={`platform-badge flex-shrink-0`} style={{ backgroundColor: item.platform === 'youtube' ? '#ff0000' : item.platform === 'vimeo' ? '#1ab7ea' : item.platform === 'soundcloud' ? '#ff5500' : item.platform === 'dailymotion' ? '#00aaff' : 'var(--surface-elevated)' }}>
              {getPlatformName(item.platform)}
            </span>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getStatusColor()}`} />
                <span className={`status-${item.status} font-medium`}>
                  {isActive && item.speed ? formatSpeed(item.speed) : 
                   isActive ? 'Starting...' :
                   isPaused ? 'Paused' :
                   isQueued ? 'Waiting in queue...' :
                   isCompleted ? 'Completed' :
                   isError ? 'Failed' : 'Unknown'}
                </span>
              </div>
              <span className="text-[var(--text-muted)] text-xs">
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
            {isActive && (
              <div className="flex justify-end mt-1">
                <span className="text-xs text-[var(--secondary)] font-mono">{Math.round(item.progress)}%</span>
              </div>
            )}
          </div>

          {item.error && (
            <p className="text-sm text-[var(--error)] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {item.error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isActive && (
            <>
              <button 
                onClick={() => onPause(item.id)}
                className="btn-icon"
                title="Pause"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              </button>
              <button 
                onClick={() => onCancel(item.id)}
                className="btn-icon danger"
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
                className="btn-icon success"
                title="Resume"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              </button>
              <button 
                onClick={() => onCancel(item.id)}
                className="btn-icon danger"
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
              className="btn-icon danger"
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
              className="btn-icon"
              title="Remove from list"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          {isError && (
            <button 
              onClick={() => onCancel(item.id)}
              className="btn-icon danger"
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
