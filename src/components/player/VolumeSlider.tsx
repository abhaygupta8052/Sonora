import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';

export const VolumeSlider: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { volume, isMuted, setVolume, toggleMute } = useAudioPlayer();

  const effectiveVolume = isMuted ? 0 : volume;

  const getVolumeIcon = () => {
    if (isMuted || effectiveVolume === 0) return VolumeX;
    if (effectiveVolume < 0.5) return Volume1;
    return Volume2;
  };

  const Icon = getVolumeIcon();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleMute}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <Icon className="w-4 h-4" />
      </button>

      <div className="relative flex items-center w-24 h-5 group">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effectiveVolume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:h-1.5 transition-all"
          aria-label="Volume slider"
        />
      </div>
    </div>
  );
};
