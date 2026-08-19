import React, { useState, useEffect } from 'react';
import { musicApi } from '../api/musicApi';
import { Track } from '../api/types';
import { SongRow } from '../components/cards/SongRow';
import { SongRowSkeleton } from '../components/common/Skeleton';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import {
  Play,
  Shuffle
} from 'lucide-react';

interface TrendingTabOption {
  id: string;
  label: string;
  query: string;
  description: string;
}

const TRENDING_TABS: TrendingTabOption[] = [
  {
    id: 'all',
    label: 'All Trending',
    query: 'Top Bollywood Hindi Hits 2024',
    description: 'The overall top trending songs across India & global charts'
  },
  {
    id: 'hindi',
    label: 'Bollywood & Hindi',
    query: 'Hindi Hits',
    description: 'Blockbuster Bollywood cinema tracks, viral reels & top Hindi hits'
  },
  {
    id: 'bhojpuri',
    label: 'Bhojpuri Superhits',
    query: 'Bhojpuri Songs',
    description: 'Pawan Singh, Khesari Lal, Shilpi Raj & high energy Bhojpuri songs'
  },
  {
    id: 'punjabi',
    label: 'Punjabi Hits',
    query: 'Punjabi Hits',
    description: 'Sidhu Moosewala, AP Dhillon, Karan Aujla, Diljit Dosanjh & Desi trap'
  },
  {
    id: 'haryanvi',
    label: 'Haryanvi Hits',
    query: 'Haryanvi Hits',
    description: 'Sapna Choudhary, Renuka Panwar, Gulzaar Chhaniwala top bangers'
  },
  {
    id: 'rapper',
    label: 'Desi Rap & Hip-Hop',
    query: 'Desi Hip Hop',
    description: 'Divine, MC Stan, King, Raftaar, Emiway Bantai & underground rap'
  },
  {
    id: 'love',
    label: 'Romantic & Love',
    query: 'Romantic Hindi',
    description: 'Soulful love songs, acoustic ballads, Arijit Singh & romantic hits'
  }
];

export const TrendingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  const { playTrack } = useAudioPlayer();

  const currentTabInfo = TRENDING_TABS.find((t) => t.id === activeTab) || TRENDING_TABS[0];

  useEffect(() => {
    let mounted = true;
    const fetchTrendingTracks = async () => {
      setIsLoading(true);
      try {
        const fetchedTracks = await musicApi.getTrending(currentTabInfo.query);
        if (mounted) {
          setTracks(fetchedTracks);
        }
      } catch (err) {
        console.error('Failed to load trending page tracks', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchTrendingTracks();
    return () => {
      mounted = false;
    };
  }, [activeTab, currentTabInfo.query]);

  const handlePlayAll = (shuffle: boolean = false) => {
    if (tracks.length === 0) return;
    const startIndex = shuffle ? Math.floor(Math.random() * tracks.length) : 0;
    playTrack(tracks[startIndex], tracks, startIndex);
  };

  const topTrack = tracks[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-brand-950 to-indigo-950 text-white p-6 sm:p-8 lg:p-10 border border-rose-500/20 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <span>Trending Charts</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {currentTabInfo.label}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm">
              {currentTabInfo.description}
            </p>

            {/* Action buttons */}
            {tracks.length > 0 && (
              <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
                <button
                  onClick={() => handlePlayAll(false)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                  <span>Play All ({tracks.length})</span>
                </button>
                <button
                  onClick={() => handlePlayAll(true)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                  title="Shuffle Trending"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {topTrack && (
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 shrink-0 bg-slate-900">
              <img
                src={topTrack.artwork}
                alt={topTrack.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-rose-400">
                #1 Trend
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sticky top-16 z-20 bg-slate-50/90 dark:bg-dark-bg/90 backdrop-blur-md py-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
        {TRENDING_TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                  : 'bg-white dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Track List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Top Ranked Songs
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            320kbps High Fidelity
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <SongRowSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
            {tracks.map((track, i) => (
              <SongRow
                key={`trending-page-track-${track.id}-${i}`}
                track={track}
                index={i + 1}
                queueContext={tracks}
                onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
