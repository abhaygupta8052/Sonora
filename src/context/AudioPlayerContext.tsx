import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode } from '../api/types';
import { storage } from '../utils/storage';
import { useLibrary } from './LibraryContext';

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(() => storage.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  
  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState<boolean>(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setPlaybackError(null);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.warn('Audio playback error', e);
      setIsLoading(false);
      setIsPlaying(false);
      setPlaybackError('Unable to stream this track. Skipping or retry...');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Update volume and mute on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Play audio source
  const loadAndPlayTrack = useCallback((track: Track) => {
    if (!audioRef.current || !track) return;
    const audio = audioRef.current;

    setPlaybackError(null);
    setIsLoading(true);
    setCurrentTrack(track);
    addRecentlyPlayed(track);

    if (track.streamUrl) {
      audio.src = track.streamUrl;
      audio.load();
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
    if (newQueue && newQueue.length > 0) {
      const targetIndex = index !== undefined ? index : newQueue.findIndex(t => t.id === track.id);
      const validIndex = targetIndex >= 0 ? targetIndex : 0;
      
      setOriginalQueue(newQueue);
      if (isShuffled) {
        const { shuffled, newCurrentIndex } = shuffleArray(newQueue, validIndex);
        setQueue(shuffled);
        setQueueIndex(newCurrentIndex);
      } else {
        setQueue(newQueue);
        setQueueIndex(validIndex);
      }
    } else {
      // Single track or existing queue
      const existingIdx = queue.findIndex(t => t.id === track.id);
      if (existingIdx >= 0) {
        setQueueIndex(existingIdx);
      } else {
        const updated = [track, ...queue];
        setQueue(updated);
        setOriginalQueue(updated);
        setQueueIndex(0);
      }
    }

    loadAndPlayTrack(track);
  }, [queue, isShuffled, loadAndPlayTrack]);

  // Next track
  const next = useCallback(() => {
    if (queue.length === 0) return;

    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      loadAndPlayTrack(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
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
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.warn);
    }
  }, [isPlaying, currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().catch(console.warn);
    }
  }, [currentTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
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
      }
      setIsShuffled(true);
    } else {
      // Restore original queue
      if (originalQueue.length > 0 && currentTrack) {
        setQueue(originalQueue);
        const idx = originalQueue.findIndex(t => t.id === currentTrack.id);
        setQueueIndex(idx >= 0 ? idx : 0);
      }
      setIsShuffled(false);
    }
  }, [isShuffled, queue, originalQueue, queueIndex, currentTrack]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
    setOriginalQueue(prev => [...prev, track]);
  }, []);

  const playNext = useCallback((track: Track) => {
    setQueue(prev => {
      const updated = [...prev];
      const insertAt = queueIndex >= 0 ? queueIndex + 1 : 0;
      updated.splice(insertAt, 0, track);
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
      return updated;
    });
    if (index < queueIndex) {
      setQueueIndex(prev => prev - 1);
    } else if (index === queueIndex && queue.length > 1) {
      // If removing current track, play next
      next();
    }
  }, [queueIndex, queue.length, next]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setOriginalQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setOriginalQueue([]);
      setQueueIndex(-1);
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
