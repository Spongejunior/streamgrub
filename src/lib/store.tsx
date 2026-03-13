'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { DownloadItem, AppSettings, VideoFormat, Platform, DownloadStatus, generateId, detectPlatform } from './types';

interface AppState {
  queue: DownloadItem[];
  history: DownloadItem[];
  settings: AppSettings;
  activeDownloadId: string | null;
}

type Action =
  | { type: 'ADD_TO_QUEUE'; payload: Omit<DownloadItem, 'id' | 'status' | 'progress' | 'addedAt'> }
  | { type: 'REMOVE_FROM_QUEUE'; payload: string }
  | { type: 'UPDATE_DOWNLOAD'; payload: { id: string; updates: Partial<DownloadItem> } }
  | { type: 'SET_STATUS'; payload: { id: string; status: DownloadStatus; error?: string } }
  | { type: 'MOVE_TO_HISTORY'; payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'REORDER_QUEUE'; payload: DownloadItem[] }
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'SET_ACTIVE_DOWNLOAD'; payload: string | null };

const defaultSettings: AppSettings = {
  defaultFormat: 'video',
  defaultQuality: '1080p',
  concurrentDownloads: 1,
  downloadPath: 'Downloads'
};

const initialState: AppState = {
  queue: [],
  history: [],
  settings: defaultSettings,
  activeDownloadId: null
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TO_QUEUE': {
      const newItem: DownloadItem = {
        ...action.payload,
        id: generateId(),
        status: 'queued',
        progress: 0,
        addedAt: Date.now()
      };
      return {
        ...state,
        queue: [...state.queue, newItem]
      };
    }
    case 'REMOVE_FROM_QUEUE':
      return {
        ...state,
        queue: state.queue.filter(item => item.id !== action.payload)
      };
    case 'UPDATE_DOWNLOAD':
      return {
        ...state,
        queue: state.queue.map(item =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.updates }
            : item
        )
      };
    case 'SET_STATUS':
      return {
        ...state,
        queue: state.queue.map(item =>
          item.id === action.payload.id
            ? { ...item, status: action.payload.status, error: action.payload.error }
            : item
        )
      };
    case 'MOVE_TO_HISTORY': {
      const item = state.queue.find(i => i.id === action.payload);
      if (!item) return state;
      const completedItem: DownloadItem = {
        ...item,
        status: 'completed',
        progress: 100,
        completedAt: Date.now()
      };
      return {
        ...state,
        queue: state.queue.filter(i => i.id !== action.payload),
        history: [completedItem, ...state.history]
      };
    }
    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: []
      };
    case 'REORDER_QUEUE':
      return {
        ...state,
        queue: action.payload
      };
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    case 'LOAD_STATE':
      return action.payload;
    case 'SET_ACTIVE_DOWNLOAD':
      return {
        ...state,
        activeDownloadId: action.payload
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addToQueue: (url: string, title: string, platform: Platform, thumbnail: string | undefined, format: VideoFormat) => void;
  removeFromQueue: (id: string) => void;
  updateProgress: (id: string, progress: number, speed?: number, downloadedBytes?: number, totalBytes?: number, eta?: number) => void;
  setDownloadStatus: (id: string, status: DownloadStatus, error?: string) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  moveToHistory: (id: string) => void;
  clearHistory: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'streamgrab_state';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'LOAD_STATE', payload: { ...parsed, settings: { ...defaultSettings, ...parsed.settings } } });
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }, []);

  useEffect(() => {
    const toStore = {
      queue: state.queue,
      history: state.history,
      settings: state.settings
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [state.queue, state.history, state.settings]);

  const addToQueue = (url: string, title: string, platform: Platform, thumbnail: string | undefined, format: VideoFormat) => {
    dispatch({
      type: 'ADD_TO_QUEUE',
      payload: { url, title, platform, thumbnail, format }
    });
  };

  const removeFromQueue = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_QUEUE', payload: id });
  };

  const updateProgress = (id: string, progress: number, speed?: number, downloadedBytes?: number, totalBytes?: number, eta?: number) => {
    dispatch({
      type: 'UPDATE_DOWNLOAD',
      payload: { id, updates: { progress, speed, downloadedBytes, totalBytes, eta } }
    });
  };

  const setDownloadStatus = (id: string, status: DownloadStatus, error?: string) => {
    dispatch({ type: 'SET_STATUS', payload: { id, status, error } });
  };

  const pauseDownload = (id: string) => {
    dispatch({ type: 'SET_STATUS', payload: { id, status: 'paused' } });
  };

  const resumeDownload = (id: string) => {
    dispatch({ type: 'SET_STATUS', payload: { id, status: 'queued' } });
  };

  const cancelDownload = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_QUEUE', payload: id });
  };

  const moveToHistory = (id: string) => {
    dispatch({ type: 'MOVE_TO_HISTORY', payload: id });
  };

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' });
  };

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      addToQueue,
      removeFromQueue,
      updateProgress,
      setDownloadStatus,
      pauseDownload,
      resumeDownload,
      cancelDownload,
      moveToHistory,
      clearHistory
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
