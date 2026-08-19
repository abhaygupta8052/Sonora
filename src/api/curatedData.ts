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
    artwork: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=electronic-future-beats-117997.mp3',
    provider: 'curated',
    genre: 'EDM',
    releaseYear: '2024'
  },
  {
    id: 'curated-3',
    title: 'Acoustic Sunrise',
    artist: 'River Soul',
    album: 'Morning Light',
    duration: 176,
    artwork: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3?filename=acoustic-breeze-109228.mp3',
    provider: 'curated',
    genre: 'Acoustic',
    releaseYear: '2023'
  }
];

export const CURATED_PLAYLISTS: Playlist[] = [
  {
    id: 'trending-hindi-2024',
    title: 'Trending Hindi 2024',
    description: 'Hottest Hindi hits of the year.',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
    trackCount: 20,
    tracks: FEATURED_TRACKS
  },
  {
    id: 'bhojpuri-superhits',
    title: 'Bhojpuri Superhits',
    description: 'All-time best Bhojpuri bangers.',
    artwork: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80',
    trackCount: 15,
    tracks: FEATURED_TRACKS
  },
  {
    id: 'punjabi-bass',
    title: 'Punjabi Bass Anthems',
    description: 'Hard-hitting Punjabi bangers.',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    trackCount: 18,
    tracks: FEATURED_TRACKS
  },
  {
    id: 'lofi-focus',
    title: 'Lo-Fi Chill & Focus',
    description: 'Relaxing beats to keep you focused, calm, and inspired.',
    artwork: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    trackCount: 15,
    tracks: FEATURED_TRACKS
  }
];

// Featured artists — using DiceBear avatar (no hotlink/CORS issues)
function artistAvatar(name: string) {
  const seed = name.replace(/\s+/g, '-').toLowerCase();
  return `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&backgroundColor=7c3aed,6d28d9,4c1d95&backgroundType=gradientLinear`;
}

export const FEATURED_ARTISTS: Artist[] = [
  {
    id: 'Arijit Singh',
    name: 'Arijit Singh',
    image: artistAvatar('arijit-singh'),
    bio: "India's premier playback singer with billions of streams across romantic and soulful classics.",
    followerCount: 35000000,
    monthlyListeners: '42M',
    genres: ['Bollywood', 'Romantic', 'Soulful'],
    topTracks: [],
    albums: []
  },
  {
    id: 'Pawan Singh',
    name: 'Pawan Singh',
    image: artistAvatar('pawan-singh'),
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
    image: artistAvatar('sidhu-moosewala'),
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
    image: artistAvatar('shreya-ghoshal'),
    bio: 'Renowned Indian playback singer celebrated across multiple languages and film industries.',
    followerCount: 28000000,
    monthlyListeners: '35M',
    genres: ['Bollywood', 'Classical', 'Melody'],
    topTracks: [],
    albums: []
  },
  {
    id: 'AP Dhillon',
    name: 'AP Dhillon',
    image: artistAvatar('ap-dhillon'),
    bio: 'Indo-Canadian Punjabi pop star blending R&B with traditional Punjabi sounds.',
    followerCount: 12000000,
    monthlyListeners: '18M',
    genres: ['Punjabi', 'R&B', 'Pop'],
    topTracks: [],
    albums: []
  },
  {
    id: 'Khesari Lal Yadav',
    name: 'Khesari Lal Yadav',
    image: artistAvatar('khesari-lal-yadav'),
    bio: 'Bhojpuri superstar with chart-topping hit songs and a massive fanbase.',
    followerCount: 14000000,
    monthlyListeners: '12M',
    genres: ['Bhojpuri', 'Folk'],
    topTracks: [],
    albums: []
  },
  {
    id: 'Diljit Dosanjh',
    name: 'Diljit Dosanjh',
    image: artistAvatar('diljit-dosanjh'),
    bio: 'Globally acclaimed Punjabi singer and Bollywood actor.',
    followerCount: 20000000,
    monthlyListeners: '22M',
    genres: ['Punjabi', 'Bollywood'],
    topTracks: [],
    albums: []
  },
  {
    id: 'Jubin Nautiyal',
    name: 'Jubin Nautiyal',
    image: artistAvatar('jubin-nautiyal'),
    bio: 'Popular Bollywood playback singer known for soulful romantic ballads.',
    followerCount: 10000000,
    monthlyListeners: '14M',
    genres: ['Bollywood', 'Romantic'],
    topTracks: [],
    albums: []
  }
];
