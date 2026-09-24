import { useEffect, useRef } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

export function useMediaSession() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    pause,
    resume,
    next,
    previous,
    seek
  } = useAudioPlayer();

  const currentTrackRef = useRef(currentTrack);
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const togglePlayPauseRef = useRef(togglePlayPause);
  const pauseRef = useRef(pause);
  const resumeRef = useRef(resume);
  const nextRef = useRef(next);
  const previousRef = useRef(previous);
  const seekRef = useRef(seek);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
    isPlayingRef.current = isPlaying;
    currentTimeRef.current = currentTime;
    durationRef.current = duration;
    togglePlayPauseRef.current = togglePlayPause;
    pauseRef.current = pause;
    resumeRef.current = resume;
    nextRef.current = next;
    previousRef.current = previous;
    seekRef.current = seek;
  }, [currentTrack, isPlaying, currentTime, duration, togglePlayPause, pause, resume, next, previous, seek]);

  // 1. Update MediaMetadata when currentTrack changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    try {
      const artworkUrl = currentTrack.artwork || '/icons/icon-512.png';
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Sonora Music',
        artist: currentTrack.artist || 'Unknown Artist',
        album: currentTrack.album || 'Sonora Streaming',
        artwork: [
          { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });
    } catch (err) {
      console.warn('Failed to update MediaSession metadata', err);
    }
  }, [currentTrack]);

  // 2. Register MediaSession Action Handlers once
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play', () => {
        resumeRef.current();
      }],
      ['pause', () => {
        pauseRef.current();
      }],
      ['previoustrack', () => {
        previousRef.current();
      }],
      ['nexttrack', () => {
        nextRef.current();
      }],
      ['seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seekRef.current(details.seekTime);
        }
      }],
      ['seekbackward', (details) => {
        const skip = details.seekOffset || 10;
        seekRef.current(Math.max(0, currentTimeRef.current - skip));
      }],
      ['seekforward', (details) => {
        const skip = details.seekOffset || 10;
        const dur = durationRef.current || 99999;
        seekRef.current(Math.min(dur, currentTimeRef.current + skip));
      }],
      ['stop', () => {
        pauseRef.current();
      }]
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some actions may not be supported by all browsers
      }
    });

    return () => {
      actionHandlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore
        }
      });
    };
  }, []);

  // 3. Keep playbackState updated in real-time
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      if (!currentTrack) {
        navigator.mediaSession.playbackState = 'none';
      } else {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      }
    } catch (e) {
      console.warn('Failed to set MediaSession playbackState', e);
    }
  }, [isPlaying, currentTrack]);

  // 4. Update Position State on lock screen / notification scrubber
  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
    if (!currentTrack || duration <= 0) return;

    try {
      const safeDuration = Math.max(duration, 0.1);
      const safePosition = Math.min(Math.max(currentTime, 0), safeDuration);

      navigator.mediaSession.setPositionState({
        duration: safeDuration,
        playbackRate: isPlaying ? 1.0 : 0.0,
        position: safePosition
      });
    } catch {
      // Ignore position state sync frequency errors
    }
  }, [currentTime, duration, isPlaying, currentTrack]);
}
