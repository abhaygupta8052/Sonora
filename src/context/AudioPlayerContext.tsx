import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode } from '../api/types';
import { storage } from '../utils/storage';
import { useLibrary } from './LibraryContext';
import { resolvePlayable, isNeedsResolution, getDirectStreamUrl, preloadTrackAudio } from '../services/resolve';

export type SleepTimerOption = number | 'end-of-track' | null;

// 44-byte silent WAV PCM data URI to keep mobile/PWA audio session alive uninterrupted during track switches
export const SILENT_AUDIO = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

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

  // Sleep Timer & Audio Fade-Out
  sleepTimerOption: SleepTimerOption;
  sleepTimerRemaining: number | null; // in seconds
  isSleepTimerActive: boolean;
  fadeOutSeconds: number;
  setSleepTimer: (option: SleepTimerOption, fadeOutDuration?: number) => void;
  cancelSleepTimer: () => void;

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
  const baseVolumeRef = useRef<number>(storage.getVolume());

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

  // ── Sleep Timer & Fade Out State ─────────────────────────────────────────
  const [sleepTimerOption, setSleepTimerOption] = useState<SleepTimerOption>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [fadeOutSeconds, setFadeOutSeconds] = useState<number>(30);
  const sleepTimerEndTimeRef = useRef<number | null>(null);

  // Forward refs to prevent stale closures and race conditions in event listeners
  const currentTrackRef = useRef<Track | null>(currentTrack);
  const queueRef = useRef<Track[]>(queue);
  const queueIndexRef = useRef<number>(queueIndex);
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const nextRef = useRef<() => void>(() => {});
  const sleepTimerOptionRef = useRef<SleepTimerOption>(sleepTimerOption);
  const cancelSleepTimerRef = useRef<() => void>(() => {});
  const wakeLockRef = useRef<any>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const autoplayFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    sleepTimerOptionRef.current = sleepTimerOption;
  }, [sleepTimerOption]);

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

  // Request screen wake lock to keep screen responsive during music playback
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      } catch {
        // WakeLock request not permitted or unsupported
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch {
        // Ignore
      }
    }
  }, []);

  // Initialize audio element and restore persisted track if available
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.crossOrigin = 'anonymous';
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
      isTransitioningRef.current = false;
      requestWakeLock();
    };

    const handlePause = () => {
      // Do not treat brief pauses during active track transitions as user pause
      if (isTransitioningRef.current) return;
      setIsPlaying(false);
      releaseWakeLock();
      flushStateToStorage();
    };

    const handleEnded = () => {
      // 1. If sleep timer is set to finish current track, stop
      if (sleepTimerOptionRef.current === 'end-of-track') {
        audio.pause();
        setIsPlaying(false);
        cancelSleepTimerRef.current();
        return;
      }

      // 2. If repeat single track is active
      if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch((err) => console.warn('Single repeat replay failed', err));
        return;
      }

      // 3. Play next song in queue seamlessly (works in background & lock screen)
      nextRef.current();
    };

    const handleError = (e: Event) => {
      if (isTransitioningRef.current) return;
      console.warn('Audio playback error', e);
      setIsLoading(false);
      // Auto-skip to next track if queue has songs
      if (initialSeekDoneRef.current && queueRef.current.length > 1) {
        setPlaybackError('Unable to stream this track. Skipping to next...');
        setTimeout(() => {
          nextRef.current();
        }, 800);
      } else {
        setIsPlaying(false);
        releaseWakeLock();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Save state on tab close, page refresh, or PWA backgrounding
    const handlePageHide = () => {
      flushStateToStorage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushStateToStorage();
      } else if (document.visibilityState === 'visible' && isPlayingRef.current) {
        requestWakeLock();
      }
    };

    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      flushStateToStorage();
      audio.pause();
      releaseWakeLock();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flushStateToStorage, requestWakeLock, releaseWakeLock]);

  // Update volume and mute on audio element
  useEffect(() => {
    baseVolumeRef.current = volume;
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // ── Sleep Timer & Smooth Audio Fade-Out Engine ───────────────────────────
  const cancelSleepTimer = useCallback(() => {
    setSleepTimerOption(null);
    setSleepTimerRemaining(null);
    sleepTimerEndTimeRef.current = null;
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : baseVolumeRef.current;
    }
  }, [isMuted]);

  const setSleepTimer = useCallback((option: SleepTimerOption, fadeOutDur: number = 30) => {
    if (option === null) {
      cancelSleepTimer();
      return;
    }

    setSleepTimerOption(option);
    setFadeOutSeconds(fadeOutDur);

    if (typeof option === 'number') {
      const targetTime = Date.now() + option * 60 * 1000;
      sleepTimerEndTimeRef.current = targetTime;
      setSleepTimerRemaining(option * 60);
    } else if (option === 'end-of-track') {
      sleepTimerEndTimeRef.current = null;
      const rem = Math.max(0, Math.floor((duration || 0) - (currentTime || 0)));
      setSleepTimerRemaining(rem);
    }
  }, [cancelSleepTimer, duration, currentTime]);

  useEffect(() => {
    if (!sleepTimerOption) return;

    const timerInterval = setInterval(() => {
      let remainingSec = 0;

      if (typeof sleepTimerOption === 'number' && sleepTimerEndTimeRef.current) {
        remainingSec = Math.max(0, Math.ceil((sleepTimerEndTimeRef.current - Date.now()) / 1000));
      } else if (sleepTimerOption === 'end-of-track') {
        const audio = audioRef.current;
        if (audio && audio.duration) {
          remainingSec = Math.max(0, Math.floor(audio.duration - audio.currentTime));
        } else {
          remainingSec = Math.max(0, Math.floor(duration - currentTime));
        }
      }

      setSleepTimerRemaining(remainingSec);

      // Smooth Fade-Out Logic
      if (audioRef.current && !isMuted) {
        if (remainingSec <= fadeOutSeconds && remainingSec > 0) {
          const fadeRatio = remainingSec / fadeOutSeconds;
          // Exponential decay curve for natural perceived volume drop
          const fadedVolume = baseVolumeRef.current * Math.pow(fadeRatio, 1.25);
          audioRef.current.volume = Math.max(0, Math.min(baseVolumeRef.current, fadedVolume));
        } else if (remainingSec > fadeOutSeconds) {
          audioRef.current.volume = baseVolumeRef.current;
        }
      }

      // Timer reached 0 → pause audio and reset timer
      if (remainingSec <= 0) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.volume = baseVolumeRef.current;
        }
        setIsPlaying(false);
        cancelSleepTimer();
      }
    }, 500);

    return () => clearInterval(timerInterval);
  }, [sleepTimerOption, fadeOutSeconds, isMuted, duration, currentTime, cancelSleepTimer]);

  // Load and play a specific track (user interaction or direct selection)
  const loadAndPlayTrack = useCallback(async (track: Track, startTime = 0) => {
    if (!audioRef.current || !track) return;
    const audio = audioRef.current;

    setPlaybackError(null);
    setIsLoading(true);
    setCurrentTrack(track);
    currentTrackRef.current = track;
    addRecentlyPlayed(track);

    storage.setPlayerState({
      currentTrack: track,
      currentTime: startTime
    });

    const directStream = getDirectStreamUrl(track);
    if (directStream) {
      audio.loop = false;
      audio.src = directStream;
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
            isTransitioningRef.current = false;
          })
          .catch((err) => {
            isTransitioningRef.current = false;
            if (err.name !== 'AbortError') {
              console.warn('Playback initiation error:', err);
              setPlaybackError('Auto-play blocked or audio format unavailable. Press play to start.');
            }
            setIsLoading(false);
          });
      }
      return;
    }

    // 🛡️ Silent Audio Bridge: keep OS audio session alive while resolving stream
    audio.src = SILENT_AUDIO;
    audio.loop = true;
    audio.play().catch(() => {});

    try {
      const resolvedTrack = await resolvePlayable(track);
      if (resolvedTrack && resolvedTrack.id !== track.id) {
        setCurrentTrack(resolvedTrack);
        currentTrackRef.current = resolvedTrack;
      }

      const streamUrl = getDirectStreamUrl(resolvedTrack);
      if (streamUrl && audioRef.current) {
        audioRef.current.loop = false;
        audioRef.current.src = streamUrl;
        audioRef.current.load();
        if (startTime > 0) {
          try { audioRef.current.currentTime = startTime; } catch { /* ignore */ }
        }
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
              isTransitioningRef.current = false;
            })
            .catch((err) => {
              isTransitioningRef.current = false;
              if (err.name !== 'AbortError') {
                console.warn('Playback initiation error:', err);
                setPlaybackError('Auto-play blocked or audio format unavailable. Press play to start.');
              }
              setIsLoading(false);
            });
        }
      } else {
        setIsLoading(false);
        isTransitioningRef.current = false;
        setPlaybackError('Stream URL unavailable for this track.');
      }
    } catch {
      setIsLoading(false);
      isTransitioningRef.current = false;
      setPlaybackError('Failed to load audio stream.');
    }
  }, [addRecentlyPlayed]);

  // Main playback action
  const playTrack = useCallback((track: Track, newQueue?: Track[], index?: number) => {
    initialSeekDoneRef.current = true;
    if (newQueue && newQueue.length > 0) {
      const targetIdx = index !== undefined && index >= 0 ? index : newQueue.findIndex(t => t.id === track.id);
      const validIdx = targetIdx >= 0 ? targetIdx : 0;
      setQueue(newQueue);
      queueRef.current = newQueue;
      setOriginalQueue(newQueue);
      setQueueIndex(validIdx);
      queueIndexRef.current = validIdx;
      storage.setPlayerState({
        queue: newQueue,
        originalQueue: newQueue,
        queueIndex: validIdx
      });
    }
    loadAndPlayTrack(track, 0);
  }, [loadAndPlayTrack]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((e) => {
            if (e.name !== 'AbortError') {
              console.warn('Resume failed:', e);
            }
          });
      }
    }
  }, [isPlaying, currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && !isPlaying && currentTrack) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying, currentTrack]);

  // 🚀 Internal Next Track Handler with SYNCHRONOUS LOCK-SCREEN HANDOFF
  const playNextTrackInternal = useCallback(() => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (q.length === 0) return;

    if (repeatModeRef.current === 'one' && currentTrackRef.current) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    let nextIndex = idx + 1;
    if (nextIndex >= q.length) {
      if (repeatModeRef.current === 'all') {
        nextIndex = 0;
      } else {
        // Queue finished without repeat
        setIsPlaying(false);
        return;
      }
    }

    const nextTrack = q[nextIndex];
    if (!nextTrack || !audioRef.current) return;

    const audio = audioRef.current;
    isTransitioningRef.current = true;
    setQueueIndex(nextIndex);
    queueIndexRef.current = nextIndex;

    const directStream = getDirectStreamUrl(nextTrack);

    if (directStream) {
      // 🚀 SYNCHRONOUS HANDOFF: Executes immediately within audio 'ended' or lock-screen action
      audio.loop = false;
      audio.src = directStream;
      audio.currentTime = 0;
      setCurrentTrack(nextTrack);
      currentTrackRef.current = nextTrack;
      addRecentlyPlayed(nextTrack);
      storage.setPlayerState({
        currentTrack: nextTrack,
        queueIndex: nextIndex,
        currentTime: 0
      });

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
            isTransitioningRef.current = false;
          })
          .catch((err) => {
            isTransitioningRef.current = false;
            if (err.name !== 'AbortError') {
              console.warn('Sync autoplay error on lock screen:', err);
              setPlaybackError('Auto-play blocked or audio format unavailable. Press play to start.');
            }
          });
      } else {
        isTransitioningRef.current = false;
      }
    } else {
      // 🛡️ SILENT AUDIO BRIDGE: Keeps OS lock-screen audio session alive during async network resolution
      audio.src = SILENT_AUDIO;
      audio.loop = true;
      audio.play().catch(() => {});

      setIsLoading(true);
      setCurrentTrack(nextTrack);
      currentTrackRef.current = nextTrack;
      addRecentlyPlayed(nextTrack);

      resolvePlayable(nextTrack)
        .then((resolved) => {
          const resolvedStream = getDirectStreamUrl(resolved);
          if (resolvedStream && audioRef.current) {
            audioRef.current.loop = false;
            audioRef.current.src = resolvedStream;
            audioRef.current.currentTime = 0;
            audioRef.current.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
                isTransitioningRef.current = false;
              })
              .catch((err) => {
                isTransitioningRef.current = false;
                console.warn('Playback error after bridge:', err);
              });

            if (resolved.id !== nextTrack.id || resolved.streamUrl !== nextTrack.streamUrl) {
              setCurrentTrack(resolved);
              currentTrackRef.current = resolved;
              setQueue((prev) => prev.map((t, i) => (i === nextIndex ? { ...t, ...resolved } : t)));
            }
          } else {
            setIsLoading(false);
            isTransitioningRef.current = false;
            setPlaybackError('Stream URL unavailable for this track.');
          }
        })
        .catch(() => {
          setIsLoading(false);
          isTransitioningRef.current = false;
        });
    }
  }, [addRecentlyPlayed]);

  const next = useCallback(() => {
    playNextTrackInternal();
  }, [playNextTrackInternal]);

  const previous = useCallback(() => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (q.length === 0) return;

    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const prevIndex = idx - 1 >= 0 ? idx - 1 : q.length - 1;
    const prevTrack = q[prevIndex];
    if (prevTrack) {
      setQueueIndex(prevIndex);
      queueIndexRef.current = prevIndex;
      loadAndPlayTrack(prevTrack);
    }
  }, [loadAndPlayTrack]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  useEffect(() => {
    cancelSleepTimerRef.current = cancelSleepTimer;
  }, [cancelSleepTimer]);

  // ⚡ Proactively pre-resolve and pre-buffer upcoming tracks so lock-screen playback never stalls
  useEffect(() => {
    const q = queue;
    const idx = queueIndex;
    if (q.length === 0 || idx < 0) return;

    const nextIdx = idx + 1 < q.length ? idx + 1 : (repeatMode === 'all' ? 0 : -1);
    if (nextIdx >= 0 && q[nextIdx]) {
      const nextTrack = q[nextIdx];
      if (isNeedsResolution(nextTrack)) {
        resolvePlayable(nextTrack)
          .then((resolved) => {
            if (resolved && resolved.streamUrl && !isNeedsResolution(resolved)) {
              preloadTrackAudio(resolved.streamUrl);
              setQueue((prev) => prev.map((t, i) => (i === nextIdx ? { ...t, ...resolved } : t)));
              setOriginalQueue((prev) => prev.map((t) => (t.id === nextTrack.id ? { ...t, ...resolved } : t)));
            }
          })
          .catch(() => {});
      } else if (nextTrack.streamUrl) {
        preloadTrackAudio(nextTrack.streamUrl);
      }
    }

    // If approaching the end of queue and autoplay is enabled, pre-fetch recommended tracks BEFORE current song finishes
    if (storage.getAutoplay() && idx >= q.length - 2 && !autoplayFetchingRef.current) {
      autoplayFetchingRef.current = true;
      const last = q[q.length - 1];
      const genre = last?.genre || 'Bollywood';
      import('../api/musicApi')
        .then(({ musicApi }) => {
          musicApi.getTrending(genre).then((similar) => {
            autoplayFetchingRef.current = false;
            if (similar && similar.length > 0) {
              const currentQueue = queueRef.current;
              const added = similar.filter((st) => !currentQueue.some((qTrack) => qTrack.id === st.id));
              if (added.length > 0) {
                const updated = [...currentQueue, ...added];
                setQueue(updated);
                setOriginalQueue((prev) => [...prev, ...added]);
                storage.setPlayerState({ queue: updated });
              }
            }
          }).catch(() => { autoplayFetchingRef.current = false; });
        })
        .catch(() => { autoplayFetchingRef.current = false; });
    }
  }, [queue, queueIndex, repeatMode]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      storage.setPlayerState({ currentTime: time });
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clamped);
    baseVolumeRef.current = clamped;
    storage.setVolume(clamped);
    if (isMuted && clamped > 0) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    if (!isShuffled) {
      if (queue.length > 0 && queueIndex >= 0) {
        const { shuffled, newCurrentIndex } = shuffleArray(queue, queueIndex);
        setQueue(shuffled);
        setQueueIndex(newCurrentIndex);
        storage.setPlayerState({ queue: shuffled, queueIndex: newCurrentIndex, isShuffled: true });
      }
      setIsShuffled(true);
    } else {
      if (originalQueue.length > 0 && currentTrack) {
        setQueue(originalQueue);
        const idx = originalQueue.findIndex((t) => t.id === currentTrack.id);
        const validIdx = idx >= 0 ? idx : 0;
        setQueueIndex(validIdx);
        storage.setPlayerState({ queue: originalQueue, queueIndex: validIdx, isShuffled: false });
      }
      setIsShuffled(false);
    }
  }, [isShuffled, queue, originalQueue, queueIndex, currentTrack]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      let nextMode: RepeatMode = 'off';
      if (prev === 'off') nextMode = 'all';
      else if (prev === 'all') nextMode = 'one';
      else nextMode = 'off';

      storage.setPlayerState({ repeatMode: nextMode });
      return nextMode;
    });
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => {
      const updated = [...prev, track];
      storage.setPlayerState({ queue: updated });
      return updated;
    });
    setOriginalQueue((prev) => [...prev, track]);
  }, []);

  const playNext = useCallback((track: Track) => {
    setQueue((prev) => {
      const updated = [...prev];
      const insertAt = queueIndex >= 0 ? queueIndex + 1 : 0;
      updated.splice(insertAt, 0, track);
      storage.setPlayerState({ queue: updated });
      return updated;
    });
    setOriginalQueue((prev) => {
      const updated = [...prev];
      const insertAt = queueIndex >= 0 ? queueIndex + 1 : 0;
      updated.splice(insertAt, 0, track);
      return updated;
    });
  }, [queueIndex]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      storage.setPlayerState({ queue: updated });
      return updated;
    });
    if (index < queueIndex) {
      setQueueIndex((prev) => {
        const nextIdx = prev - 1;
        storage.setPlayerState({ queueIndex: nextIdx });
        return nextIdx;
      });
    } else if (index === queueIndex && queue.length > 1) {
      next();
    }
  }, [queueIndex, queue.length, next]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue((prev) => {
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
        sleepTimerOption,
        sleepTimerRemaining,
        isSleepTimerActive: sleepTimerOption !== null,
        fadeOutSeconds,
        setSleepTimer,
        cancelSleepTimer,
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
