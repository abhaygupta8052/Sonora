import { Track, Playlist, GenreCategory, Artist } from './types';

export const CURATED_GENRES: GenreCategory[] = [
  {
    id: 'bollywood',
    name: 'Bollywood Hits',
    icon: 'Flame',
    gradient: 'from-amber-600 via-rose-600 to-red-700',
    query: 'Bollywood Top Hits 2024'
  },
  {
    id: 'bhojpuri',
    name: 'Bhojpuri Superhits',
    icon: 'Zap',
    gradient: 'from-orange-600 to-amber-700',
    query: 'Bhojpuri Superhits Pawan Singh'
  },
  {
    id: 'punjabi',
    name: 'Punjabi Hot Hits',
    icon: 'Radio',
    gradient: 'from-purple-600 to-pink-700',
    query: 'Punjabi Hits Sidhu Moosewala AP Dhillon'
  },
  {
    id: 'hindi-romantic',
    name: 'Hindi Romantic',
    icon: 'Heart',
    gradient: 'from-rose-500 to-pink-600',
    query: 'Hindi Romantic Arijit Singh'
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chill & Study',
    icon: 'Coffee',
    gradient: 'from-indigo-600 to-violet-800',
    query: 'Lofi Hindi Chill Beats'
  },
  {
    id: 'pop',
    name: 'Global Pop Hits',
    icon: 'Sparkles',
    gradient: 'from-blue-600 to-cyan-700',
    query: 'Global Pop Top 50'
  },
  {
    id: 'electronic',
    name: 'EDM & Party Dance',
    icon: 'Disc',
    gradient: 'from-fuchsia-600 to-indigo-800',
    query: 'Party Dance Club Hits'
  },
  {
    id: 'acoustic',
    name: 'Acoustic & Unplugged',
    icon: 'Music',
    gradient: 'from-emerald-600 to-teal-800',
    query: 'Hindi Acoustic Unplugged'
  }
];

export const FEATURED_TRACKS: Track[] = [
  {
    id: 'curated-1',
    title: 'Midnight Reverie (Lo-Fi)',
    artist: 'Aura Bloom',
    album: 'Neon Horizon',
    duration: 194,
    artwork: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    provider: 'curated',
    genre: 'Lo-Fi Chill',
    releaseYear: '2024'
  },
  {
    id: 'curated-2',
    title: 'Cyberpunk Neon Drive',
    artist: 'Vektor Pulse',
    album: 'Digital Odyssey',
    duration: 218,
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=synthwave-80s-110045.mp3',
    provider: 'curated',
    genre: 'Synthwave',
    releaseYear: '2024'
  },
  {
    id: 'curated-3',
    title: 'Golden Sunset Echoes',
    artist: 'Solara',
    album: 'Summer Drift',
    duration: 165,
    artwork: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=chill-abstract-intention-12099.mp3',
    provider: 'curated',
    genre: 'Chillhop',
    releaseYear: '2024'
  },
  {
    id: 'curated-4',
    title: 'Starlight Melodies',
    artist: 'Luna Eclipse',
    album: 'Cosmic Journey',
    duration: 182,
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
    provider: 'curated',
    genre: 'Electronic',
    releaseYear: '2023'
  }
];

export const CURATED_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-bollywood-blockbusters',
    title: 'Bollywood Blockbusters',
    description: 'Chart-topping Hindi cinematic hits and trending viral songs.',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    trackCount: 25,
    tracks: FEATURED_TRACKS
  },
  {
    id: 'playlist-bhojpuri-tadka',
    title: 'Bhojpuri Superhits & Tadka',
    description: 'High energy dance anthems from Pawan Singh, Khesari Lal & more.',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    trackCount: 20,
    tracks: FEATURED_TRACKS
  },
  {
    id: 'playlist-punjabi-fire',
    title: 'Punjabi Fire & Swag',
    description: 'Bhangra beats, hip hop Punjabi rhythms, and car bass anthems.',
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    trackCount: 20,
    tracks: FEATURED_TRACKS
  },
  {
    id: 'playlist-lofi-night',
    title: 'Lo-Fi Chill & Focus',
    description: 'Relaxing beats to keep you focused, calm, and inspired.',
    artwork: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    trackCount: 15,
    tracks: FEATURED_TRACKS
  }
];

export const FEATURED_ARTISTS: Artist[] = [
  {
    id: 'Arijit Singh',
    name: 'Arijit Singh',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80',
    bio: 'India\'s premier playback singer with billions of streams across romantic and soulful classics.',
    followerCount: 35000000,
    monthlyListeners: '42M',
    genres: ['Bollywood', 'Romantic', 'Soulful'],
    topTracks: [],
    albums: []
  },
  {
    id: 'Pawan Singh',
    name: 'Pawan Singh',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    bio: 'Bhojpuri music superstar and film icon known for energetic folk and modern dance hits.',
    followerCount: 18000000,
    monthlyListeners: '15M',
    genres: ['Bhojpuri', 'Folk', 'Dance'],
    topTracks: [],
    albums: []
  },
  {
    id: 'Sidhu Moosewala',
    name: 'Sidhu Moosewala',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    bio: 'Legendary Punjabi rapper and lyricist who transformed modern Desi hip hop.',
    followerCount: 22000000,
    monthlyListeners: '25M',
    genres: ['Punjabi', 'Hip-Hop', 'Trap'],
    topTracks: [],
    albums: []
  },
  {
    id: 'Shreya Ghoshal',
    name: 'Shreya Ghoshal',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    bio: 'Renowned Indian playback singer celebrated across multiple languages and film industries.',
    followerCount: 28000000,
    monthlyListeners: '35M',
    genres: ['Bollywood', 'Classical', 'Melody'],
    topTracks: [],
    albums: []
  }
];
