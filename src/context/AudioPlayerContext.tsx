import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode } from '../api/types';
import { storage } from '../utils/storage';
import { useLibrary } from './LibraryContext';
import { resolvePlayable } from '../services/resolve';

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  queue: Track[];
  queueIndex: number;
  isFullPlayerOpen: boolean;
  isQueueDrawerOpen: boolean;
  playbackError: string | null;

  // Actions
  playTrack: (track: Track, newQueue?: Track[], index?: number) => void;
  togglePlayPause: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  clearQueue: () => void;
  setIsFullPlayerOpen: (open: boolean) => void;
  setIsQueueDrawerOpen: (open: boolean) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[], currentItemIndex: number): { shuffled: T[]; newCurrentIndex: number } {
  const arr = [...array];
  const currentItem = arr[currentItemIndex];
  
  // Remove current item so it stays first
  arr.splice(currentItemIndex, 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  if (currentItem) {
    arr.unshift(currentItem);
  }
  return { shuffled: arr, newCurrentIndex: 0 };
}

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addRecentlyPlayed } = useLibrary();

  // Load saved state once during initialization
  const savedState = storage.getPlayerState();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialSeekDoneRef = useRef<boolean>(false);
  const lastSaveTimeRef = useRef<number>(0);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => savedState?.currentTrack ?? null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(() => savedState?.currentTime ?? 0);
  const [duration, setDuration] = useState<number>(() => savedState?.duration ?? (savedState?.currentTrack?.duration ?? 0));
  const [volume, setVolumeState] = useState<number>(() => storage.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => savedState?.repeatMode ?? 'off');
  const [isShuffled, setIsShuffled] = useState<boolean>(() => savedState?.isShuffled ?? false);
  
  const [queue, setQueue] = useState<Track[]>(() => savedState?.queue ?? []);
  const [originalQueue, setOriginalQueue] = useState<Track[]>(() => savedState?.originalQueue ?? (savedState?.queue ?? []));
  const [queueIndex, setQueueIndex] = useState<number>(() => savedState?.queueIndex ?? -1);
  
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState<boolean>(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Keep a reference to current state to flush on pageunload/visibility change
  const stateRef = useRef({
    currentTrack,
    queue,
    originalQueue,
    queueIndex,
    currentTime,
    duration,
    repeatMode,
    isShuffled
  });

  useEffect(() => {
    stateRef.current = {
      currentTrack,
      queue,
      originalQueue,
      queueIndex,
      currentTime,
      duration,
      repeatMode,
      isShuffled
    };
  }, [currentTrack, queue, originalQueue, queueIndex, currentTime, duration, repeatMode, isShuffled]);

  // Flush state to storage helper
  const flushStateToStorage = useCallback(() => {
    const s = stateRef.current;
    if (s.currentTrack) {
      storage.setPlayerState({
        currentTrack: s.currentTrack,
        queue: s.queue,
        originalQueue: s.originalQueue,
        queueIndex: s.queueIndex,
        currentTime: s.currentTime,
        duration: s.duration,
        repeatMode: s.repeatMode,
        isShuffled: s.isShuffled
      });
    }
  }, []);

  // Initialize audio element and restore persisted track if available
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    // Restore track source if available from previous session
    if (savedState?.currentTrack?.streamUrl) {
      audio.src = savedState.currentTrack.streamUrl;
      audio.load();
    }

    const handleTimeUpdate = () => {
      const nowPos = audio.currentTime;
      setCurrentTime(nowPos);

      // Throttled persistence save every 2 seconds
      const nowMs = Date.now();
      if (nowMs - lastSaveTimeRef.current > 2000) {
        lastSaveTimeRef.current = nowMs;
        if (stateRef.current.currentTrack) {
          storage.setPlayerState({
            currentTime: nowPos,
            duration: audio.duration || stateRef.current.duration
          });
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);

      // Restore position once on initial load
      if (!initialSeekDoneRef.current && savedState && savedState.currentTime > 0) {
        initialSeekDoneRef.current = true;
        try {
          if (savedState.currentTime < (audio.duration || 9999)) {
            audio.currentTime = savedState.currentTime;
          }
        } catch {
          // Ignore seek timing exceptions
        }
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setPlaybackError(null);

      // Restore position if not done yet
      if (!initialSeekDoneRef.current && savedState && savedState.currentTime > 0) {
        initialSeekDoneRef.current = true;
        try {
          if (savedState.currentTime < (audio.duration || 9999)) {
            audio.currentTime = savedState.currentTime;
          }
        } catch {
          // Ignore
        }
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
      flushStateToStorage();
    };

    const handleError = (e: Event) => {
      console.warn('Audio playback error', e);
      setIsLoading(false);
      setIsPlaying(false);
      // Only show error if user was actively playing
      if (initialSeekDoneRef.current) {
        setPlaybackError('Unable to stream this track. Skipping or retry...');
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    // Save state on tab close, page refresh, or PWA backgrounding
    const handlePageHide = () => {
      flushStateToStorage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushStateToStorage();
      }
    };

    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      flushStateToStorage();
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flushStateToStorage]);

  // Update volume and mute on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Play audio source with Audio-Twin swap resolution
  const loadAndPlayTrack = useCallback(async (track: Track, startTime = 0) => {
    if (!audioRef.current || !track) return;
    const audio = audioRef.current;

    setPlaybackError(null);
    setIsLoading(true);
    setCurrentTrack(track);
    addRecentlyPlayed(track);

    // Save immediate state
    storage.setPlayerState({
      currentTrack: track,
      currentTime: startTime
    });

    // Resolve to high-fidelity audio twin if from YouTube
    const resolvedTrack = await resolvePlayable(track);
    if (resolvedTrack && resolvedTrack.id !== track.id) {
      setCurrentTrack(resolvedTrack);
    }

    const streamUrl = resolvedTrack.streamUrl || track.streamUrl;

    if (streamUrl) {
      audio.src = streamUrl;
      audio.load();
      if (startTime > 0) {
        try { audio.currentTime = startTime; } catch { /* ignore */ }
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(err => {
            console.warn('Auto-play was prevented or interrupted', err);
            setIsPlaying(false);
            setIsLoading(false);
          });
      }
    } else {
      setPlaybackError('Stream URL unavailable');
      setIsLoading(false);
    }
  }, [addRecentlyPlayed]);

  // Main play function
  const playTrack = useCallback((track: Track, newQueue?: Track[], index?: number) => {
    let finalQueue = queue;
    let finalOrigQueue = originalQueue;
    let finalIndex = queueIndex;

    if (newQueue && newQueue.length > 0) {
      const targetIndex = index !== undefined ? index : newQueue.findIndex(t => t.id === track.id);
      const validIndex = targetIndex >= 0 ? targetIndex : 0;
      
      finalOrigQueue = newQueue;
      setOriginalQueue(newQueue);

      if (isShuffled) {
        const { shuffled, newCurrentIndex } = shuffleArray(newQueue, validIndex);
        finalQueue = shuffled;
        finalIndex = newCurrentIndex;
        setQueue(shuffled);
        setQueueIndex(newCurrentIndex);
      } else {
        finalQueue = newQueue;
        finalIndex = validIndex;
        setQueue(newQueue);
        setQueueIndex(validIndex);
      }
    } else {
      // Single track or existing queue
      const existingIdx = queue.findIndex(t => t.id === track.id);
      if (existingIdx >= 0) {
        finalIndex = existingIdx;
        setQueueIndex(existingIdx);
      } else {
        const updated = [track, ...queue];
        finalQueue = updated;
        finalOrigQueue = updated;
        finalIndex = 0;
        setQueue(updated);
        setOriginalQueue(updated);
        setQueueIndex(0);
      }
    }

    // Persist full state
    storage.setPlayerState({
      currentTrack: track,
      queue: finalQueue,
      originalQueue: finalOrigQueue,
      queueIndex: finalIndex,
      currentTime: 0
    });

    loadAndPlayTrack(track);
  }, [queue, originalQueue, queueIndex, isShuffled, loadAndPlayTrack]);

  // Next track
  const next = useCallback(() => {
    if (queue.length === 0) return;

    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      storage.setPlayerState({ queueIndex: nextIdx });
      loadAndPlayTrack(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      storage.setPlayerState({ queueIndex: 0 });
      loadAndPlayTrack(queue[0]);
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex, repeatMode, loadAndPlayTrack]);

  // Previous track
  const previous = useCallback(() => {
    if (!audioRef.current || queue.length === 0) return;

    // If played more than 3 seconds, restart current track
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      setQueueIndex(prevIdx);
      storage.setPlayerState({ queueIndex: prevIdx });
      loadAndPlayTrack(queue[prevIdx]);
    } else {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, [queue, queueIndex, loadAndPlayTrack]);

  // Handle Track Ended with repeat logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
      } else {
        next();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, next]);

  // Controls
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
    } else {
      // If audio has no src yet, load currentTrack
      if (!audio.src || audio.src === window.location.href) {
        loadAndPlayTrack(currentTrack, currentTime);
      } else {
        audio.play().catch(err => {
          console.warn('Playback error on toggle', err);
          loadAndPlayTrack(currentTrack, currentTime);
        });
      }
    }
  }, [isPlaying, currentTrack, currentTime, loadAndPlayTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    const audio = audioRef.current;
    if (!audio.src || audio.src === window.location.href) {
      loadAndPlayTrack(currentTrack, currentTime);
    } else {
      audio.play().catch(console.warn);
    }
  }, [currentTrack, currentTime, loadAndPlayTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      storage.setPlayerState({ currentTime: time });
    }
  }, []);

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    storage.setVolume(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    if (!isShuffled) {
      if (queue.length > 0) {
        const { shuffled, newCurrentIndex } = shuffleArray(originalQueue.length > 0 ? originalQueue : queue, queueIndex);
        setQueue(shuffled);
        setQueueIndex(newCurrentIndex);
        storage.setPlayerState({ queue: shuffled, queueIndex: newCurrentIndex, isShuffled: true });
      }
      setIsShuffled(true);
    } else {
      // Restore original queue
      if (originalQueue.length > 0 && currentTrack) {
        setQueue(originalQueue);
        const idx = originalQueue.findIndex(t => t.id === currentTrack.id);
        const validIdx = idx >= 0 ? idx : 0;
        setQueueIndex(validIdx);
        storage.setPlayerState({ queue: originalQueue, queueIndex: validIdx, isShuffled: false });
      }
      setIsShuffled(false);
    }
  }, [isShuffled, queue, originalQueue, queueIndex, currentTrack]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      let nextMode: RepeatMode = 'off';
      if (prev === 'off') nextMode = 'all';
      else if (prev === 'all') nextMode = 'one';
      else nextMode = 'off';

      storage.setPlayerState({ repeatMode: nextMode });
      return nextMode;
    });
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => {
      const updated = [...prev, track];
      storage.setPlayerState({ queue: updated });
      return updated;
    });
    setOriginalQueue(prev => [...prev, track]);
  }, []);

  const playNext = useCallback((track: Track) => {
    setQueue(prev => {
      const updated = [...prev];
      const insertAt = queueIndex >= 0 ? queueIndex + 1 : 0;
      updated.splice(insertAt, 0, track);
      storage.setPlayerState({ queue: updated });
      return updated;
    });
    setOriginalQueue(prev => {
      const updated = [...prev];
      const insertAt = queueIndex >= 0 ? queueIndex + 1 : 0;
      updated.splice(insertAt, 0, track);
      return updated;
    });
  }, [queueIndex]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => {
      const updated = prev.filter((_, i) => i !== index);
      storage.setPlayerState({ queue: updated });
      return updated;
    });
    if (index < queueIndex) {
      setQueueIndex(prev => {
        const nextIdx = prev - 1;
        storage.setPlayerState({ queueIndex: nextIdx });
        return nextIdx;
      });
    } else if (index === queueIndex && queue.length > 1) {
      next();
    }
  }, [queueIndex, queue.length, next]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      storage.setPlayerState({ queue: result });
      return result;
    });
  }, []);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      const single = [currentTrack];
      setQueue(single);
      setOriginalQueue(single);
      setQueueIndex(0);
      storage.setPlayerState({ queue: single, originalQueue: single, queueIndex: 0 });
    } else {
      setQueue([]);
      setOriginalQueue([]);
      setQueueIndex(-1);
      storage.clearPlayerState();
    }
  }, [currentTrack]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffled,
        queue,
        queueIndex,
        isFullPlayerOpen,
        isQueueDrawerOpen,
        playbackError,
        playTrack,
        togglePlayPause,
        pause,
        resume,
        next,
        previous,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeatMode,
        addToQueue,
        playNext,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        setIsFullPlayerOpen,
        setIsQueueDrawerOpen
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
