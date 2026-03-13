'use client';

import { useState } from 'react';
import { getPlatformName, VideoInfo, VideoFormat, formatBytes } from '@/lib/types';

interface FormatSelectorProps {
  videoInfo: VideoInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (format: VideoFormat) => void;
  isLoading?: boolean;
}

export default function FormatSelector({ videoInfo, isOpen, onClose, onDownload, isLoading }: FormatSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<'video' | 'audio'>('video');
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);

  if (!isOpen || !videoInfo) return null;

  const videoFormats = videoInfo.formats.filter(f => f.ext === 'mp4' || f.ext === 'webm' || f.resolution);
  const audioFormats = videoInfo.formats.filter(f => f.ext === 'mp3' || f.ext === 'm4a' || f.ext === 'wav' || f.ext === 'flac');

  const getDisplayFormats = () => {
    if (selectedTab === 'video') return videoFormats;
    return audioFormats;
  };

  const handleDownload = () => {
    if (selectedFormat) {
      onDownload(selectedFormat);
      setSelectedFormat(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden card animate-scale-in">
        <div className="p-6 border-b border-[var(--border)] bg-gradient-to-r from-[var(--surface)] to-[var(--surface-elevated)]">
          <div className="flex items-center gap-4">
            {videoInfo.thumbnail ? (
              <div className="relative">
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title}
                  className="w-28 h-20 object-cover rounded-xl shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2">
                  <span className="platform-badge text-xs" style={{ backgroundColor: videoInfo.platform === 'youtube' ? '#ff0000' : videoInfo.platform === 'vimeo' ? '#1ab7ea' : videoInfo.platform === 'soundcloud' ? '#ff5500' : 'var(--surface-elevated)' }}>
                    {getPlatformName(videoInfo.platform)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-28 h-20 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate pr-4">{videoInfo.title}</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {videoInfo.uploader || 'Unknown'}
              </p>
              {videoInfo.duration && (
                <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {Math.floor(videoInfo.duration / 60)}:{String(videoInfo.duration % 60).padStart(2, '0')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-[var(--border)] flex gap-3">
          <button
            onClick={() => { setSelectedTab('video'); setSelectedFormat(null); }}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              selectedTab === 'video' 
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white shadow-lg shadow-[var(--glow-orange)]' 
                : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Video
          </button>
          <button
            onClick={() => { setSelectedTab('audio'); setSelectedFormat(null); }}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              selectedTab === 'audio' 
                ? 'bg-gradient-to-r from-[var(--secondary)] to-[var(--secondary-light)] text-white shadow-lg shadow-[var(--glow-cyan)]' 
                : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Audio Only
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-64 scrollbar-thin">
          {getDisplayFormats().length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)]">No formats available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {getDisplayFormats().map((format) => (
                <button
                  key={format.format_id}
                  onClick={() => setSelectedFormat(format)}
                  className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                    selectedFormat?.format_id === format.format_id
                      ? 'bg-gradient-to-r from-[var(--primary)]/20 to-[var(--secondary)]/20 border-2 border-[var(--primary)]'
                      : 'bg-[var(--surface-elevated)] border-2 border-transparent hover:border-[var(--border)] hover:bg-[var(--border)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedTab === 'video' 
                        ? 'bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-hover)]/10' 
                        : 'bg-gradient-to-br from-[var(--secondary)]/20 to-[var(--secondary-light)]/10'
                    }`}>
                      {selectedTab === 'video' ? (
                        <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-[var(--secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">
                        {format.resolution || format.ext.toUpperCase()}
                        {format.note && <span className="text-[var(--primary)] text-sm ml-2">{format.note}</span>}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[var(--surface)] text-xs">{format.ext.toUpperCase()}</span>
                        {format.format_id && <span className="text-xs">ID: {format.format_id}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {format.filesize && (
                      <span className="text-sm font-medium text-[var(--secondary)]">{formatBytes(format.filesize)}</span>
                    )}
                    {format.filesize_approx && !format.filesize && (
                      <span className="text-sm text-[var(--text-muted)]">~{formatBytes(format.filesize_approx)}</span>
                    )}
                    {!format.filesize && !format.filesize_approx && (
                      <span className="text-xs text-[var(--text-muted)]">Size unknown</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--border)] flex gap-3 bg-gradient-to-r from-[var(--surface)] to-[var(--surface-elevated)]">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button 
            onClick={handleDownload}
            disabled={!selectedFormat || isLoading}
            className="btn-primary flex-1"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Adding...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
