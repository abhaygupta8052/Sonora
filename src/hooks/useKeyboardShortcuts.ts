import { useEffect } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useLibrary } from '../context/LibraryContext';

export function useKeyboardShortcuts() {
  const {
    currentTrack,
    togglePlayPause,
    next,
    previous,
    seek,
    currentTime,
    duration,
    toggleMute
  } = useAudioPlayer();
  const { toggleFavorite } = useLibrary();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if the user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 5));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyL':
          if (currentTrack) {
            e.preventDefault();
            toggleFavorite(currentTrack);
          }
          break;
        case 'KeyJ':
          e.preventDefault();
          previous();
          break;
        case 'KeyK':
          e.preventDefault();
          next();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, togglePlayPause, next, previous, seek, currentTime, duration, toggleMute, toggleFavorite]);
}
