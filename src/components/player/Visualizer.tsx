import React from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  isPlaying,
  barCount = 4,
  className = ''
}) => {
  return (
    <div className={`flex items-end gap-1 h-5 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => {
        const delays = [0, 200, 400, 150, 350, 250];
        const delay = delays[i % delays.length];
        return (
          <span
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-300 ${
              isPlaying ? 'animate-equalizer' : 'h-1 opacity-50'
            }`}
            style={{
              animationDelay: `${delay}ms`,
              animationDuration: `${0.8 + (i * 0.15)}s`
            }}
          />
        );
      })}
    </div>
  );
};
