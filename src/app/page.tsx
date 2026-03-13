'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const processQueue = async () => {
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
    };
    
    if (state.queue.length > 0) {
      processQueue();
    }
  }, [state.queue]);

  const handleClearHistory = () => {
    clearHistory();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="glass sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">StreamGrab</h1>
          </div>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`btn-secondary ${showHistory ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : ''}`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History ({state.history.length})
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">
            Download Videos from Anywhere
          </h2>
          <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
            Paste a video URL to download content from YouTube, Vimeo, SoundCloud, and 1000+ other platforms.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-12">
          <div className="card p-2 flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
                placeholder="Paste video URL here..."
                className="input-field border-0 bg-transparent pr-12 font-mono text-sm"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => { setUrl(''); setUrlError(''); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white"
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
              className="btn-primary"
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
            <p className="text-[var(--error)] text-sm mt-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {urlError}
            </p>
          )}
        </form>

        {!showHistory && (
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Queue
              {state.queue.length > 0 && (
                <span className="text-sm font-normal text-[var(--text-secondary)]">({state.queue.length})</span>
              )}
            </h3>
            
            {state.queue.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center">
                  <svg className="w-10 h-10 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-[var(--text-secondary)]">No downloads in queue</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Paste a URL above to start downloading</p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.queue.map(item => (
                  <DownloadCard
                    key={item.id}
                    item={item}
                    onCancel={cancelDownload}
                    onPause={pauseDownload}
                    onResume={resumeDownload}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {showHistory && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Download History
                {state.history.length > 0 && (
                  <span className="text-sm font-normal text-[var(--text-secondary)]">({state.history.length})</span>
                )}
              </h3>
              {state.history.length > 0 && (
                <button onClick={handleClearHistory} className="text-sm text-[var(--error)] hover:underline">
                  Clear all
                </button>
              )}
            </div>
            
            {state.history.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center">
                  <svg className="w-10 h-10 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[var(--text-secondary)]">No download history</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Completed downloads will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.history.map(item => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    onDelete={moveToHistory}
                  />
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
