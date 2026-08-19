import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/search/SearchBar';
import { SearchHistory } from '../components/search/SearchHistory';
import { musicApi } from '../api/musicApi';
import { SearchResults, Track } from '../api/types';
import { storage } from '../utils/storage';
import { useDebounce } from '../hooks/useDebounce';
import { SongRow } from '../components/cards/SongRow';
import { SongCard } from '../components/cards/SongCard';
import { ArtistCard } from '../components/cards/ArtistCard';
import { AlbumCard } from '../components/cards/AlbumCard';
import { PlaylistCard } from '../components/cards/PlaylistCard';
import { SongRowSkeleton, SongCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { AddToPlaylistModal } from '../components/common/AddToPlaylistModal';
import {
  Search as SearchIcon,
  Music,
  User,
  Disc,
  ListMusic,
  Flame,
  Zap,
  Radio,
  Disc3,
  Mic2,
  Heart,
  PartyPopper,
  TrendingUp,
  Sparkles
} from 'lucide-react';

type FilterTab = 'trending' | 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

const TRENDING_CATEGORIES = [
  { id: 'all', label: '🔥 All Hits', query: 'Hindi Hits' },
  { id: 'hindi', label: '🎬 Bollywood', query: 'Hindi Hits' },
  { id: 'bhojpuri', label: '⚡ Bhojpuri', query: 'Bhojpuri Songs' },
  { id: 'arkesta', label: '🎪 Arkesta', query: 'Arkestra' },
  { id: 'punjabi', label: '🏎️ Punjabi', query: 'Punjabi Hits' },
  { id: 'haryanvi', label: '🚜 Haryanvi', query: 'Haryanvi Hits' },
  { id: 'rapper', label: '🎤 Desi Rap', query: 'Desi Hip Hop' },
  { id: 'love', label: '❤️ Love Songs', query: 'Romantic Hindi' },
];

const QUICK_TRENDING_CHIPS = [
  'Bom Diggy',
  'Kesariya',
  'Pawan Singh Bhojpuri',
  'Arkestra Ka Gana',
  'Sidhu Moosewala',
  'Sapna Choudhary',
  'MC Stan Divine',
  'Arijit Singh Love',
  'AP Dhillon'
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterTab>(initialQuery ? 'all' : 'trending');
  const [trendingSubCategory, setTrendingSubCategory] = useState('all');
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  const [results, setResults] = useState<SearchResults>({
    tracks: [],
    artists: [],
    albums: [],
    playlists: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(() => storage.getSearchHistory());
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  const debouncedQuery = useDebounce(query, 350);

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

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== query) {
      setQuery(q);
      if (q.trim()) {
        setActiveFilter('all');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ tracks: [], artists: [], albums: [], playlists: [] });
      setIsLoading(false);
      return;
    }

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
    if (val.trim()) {
      setSearchParams({ q: val }, { replace: true });
      if (activeFilter === 'trending') {
        setActiveFilter('all');
      }
    } else {
      setSearchParams({}, { replace: true });
    }
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

  const filterTabs: { id: FilterTab; label: string; icon: any }[] = [
    { id: 'trending', label: '🔥 Trending', icon: Flame },
    ...(query
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
      <div className="max-w-3xl space-y-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Search Music
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover Bollywood, Bhojpuri, Arkesta, Punjabi, Haryanvi & Rap in crystal-clear 320kbps.
          </p>
        </div>

        {/* Search Bar Input */}
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          isLoading={isLoading}
          placeholder="Search Hindi, Bhojpuri, Arkesta, Punjabi, Haryanvi, Rapper songs..."
          autoFocus={!initialQuery}
        />

        {/* Quick Trending Keyword Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
            <span>Popular:</span>
          </span>
          {QUICK_TRENDING_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSelectChip(chip)}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-dark-card hover:bg-brand-500/10 hover:text-brand-500 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
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

      {/* Main Tabs (Trending + Search result categories) right below Search Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none">
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
                  : 'bg-white dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. TRENDING TAB VIEW (Shows Trending Songs with Sub-category Switcher)   */}
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
            <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
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
      {/* 2. SEARCH QUERY RESULTS VIEW                                              */}
      {/* ========================================================================= */}
      {activeFilter !== 'trending' && (
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
                description={`We couldn't find anything matching "${query}". Try searching for artist names, song titles, or click the Trending tab above.`}
              />
            </div>
          )}

          {/* Search Results Display */}
          {query && !isLoading && hasAnyResults && (
            <div className="space-y-8">
              {/* Songs Section */}
              {(activeFilter === 'all' || activeFilter === 'songs') && results.tracks.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                    Songs ({results.tracks.length})
                  </h3>
                  <div className="space-y-1 bg-white/40 dark:bg-dark-card/40 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                    {results.tracks.slice(0, activeFilter === 'all' ? 12 : 50).map((track, i) => (
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
