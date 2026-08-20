import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/search/SearchBar';
import { SearchHistory } from '../components/search/SearchHistory';
import { musicApi } from '../api/musicApi';
import { SearchResults, Track } from '../api/types';
import { storage } from '../utils/storage';
import { useDebounce } from '../hooks/useDebounce';
import { SongRow } from '../components/cards/SongRow';
import { ArtistCard } from '../components/cards/ArtistCard';
import { AlbumCard } from '../components/cards/AlbumCard';
import { PlaylistCard } from '../components/cards/PlaylistCard';
import { SongRowSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import { MOODS, detectMood, getMoodById, MoodDefinition } from '../utils/moodData';
import {
  Search as SearchIcon,
  Music,
  User,
  Disc,
  ListMusic,
  Flame,
  Sparkles,
  Smile,
  Compass
} from 'lucide-react';

type FilterTab = 'trending' | 'moods' | 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

const TRENDING_CATEGORIES = [
  { id: 'all', label: 'All Hits', query: 'Hindi Hits' },
  { id: 'hindi', label: 'Bollywood', query: 'Hindi Hits' },
  { id: 'bhojpuri', label: 'Bhojpuri', query: 'Bhojpuri Songs' },
  { id: 'punjabi', label: 'Punjabi', query: 'Punjabi Hits' },
  { id: 'haryanvi', label: 'Haryanvi', query: 'Haryanvi Hits' },
  { id: 'rapper', label: 'Desi Rap', query: 'Desi Hip Hop' },
  { id: 'love', label: 'Love Songs', query: 'Romantic Hindi' },
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialMoodId = searchParams.get('mood') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterTab>(
    initialMoodId ? 'moods' : initialQuery.trim() ? 'all' : 'trending'
  );
  const [trendingSubCategory, setTrendingSubCategory] = useState('all');
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  // Selected mood state
  const [selectedMood, setSelectedMood] = useState<MoodDefinition | null>(() => {
    if (initialMoodId) return getMoodById(initialMoodId) || null;
    if (initialQuery) return detectMood(initialQuery);
    return null;
  });

  const [results, setResults] = useState<SearchResults>({
    tracks: [],
    artists: [],
    albums: [],
    playlists: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(() => storage.getSearchHistory());
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Load trending tracks when trending tab or subcategory changes
  useEffect(() => {
    let mounted = true;
    const loadTrendingSongs = async () => {
      setIsTrendingLoading(true);
      try {
        const cat = TRENDING_CATEGORIES.find((c) => c.id === trendingSubCategory);
        const queryStr = cat ? cat.query : 'Hindi Hits';
        const tracks = await musicApi.getTrending(queryStr);
        if (mounted) {
          setTrendingTracks(tracks);
        }
      } catch (err) {
        console.error('Failed to load trending songs in search', err);
      } finally {
        if (mounted) setIsTrendingLoading(false);
      }
    };

    loadTrendingSongs();
    return () => {
      mounted = false;
    };
  }, [trendingSubCategory]);

  // Sync search parameters from URL
  useEffect(() => {
    const q = searchParams.get('q');
    const moodParam = searchParams.get('mood');

    if (moodParam) {
      const mood = getMoodById(moodParam);
      if (mood) {
        setSelectedMood(mood);
        setQuery(mood.name);
        setActiveFilter('all');
        return;
      }
    }

    if (q !== null && q !== query) {
      setQuery(q);
      const detected = detectMood(q);
      setSelectedMood(detected);
      if (q.trim()) {
        setActiveFilter('all');
      }
    }
  }, [searchParams]);

  // Perform search when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ tracks: [], artists: [], albums: [], playlists: [] });
      setIsLoading(false);
      setSelectedMood(null);
      return;
    }

    // Detect mood from debounced query
    const detected = detectMood(debouncedQuery);
    setSelectedMood(detected);

    // Auto-switch to 'all' if currently on trending or moods
    setActiveFilter((prev) => (prev === 'trending' || prev === 'moods' ? 'all' : prev));

    let mounted = true;
    const performSearch = async () => {
      setIsLoading(true);
      try {
        const data = await musicApi.search(debouncedQuery);
        if (mounted) {
          setResults(data);
          storage.addSearchHistory(debouncedQuery);
          setHistory(storage.getSearchHistory());
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    performSearch();
    return () => {
      mounted = false;
    };
  }, [debouncedQuery]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const detected = detectMood(val);
    setSelectedMood(detected);

    if (val.trim()) {
      setSearchParams({ q: val }, { replace: true });
      setActiveFilter('all');
    } else {
      setSearchParams({}, { replace: true });
      setActiveFilter('trending');
    }
  };

  const handleSelectMood = (mood: MoodDefinition) => {
    setSelectedMood(mood);
    setQuery(mood.name);
    setSearchParams({ q: mood.name, mood: mood.id }, { replace: true });
    setActiveFilter('all');
  };

  const handleSelectChip = (chipQuery: string) => {
    handleQueryChange(chipQuery);
  };

  const handleRemoveHistory = (historyItem: string) => {
    storage.removeSearchHistoryItem(historyItem);
    setHistory(storage.getSearchHistory());
  };

  const handleClearHistory = () => {
    storage.clearSearchHistory();
    setHistory([]);
  };

  const hasAnyResults =
    results.tracks.length > 0 ||
    results.artists.length > 0 ||
    results.albums.length > 0 ||
    results.playlists.length > 0;

  const isQueryActive = query.trim().length > 0;

  const filterTabs: { id: FilterTab; label: string; icon: any }[] = [
    { id: 'trending', label: '🔥 Trending', icon: Flame },
    { id: 'moods', label: '🎭 Moods & Vibes', icon: Smile },
    ...(isQueryActive
      ? [
          { id: 'all' as FilterTab, label: 'All Results', icon: SearchIcon },
          { id: 'songs' as FilterTab, label: `Songs (${results.tracks.length})`, icon: Music },
          { id: 'artists' as FilterTab, label: `Artists (${results.artists.length})`, icon: User },
          { id: 'albums' as FilterTab, label: `Albums (${results.albums.length})`, icon: Disc },
          { id: 'playlists' as FilterTab, label: `Playlists (${results.playlists.length})`, icon: ListMusic },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header */}
      <div className="max-w-4xl space-y-3.5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Search & Mood Discovery</span>
            <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search by artist, title, or your current <strong>mood & emotion</strong> (e.g. <em>'sad mood', 'romantic vibe', 'gym workout', 'sukoon chill', 'baarish'</em>).
          </p>
        </div>

        {/* Search Bar Input */}
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          onSearchSubmit={handleQueryChange}
          isLoading={isLoading}
          placeholder="Search songs, artists, or mood (e.g. 'sad mood', 'romantic vibe', 'gym workout')..."
          autoFocus={!initialQuery}
        />

        {/* Mood Quick Pills (Instant 1-click vibe discovery) */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Smile className="w-3.5 h-3.5 text-brand-500" />
              <span>Moods:</span>
            </span>
            {MOODS.map((m) => {
              const isMoodActive = selectedMood?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelectMood(m)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isMoodActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 scale-105'
                      : 'bg-slate-100 dark:bg-dark-card hover:bg-brand-500/10 hover:text-brand-500 dark:hover:text-brand-400 border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.name.split('&')[0].trim()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!query && (
          <SearchHistory
            history={history}
            onSelect={handleSelectChip}
            onRemove={handleRemoveHistory}
            onClear={handleClearHistory}
          />
        )}
      </div>

      {/* Main Tabs (Trending, Moods, and Active Search result categories) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-border pb-3 overflow-x-auto scrollbar-none">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'bg-white dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* DETECTED MOOD BANNER (Appears when a mood is matched or selected)          */}
      {/* ========================================================================= */}
      {selectedMood && activeFilter !== 'trending' && activeFilter !== 'moods' && (
        <div
          className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white border shadow-xl bg-gradient-to-r ${selectedMood.gradient} transition-all duration-300`}
          style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}
        >
          <div
            className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40"
            style={{ backgroundColor: selectedMood.color }}
          />

          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">{selectedMood.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                      Mood Detected
                    </span>
                    <span className="text-xs text-white/80 font-medium">
                      {selectedMood.hindiName}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    {selectedMood.name}
                  </h3>
                </div>
              </div>

              <span className="text-xs font-semibold text-white/70 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                320kbps Mood Match
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              {selectedMood.description}
            </p>

            {/* Quick Mood Sub-tags for instant query tweaking */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 scrollbar-none">
              <span className="text-[11px] font-bold text-white/75 shrink-0">Try variations:</span>
              {selectedMood.alternativeQueries.map((alt) => (
                <button
                  key={alt}
                  onClick={() => handleQueryChange(alt)}
                  className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white whitespace-nowrap transition-all"
                >
                  {alt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TRENDING TAB VIEW (Shows Trending Songs with Sub-category Switcher)     */}
      {/* ========================================================================= */}
      {activeFilter === 'trending' && (
        <div className="space-y-6 animate-fade-in">
          {/* Trending Sub-category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TRENDING_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setTrendingSubCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  trendingSubCategory === cat.id
                    ? 'bg-brand-500/20 text-brand-500 border border-brand-500/40 font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Trending Songs ({TRENDING_CATEGORIES.find((c) => c.id === trendingSubCategory)?.label || 'Hits'})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              320kbps Audio
            </span>
          </div>

          {/* Trending Songs List */}
          {isTrendingLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <SongRowSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-dark-border/60 shadow-sm">
              {trendingTracks.map((track, i) => (
                <SongRow
                  key={`trending-row-${track.id}-${i}`}
                  track={track}
                  index={i + 1}
                  queueContext={trendingTracks}
                  onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MOODS & VIBES TAB VIEW (Full Mood Stations Grid)                       */}
      {/* ========================================================================= */}
      {activeFilter === 'moods' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-brand-500" />
              <span>Explore Songs by Mood & Emotion</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select any mood below to instantly listen to curated, heartfelt music matching your current feelings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MOODS.map((m) => (
              <div
                key={m.id}
                onClick={() => handleSelectMood(m)}
                className={`group relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ${m.gradient} text-white cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 select-none border border-white/10 flex flex-col justify-between min-h-[140px]`}
              >
                <div
                  className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40"
                  style={{ backgroundColor: m.color }}
                />

                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-xs text-white/80 font-medium">{m.hindiName}</span>
                    </div>
                    <h4 className="text-lg font-black text-white mt-1 group-hover:text-brand-200 transition-colors">
                      {m.name}
                    </h4>
                  </div>
                </div>

                <div className="relative z-10 pt-3 flex items-center justify-between">
                  <p className="text-xs text-white/75 line-clamp-1">
                    {m.subtitle}
                  </p>
                  <span className="text-xs font-bold text-white group-hover:translate-x-1 transition-transform ml-2 shrink-0">
                    Play →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SEARCH QUERY RESULTS VIEW                                              */}
      {/* ========================================================================= */}
      {activeFilter !== 'trending' && activeFilter !== 'moods' && (
        <>
          {/* Loading Skeletons */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SongRowSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State: No results found */}
          {query && !isLoading && !hasAnyResults && (
            <div className="py-12">
              <EmptyState
                icon={Music}
                title="No matches found"
                description={`We couldn't find anything matching "${query}". Try searching for a mood like 'sad mood', 'romantic', 'chill vibe', or explore the Moods & Vibes tab.`}
              />
            </div>
          )}

          {/* Search Results Display */}
          {query && !isLoading && hasAnyResults && (
            <div className="space-y-8">
              {/* Songs Section */}
              {(activeFilter === 'all' || activeFilter === 'songs') && results.tracks.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Songs ({results.tracks.length})</span>
                      {selectedMood && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-semibold">
                          {selectedMood.emoji} {selectedMood.name}
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">320kbps High Quality</span>
                  </div>

                  <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-dark-border/60 shadow-sm">
                    {results.tracks.slice(0, activeFilter === 'all' ? 15 : 50).map((track, i) => (
                      <SongRow
                        key={`search-song-${track.id}-${i}`}
                        track={track}
                        index={i + 1}
                        queueContext={results.tracks}
                        onOpenPlaylistModal={(t) => setSelectedTrackForPlaylist(t)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Artists Section */}
              {(activeFilter === 'all' || activeFilter === 'artists') && results.artists.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                    Artists
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {results.artists.slice(0, activeFilter === 'all' ? 6 : 18).map((artist) => (
                      <ArtistCard key={`search-artist-${artist.id}`} artist={artist} />
                    ))}
                  </div>
                </section>
              )}

              {/* Albums Section */}
              {(activeFilter === 'all' || activeFilter === 'albums') && results.albums.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                    Albums
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {results.albums.slice(0, activeFilter === 'all' ? 6 : 18).map((album) => (
                      <AlbumCard key={`search-album-${album.id}`} album={album} />
                    ))}
                  </div>
                </section>
              )}

              {/* Playlists Section */}
              {(activeFilter === 'all' || activeFilter === 'playlists') && results.playlists.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                    Playlists
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {results.playlists.slice(0, activeFilter === 'all' ? 6 : 18).map((playlist) => (
                      <PlaylistCard key={`search-playlist-${playlist.id}`} playlist={playlist} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        track={selectedTrackForPlaylist}
        isOpen={!!selectedTrackForPlaylist}
        onClose={() => setSelectedTrackForPlaylist(null)}
      />
    </div>
  );
};
