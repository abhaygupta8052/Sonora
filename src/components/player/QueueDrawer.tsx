import React from 'react';
import { X, Trash2, ChevronUp, ChevronDown, ListMusic } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { formatDuration } from '../../utils/formatters';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueDrawerOpen,
    setIsQueueDrawerOpen,
    queue,
    queueIndex,
    currentTrack,
    playTrack,
    removeFromQueue,
    reorderQueue,
    clearQueue
  } = useAudioPlayer();

  if (!isQueueDrawerOpen) return null;

  const upNextTracks = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setIsQueueDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <aside className="relative z-10 w-full max-w-md h-full bg-white dark:bg-[#111726] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Playback Queue ({queue.length})
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {queue.length > 1 && (
              <button
                onClick={clearQueue}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Clear queue"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={() => setIsQueueDrawerOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close queue"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Now Playing */}
          {currentTrack && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-500 mb-2">
                Now Playing
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                <img
                  src={currentTrack.artwork}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-brand-600 dark:text-brand-400 truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentTrack.artist}
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {formatDuration(currentTrack.duration)}
                </span>
              </div>
            </div>
          )}

          {/* Up Next */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Up Next ({upNextTracks.length})
            </p>

            {upNextTracks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                Queue is empty. Add songs to play next!
              </p>
            ) : (
              <div className="space-y-1.5">
                {upNextTracks.map((track, i) => {
                  const actualIndex = queueIndex + 1 + i;
                  return (
                    <div
                      key={`${track.id}-${actualIndex}`}
                      className="group flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div
                        onClick={() => playTrack(track, queue, actualIndex)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        <img
                          src={track.artwork}
                          alt={track.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-500 transition-colors">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      {/* Controls: Reorder up/down & Remove */}
                      <div className="flex items-center gap-1 shrink-0">
                        {i > 0 && (
                          <button
                            onClick={() => reorderQueue(actualIndex, actualIndex - 1)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title="Move up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {i < upNextTracks.length - 1 && (
                          <button
                            onClick={() => reorderQueue(actualIndex, actualIndex + 1)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title="Move down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => removeFromQueue(actualIndex)}
                          className="p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove from queue"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
