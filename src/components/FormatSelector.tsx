'use client';

import { useState } from 'react';
import { detectPlatform, getPlatformName, Platform, VideoInfo, VideoFormat, formatBytes } from '@/lib/types';

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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden card animate-slide-up">
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            {videoInfo.thumbnail && (
              <img 
                src={videoInfo.thumbnail} 
                alt={videoInfo.title}
                className="w-24 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{videoInfo.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{videoInfo.uploader || getPlatformName(videoInfo.platform)}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-[var(--border)] flex gap-2">
          <button
            onClick={() => setSelectedTab('video')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTab === 'video' 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Video
          </button>
          <button
            onClick={() => setSelectedTab('audio')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTab === 'audio' 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Audio Only
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-64 scrollbar-thin">
          {getDisplayFormats().length === 0 ? (
            <p className="text-center text-[var(--text-secondary)] py-8">
              No formats available
            </p>
          ) : (
            <div className="space-y-2">
              {getDisplayFormats().map((format) => (
                <button
                  key={format.format_id}
                  onClick={() => setSelectedFormat(format)}
                  className={`w-full p-4 rounded-lg flex items-center justify-between transition-all ${
                    selectedFormat?.format_id === format.format_id
                      ? 'bg-[var(--primary)]/20 border-2 border-[var(--primary)]'
                      : 'bg-[var(--surface-elevated)] border-2 border-transparent hover:border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface)] flex items-center justify-center">
                      {selectedTab === 'video' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">
                        {format.resolution || format.ext.toUpperCase()}
                        {format.note && <span className="text-[var(--text-secondary)] text-sm ml-2">{format.note}</span>}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">{format.ext}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {format.filesize && (
                      <span className="text-sm text-[var(--text-secondary)]">{formatBytes(format.filesize)}</span>
                    )}
                    {format.filesize_approx && !format.filesize && (
                      <span className="text-sm text-[var(--text-secondary)]">~{formatBytes(format.filesize_approx)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--border)] flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button 
            onClick={handleDownload}
            disabled={!selectedFormat || isLoading}
            className="btn-primary flex-1"
          >
            {isLoading ? 'Adding to Queue...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
}
