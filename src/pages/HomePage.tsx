import React, { useEffect, useState } from 'react';
import { musicApi } from '../api/musicApi';
import { Track, Playlist, Artist } from '../api/types';
import { CURATED_GENRES, CURATED_PLAYLISTS, FEATURED_ARTISTS } from '../api/curatedData';
import { SongCard } from '../components/cards/SongCard';
import { ArtistCard } from '../components/cards/ArtistCard';
import { PlaylistCard } from '../components/cards/PlaylistCard';
import { SongCardSkeleton } from '../components/common/Skeleton';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useLibrary } from '../context/LibraryContext';
import {
  Play,
  Sparkles,
  Flame,
  Radio,
  Zap,
  Coffee,
  Music,
  Heart,
  ChevronRight,
  Disc3,
  Mic2,
  Trophy,
  PartyPopper,
  History,
  Clock,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrendingSectionConfig {
  id: string;
  name: string;
  query: string;
  icon: any;
  gradient: string;
  badge: string;
  subtitle: string;
}

const TRENDING_SECTIONS: TrendingSectionConfig[] = [
  {
    id: 'hindi',
    name: 'Trending Hindi & Bollywood',
    query: 'Hindi Hits',
    icon: Flame,
    gradient: 'from-rose-500 to-red-700',
    badge: '🎬 Bollywood',
    subtitle: 'Top chartbusters, viral reels & Bollywood melodies'
  },
  {
    id: 'bhojpuri',
    name: 'Bhojpuri Superhits',
    query: 'Bhojpuri Songs',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-700',
    badge: '⚡ Bhojpuri Tadka',
    subtitle: 'Pawan Singh, Khesari Lal, Shilpi Raj & Top Bhojpuri Stars'
  },
  {
    id: 'arkesta',
    name: 'Arkesta Dance & Stage Hits',
    query: 'Arkestra',
    icon: PartyPopper,
    gradient: 'from-pink-500 to-fuchsia-700',
    badge: '🎪 Arkesta Special',
    subtitle: 'High-voltage DJ beats & party stage dance anthems'
  },
  {
    id: 'punjabi',
    name: 'Punjabi Swag & Bass',
    query: 'Punjabi Hits',
    icon: Radio,
    gradient: 'from-purple-600 to-indigo-800',
    badge: '🏎️ Punjabi Swag',
    subtitle: 'Sidhu Moosewala, AP Dhillon, Karan Aujla, Diljit Dosanjh'
  },
  {
    id: 'haryanvi',
    name: 'Haryanvi Top Beats',
    query: 'Haryanvi Hits',
    icon: Disc3,
    gradient: 'from-emerald-500 to-teal-700',
    badge: '🚜 Haryanvi Ragni',
    subtitle: 'Sapna Choudhary, Renuka Panwar, Gulzaar Chhaniwala'
  },
  {
    id: 'rapper',
    name: 'Desi Rap & Hip-Hop',
    query: 'Desi Hip Hop',
    icon: Mic2,
    gradient: 'from-cyan-500 to-blue-700',
    badge: '🎤 Desi Hip-Hop',
    subtitle: 'Divine, MC Stan, King, Raftaar, Emiway Bantai & Underground Rap'
  },
  {
    id: 'love',
    name: 'Love & Romantic Melodies',
    query: 'Romantic Hindi',
    icon: Heart,
    gradient: 'from-rose-600 to-pink-700',
    badge: '❤️ Love & Soul',
    subtitle: 'Soulful, heartfelt acoustic & romantic ballads'
  }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { playTrack, currentTrack } = useAudioPlayer();
  const { recentlyPlayed } = useLibrary();

  const [activeFilter, setActiveFilter] = useState('all');
  const [featuredTrack, setFeaturedTrack] = useState<Track | null>(null);
  const [sectionTracks, setSectionTracks] = useState<Record<string, Track[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadAllTrendingSections = async () => {
      setIsLoading(true);
      try {
        const promises = TRENDING_SECTIONS.map(async (sec) => {
          const tracks = await musicApi.getTrending(sec.query);
          return { id: sec.id, tracks };
        });

        const results = await Promise.all(promises);
        if (mounted) {
          const trackMap: Record<string, Track[]> = {};
          results.forEach((r) => {
            trackMap[r.id] = r.tracks;
          });
          setSectionTracks(trackMap);

          // Set hero track
          if (trackMap['hindi'] && trackMap['hindi'].length > 0) {
            setFeaturedTrack(trackMap['hindi'][0]);
          } else if (results[0]?.tracks[0]) {
            setFeaturedTrack(results[0].tracks[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load trending music', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadAllTrendingSections();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleSections =
    activeFilter === 'all'
      ? TRENDING_SECTIONS
      : TRENDING_SECTIONS.filter((s) => s.id === activeFilter);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Category Pills Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sticky top-16 z-20 bg-slate-50/90 dark:bg-dark-bg/90 backdrop-blur-md py-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-105'
              : 'bg-white dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>🔥 All Trending</span>
        </button>

        {TRENDING_SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveFilter(sec.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === sec.id
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-105'
                : 'bg-white dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {sec.badge}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP SECTION: RECENTLY PLAYED / LISTENING HISTORY                       */}
      {/* ========================================================================= */}
      {recentlyPlayed.length > 0 && activeFilter === 'all' && (
        <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-brand-950/40 via-purple-950/20 to-slate-900/40 border border-brand-500/20 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Recently Played History</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-bold">
                    {recentlyPlayed.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Jump back into your recent music streams
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/library?tab=history')}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>View Full History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {recentlyPlayed.slice(0, 6).map((track) => (
              <SongCard
                key={`top-recent-${track.id}`}
                track={track}
                queueContext={recentlyPlayed}
                onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Hero Featured Stream Banner */}
      {featuredTrack ? (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 lg:p-10 border border-brand-500/20 shadow-2xl">
          <div
            className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl pointer-events-none"
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trending Hit</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {featuredTrack.title}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base line-clamp-2">
                By <strong className="text-white">{featuredTrack.artist}</strong> {featuredTrack.album && `• ${featuredTrack.album}`}
              </p>
              <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
                <button
                  onClick={() => playTrack(featuredTrack, sectionTracks['hindi'] || [featuredTrack], 0)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-slate-950 font-bold text-sm shadow-xl hover:bg-brand-50 hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                  <span>Listen Now</span>
                </button>
              </div>
            </div>

            <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 shrink-0 bg-slate-800">
              <img
                src={featuredTrack.artwork}
                alt={featuredTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* Dedicated Trending Sections */}
      {visibleSections.map((sec) => {
        const Icon = sec.icon;
        const tracks = sectionTracks[sec.id] || [];

        return (
          <section key={sec.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl bg-gradient-to-tr ${sec.gradient} text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {sec.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {sec.subtitle}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/search?q=${encodeURIComponent(sec.query)}`)}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                <span>See All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {isLoading || tracks.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SongCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tracks.slice(0, 6).map((track) => (
                  <SongCard
                    key={`${sec.id}-${track.id}`}
                    track={track}
                    queueContext={tracks}
                    onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Featured Artists */}
      {activeFilter === 'all' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Featured Artists
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top trending singers & music icons
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURED_ARTISTS.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>
      )}

      {/* Moods & Genres Stations */}
      {activeFilter === 'all' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Explore Moods & Stations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Find music tailored for any vibe
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CURATED_GENRES.map((genre) => (
              <div
                key={genre.id}
                onClick={() => navigate(`/search?q=${encodeURIComponent(genre.query)}`)}
                className={`group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${genre.gradient} text-white cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 select-none min-h-[100px] flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base sm:text-lg">{genre.name}</span>
                  <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                    <Music className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[11px] text-white/80 font-medium group-hover:underline">
                  Play station →
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Curated Playlists */}
      {activeFilter === 'all' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Featured Playlists
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Handcrafted soundscapes for every mood
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CURATED_PLAYLISTS.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        </section>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
