import { useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

export function useMediaSession() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    next,
    previous,
    seek
  } = useAudioPlayer();

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    // Update metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || 'Single',
      artwork: [
        {
          src: currentTrack.artwork,
          sizes: '512x512',
          type: 'image/jpeg'
        }
      ]
    });

    // Action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      togglePlayPause();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      togglePlayPause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      previous();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      next();
    });

    try {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seek(details.seekTime);
        }
      });
    } catch {
      // seekto may not be supported in older browsers
    }

    // Playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Position state
    if ('setPositionState' in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(duration, 0),
          playbackRate: 1.0,
          position: Math.min(Math.max(currentTime, 0), duration)
        });
      } catch (e) {
        // Ignore position state sync issues
      }
    }
  }, [currentTrack, isPlaying, currentTime, duration, togglePlayPause, next, previous, seek]);
}
