'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { detectPlatform, VideoInfo, VideoFormat, generateId } from '@/lib/types';
import DownloadCard from '@/components/DownloadCard';
import HistoryCard from '@/components/HistoryCard';
import FormatSelector from '@/components/FormatSelector';

export default function Home() {
  const { state, addToQueue, cancelDownload, pauseDownload, resumeDownload, moveToHistory, clearHistory, setDownloadStatus, updateProgress, dispatch } = useApp();
  
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [stats, setStats] = useState({ completed: 0, totalSize: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const completed = state.history.length;
    const totalSize = state.history.reduce((acc, item) => acc + (item.totalBytes || 0), 0);
    setStats({ completed, totalSize });
  }, [state.history]);

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const fetchVideoInfo = async (videoUrl: string) => {
    setIsLoading(true);
    setUrlError('');
    
    try {
      const response = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl })
      });
      
      const data = await response.json();
      
      if (data.error) {
        setUrlError(data.error);
        return;
      }
      
      const platform = detectPlatform(videoUrl);
      setVideoInfo({
        id: data.id || generateId(),
        title: data.title || 'Unknown Title',
        thumbnail: data.thumbnail,
        duration: data.duration,
        platform,
        url: videoUrl,
        formats: data.formats || [],
        uploader: data.uploader
      });
      setShowFormatSelector(true);
    } catch (error) {
      console.error('Fetch error:', error);
      setUrlError('Failed to fetch video information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setUrlError('Please enter a URL');
      return;
    }
    
    if (!validateUrl(url)) {
      setUrlError('Please enter a valid URL');
      return;
    }
    
    fetchVideoInfo(url);
  };

  const handleDownload = (format: VideoFormat) => {
    if (!videoInfo) return;
    
    addToQueue(videoInfo.url, videoInfo.title, videoInfo.platform, videoInfo.thumbnail, format);
    setUrl('');
  };

  const processQueue = useCallback(async () => {
    const activeItem = state.queue.find(item => item.status === 'downloading');
    const queuedItem = state.queue.find(item => item.status === 'queued');
    
    if (!activeItem && queuedItem) {
      dispatch({ type: 'SET_ACTIVE_DOWNLOAD', payload: queuedItem.id });
      setDownloadStatus(queuedItem.id, 'downloading');
      
      try {
        const response = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: queuedItem.url,
            format: queuedItem.format,
            id: queuedItem.id
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          setDownloadStatus(queuedItem.id, 'error', errorData.error || 'Download failed');
          return;
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
          setDownloadStatus(queuedItem.id, 'error', 'No response body');
          return;
        }
        
        const contentLength = response.headers.get('Content-Length');
        const totalBytes = contentLength ? parseInt(contentLength) : 0;
        let downloadedBytes = 0;
        const startTime = Date.now();
        
        while (true) {
          const item = state.queue.find(i => i.id === queuedItem.id);
          if (!item || item.status === 'paused' || item.status === 'queued') {
            reader.cancel();
            break;
          }
          
          const { done, value } = await reader.read();
          
          if (done) {
            moveToHistory(queuedItem.id);
            break;
          }
          
          downloadedBytes += value.length;
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = downloadedBytes / elapsed;
          const remaining = totalBytes > 0 ? (totalBytes - downloadedBytes) / speed : 0;
          
          updateProgress(
            queuedItem.id,
            totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0,
            speed,
            downloadedBytes,
            totalBytes,
            remaining
          );
        }
      } catch (error) {
        console.error('Download error:', error);
        setDownloadStatus(queuedItem.id, 'error', 'Download failed');
      }
    }
  }, [state.queue, dispatch, setDownloadStatus, moveToHistory, updateProgress]);
    
  useEffect(() => {
    if (state.queue.length > 0) {
      const timer = setTimeout(() => {
        processQueue();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.queue, processQueue]);

  const handleClearHistory = () => {
    clearHistory();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--primary)] rounded-full opacity-10 blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--secondary)] rounded-full opacity-10 blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--primary)] rounded-full opacity-5 blur-[150px]" />
      </div>

      <header className="glass sticky top-0 z-40 border-b border-[var(--border)]/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center shadow-lg shadow-[var(--glow-orange)] animate-pulse-glow">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight gradient-text">StreamGrab</h1>
              <p className="text-xs text-[var(--text-muted)]">Download Manager</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <svg className="w-4 h-4 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[var(--text-secondary)]">{stats.completed}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <svg className="w-4 h-4 text-[var(--secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <span className="text-[var(--text-secondary)]">{formatBytes(stats.totalSize)}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`btn-secondary ${showHistory ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] border-[var(--primary)] text-white' : ''}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">History</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{state.history.length}</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 relative">
        <div className="text-center mb-12 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)]/50 border border-[var(--border)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="text-sm text-[var(--text-secondary)]">Supports 1000+ platforms</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Download <span className="gradient-text">Videos</span> from Anywhere
          </h2>
          <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
            Paste a video URL to download content from YouTube, Vimeo, SoundCloud, and more in HD quality.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-12">
          <div className="card p-2 flex gap-3 glow-border animate-scale-in">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
                placeholder="Paste video URL here..."
                className="input-field border-0 bg-transparent pl-12 pr-12 font-mono text-sm"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => { setUrl(''); setUrlError(''); focusInput(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary whitespace-nowrap"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Fetching...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add to Queue
                </span>
              )}
            </button>
          </div>
          {urlError && (
            <p className="text-[var(--error)] text-sm mt-3 flex items-center gap-2 animate-slide-up">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {urlError}
            </p>
          )}
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-4 flex items-center gap-3 animate-slide-up stagger-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{state.queue.length + state.history.length}</p>
              <p className="text-sm text-[var(--text-muted)]">Total Downloads</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3 animate-slide-up stagger-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--secondary)] to-[var(--secondary-light)] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{state.queue.filter(i => i.status === 'downloading').length || 0}</p>
              <p className="text-sm text-[var(--text-muted)]">Active Downloads</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3 animate-slide-up stagger-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--success)] to-[var(--success-light)] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-[var(--text-muted)]">Completed</p>
            </div>
          </div>
        </div>

        {!showHistory && (
          <section className="animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Queue
              {state.queue.length > 0 && (
                <span className="text-sm font-normal text-[var(--text-secondary)] bg-[var(--surface)] px-2 py-0.5 rounded">{state.queue.length}</span>
              )}
            </h3>
            
            {state.queue.length === 0 ? (
              <div className="card p-12 text-center animate-scale-in">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface)] flex items-center justify-center border border-[var(--border)]">
                  <svg className="w-12 h-12 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-[var(--text-secondary)] text-lg mb-2">No downloads in queue</p>
                <p className="text-sm text-[var(--text-muted)]">Paste a URL above to start downloading</p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.queue.map((item, index) => (
                  <div key={item.id} className={`animate-slide-up stagger-${Math.min(index + 1, 5)}`}>
                    <DownloadCard
                      item={item}
                      onCancel={cancelDownload}
                      onPause={pauseDownload}
                      onResume={resumeDownload}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {showHistory && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Download History
                {state.history.length > 0 && (
                  <span className="text-sm font-normal text-[var(--text-secondary)] bg-[var(--surface)] px-2 py-0.5 rounded">{state.history.length}</span>
                )}
              </h3>
              {state.history.length > 0 && (
                <button onClick={handleClearHistory} className="text-sm text-[var(--error)] hover:underline flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear all
                </button>
              )}
            </div>
            
            {state.history.length === 0 ? (
              <div className="card p-12 text-center animate-scale-in">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface)] flex items-center justify-center border border-[var(--border)]">
                  <svg className="w-12 h-12 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[var(--text-secondary)] text-lg mb-2">No download history</p>
                <p className="text-sm text-[var(--text-muted)]">Completed downloads will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.history.map((item, index) => (
                  <div key={item.id} className={`animate-slide-up stagger-${Math.min(index + 1, 5)}`}>
                    <HistoryCard
                      item={item}
                      onDelete={moveToHistory}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <FormatSelector
        videoInfo={videoInfo}
        isOpen={showFormatSelector}
        onClose={() => { setShowFormatSelector(false); setVideoInfo(null); }}
        onDownload={handleDownload}
        isLoading={isLoading}
      />
    </div>
  );
}
