'use client';

import { DownloadItem, formatBytes, getPlatformName, formatDuration } from '@/lib/types';

interface HistoryCardProps {
  item: DownloadItem;
  onDelete: (id: string) => void;
}

export default function HistoryCard({ item, onDelete }: HistoryCardProps) {
  const completedDate = item.completedAt 
    ? new Date(item.completedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : 'Unknown';

  return (
    <div className="card p-4 flex items-center gap-4 animate-fade-in">
      <div className="w-20 h-14 rounded-lg overflow-hidden bg-[var(--surface-elevated)] flex-shrink-0">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{item.title}</h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-[var(--text-secondary)]">{completedDate}</span>
          <span className="format-badge">{item.format.resolution || item.format.ext.toUpperCase()}</span>
          {item.totalBytes && (
            <span className="text-sm text-[var(--text-secondary)]">{formatBytes(item.totalBytes)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="platform-badge text-xs" style={{ backgroundColor: item.platform === 'youtube' ? '#ff0000' : item.platform === 'vimeo' ? '#1ab7ea' : item.platform === 'soundcloud' ? '#ff5500' : 'var(--surface-elevated)' }}>
          {getPlatformName(item.platform)}
        </span>
        <button 
          onClick={() => onDelete(item.id)}
          className="w-8 h-8 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center hover:bg-[var(--error)]/20 hover:text-[var(--error)] transition-colors"
          title="Remove from history"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
