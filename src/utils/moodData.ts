export interface MoodDefinition {
  id: string;
  name: string;
  hindiName: string;
  emoji: string;
  subtitle: string;
  description: string;
  gradient: string;
  bgGlow: string;
  badgeBg: string;
  primaryQuery: string;
  alternativeQueries: string[];
  keywords: string[];
  color: string;
}

export const MOODS: MoodDefinition[] = [
  {
    id: 'sad',
    name: 'Sad & Heartbreak',
    hindiName: 'दर्द और उदास',
    emoji: '💔',
    subtitle: 'Soulful & emotional melodies for healing',
    description: 'Heartfelt, emotional tracks for when you are feeling low, brokenhearted, or reflective.',
    gradient: 'from-blue-900 via-indigo-950 to-slate-950',
    bgGlow: 'rgba(59, 130, 246, 0.25)',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    primaryQuery: 'Hindi Sad Songs Heartbreak Melodies',
    alternativeQueries: [
      'Arijit Singh Sad Songs',
      'Heartbroken Hindi Hits',
      'Soulful Sad Ballads Bollywood',
      'Dard Bhare Gaane'
    ],
    keywords: [
      'sad', 'sad mood', 'mood off', 'moodoff', 'broken heart', 'heartbreak',
      'dil toota', 'dard', 'emotional', 'crying', 'cry', 'alone', 'lonely',
      'breakup', 'heartbroken', 'gam', 'tanha', 'tanhai', 'bewafa',
      'separation', 'judaai', 'gham', 'sad status', 'sad songs', 'udas',
      'dukh', 'broken', 'tears', 'hurt'
    ],
    color: '#3b82f6'
  },
  {
    id: 'romantic',
    name: 'Romantic & Love',
    hindiName: 'रोमैंटिक और प्यार',
    emoji: '❤️',
    subtitle: 'Heart-touching love melodies & acoustic duets',
    description: 'Sweet, passionate, and heartwarming love songs for you and your special one.',
    gradient: 'from-rose-600 via-pink-700 to-red-900',
    bgGlow: 'rgba(244, 63, 94, 0.25)',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    primaryQuery: 'Hindi Romantic Love Hits Arijit Shreya',
    alternativeQueries: [
      'Bollywood Love Songs 2024',
      'Best Romantic Hindi Ballads',
      'Soulful Romantic Duets',
      'Pyar Bhare Gaane'
    ],
    keywords: [
      'romantic', 'romantic mood', 'love', 'love mood', 'love song', 'lovesong',
      'pyar', 'pyaar', 'ishq', 'mohabbat', 'romance', 'crush', 'valentine',
      'couple', 'dil', 'dilbar', 'sanam', 'lover', 'affection', 'cuddle',
      'romantic songs', 'mohabbat status', 'love vibe', 'love vibes'
    ],
    color: '#f43f5e'
  },
  {
    id: 'chill',
    name: 'Chill & Sukoon',
    hindiName: 'सुकून और शांति',
    emoji: '☕',
    subtitle: 'Calm, soothing & peaceful acoustic vibes',
    description: 'Slow, peaceful, and relaxing music to unwind after a long day and find inner peace.',
    gradient: 'from-teal-800 via-emerald-950 to-slate-950',
    bgGlow: 'rgba(20, 184, 166, 0.25)',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    primaryQuery: 'Hindi Acoustic Sukoon Peaceful Melodies',
    alternativeQueries: [
      'Peaceful Bollywood Acoustic',
      'Sukoon Songs Hindi',
      'Calm Hindi Vibes',
      'Soothing Hindi Songs'
    ],
    keywords: [
      'chill', 'chill mood', 'chill vibe', 'relax', 'relaxing', 'peaceful',
      'sukoon', 'calm', 'calm mood', 'quiet', 'rest', 'soothing', 'serene',
      'shanti', 'me time', 'night vibe', 'late night', 'unwind', 'peace',
      'soft music', 'slow music', 'ambient'
    ],
    color: '#14b8a6'
  },
  {
    id: 'lofi',
    name: 'Lo-Fi & Slowed',
    hindiName: 'धीमा लो-फाई बीट्स',
    emoji: '🎧',
    subtitle: 'Aesthetic midnight beats & slowed reverb vibes',
    description: 'Nostalgic Lo-Fi remixes and slowed + reverb tracks to set the perfect nighttime ambiance.',
    gradient: 'from-purple-900 via-indigo-950 to-slate-950',
    bgGlow: 'rgba(168, 85, 247, 0.25)',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    primaryQuery: 'Hindi Lofi Slowed Reverb Beats',
    alternativeQueries: [
      'Bollywood Lofi Chill',
      'Late Night Hindi Lofi',
      'Slowed and Reverb Hindi',
      'Midnight Lofi Mix'
    ],
    keywords: [
      'lofi', 'lo-fi', 'lofi mood', 'slowed', 'reverb', 'slowed and reverb',
      'slowed reverb', 'aesthetic', 'midnight lofi', 'chill beats', 'lofi hip hop',
      'hindi lofi', 'late night lofi', 'aesthetic song'
    ],
    color: '#a855f7'
  },
  {
    id: 'party',
    name: 'Party & Dance',
    hindiName: 'पार्टी और डांस धमाका',
    emoji: '💃',
    subtitle: 'High-voltage club anthems & dance bangers',
    description: 'Bass-boosted club hits, wedding dance tracks, and Bollywood party anthems to light up the floor.',
    gradient: 'from-amber-600 via-orange-700 to-rose-900',
    bgGlow: 'rgba(245, 158, 11, 0.25)',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    primaryQuery: 'Bollywood Party Dance Club Hits 2024',
    alternativeQueries: [
      'Desi Party Songs',
      'Wedding Dance Hindi Hits',
      'Club Remix Hindi',
      'DJ Party Bangers'
    ],
    keywords: [
      'party', 'party mood', 'party vibe', 'dance', 'dance songs', 'club',
      'dj', 'nacho', 'nachna', 'shadi', 'wedding', 'banger', 'remix',
      'dhamaka', 'disco', 'daru', 'celebration', 'fun', 'bhangra party',
      'club hits', 'clubbing'
    ],
    color: '#f59e0b'
  },
  {
    id: 'gym',
    name: 'Gym & Workout',
    hindiName: 'जिम और वर्कआउट जोश',
    emoji: '💪',
    subtitle: 'High-energy bass & pump-up workout motivation',
    description: 'Adrenaline-pumping beats, motivational tracks, and heavy bass to fuel your heavy sets.',
    gradient: 'from-red-600 via-orange-700 to-zinc-950',
    bgGlow: 'rgba(239, 68, 68, 0.25)',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30',
    primaryQuery: 'High Energy Gym Workout Bass Hits',
    alternativeQueries: [
      'Desi Hip Hop Workout Motivation',
      'Gym Motivation Songs',
      'Hardstyle Bass Workout',
      'Power Fitness Beats'
    ],
    keywords: [
      'gym', 'gym mood', 'workout', 'workout mood', 'motivation', 'motivational',
      'energetic', 'fitness', 'training', 'power', 'josh', 'hype', 'pump',
      'beast mode', 'running', 'cardio', 'weight lifting', 'energy', 'intense',
      'pushups', 'deadlift', 'workout song'
    ],
    color: '#ef4444'
  },
  {
    id: 'happy',
    name: 'Happy & Feel Good',
    hindiName: 'खुशी और मौज',
    emoji: '✨',
    subtitle: 'Upbeat, joyful & uplifting mood boosters',
    description: 'Cheerful and positive songs guaranteed to lift your spirits and brighten your day.',
    gradient: 'from-yellow-500 via-amber-600 to-orange-800',
    bgGlow: 'rgba(234, 179, 8, 0.25)',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    primaryQuery: 'Happy Feel Good Hindi Upbeat Songs',
    alternativeQueries: [
      'Bollywood Happy Hits',
      'Positive Vibes Hindi',
      'Cheerful Hindi Melodies',
      'Smile Joy Songs'
    ],
    keywords: [
      'happy', 'happy mood', 'feel good', 'feelgood', 'joy', 'smile',
      'masti', 'khushi', 'positive', 'good vibes', 'cheerful', 'mood booster',
      'excited', 'happiness', 'celebrate', 'optimistic'
    ],
    color: '#eab308'
  },
  {
    id: 'travel',
    name: 'Travel & Long Drive',
    hindiName: 'सफर और लॉन्ग ड्राइव',
    emoji: '🚗',
    subtitle: 'Open roads, wandering minds & road trip anthems',
    description: 'The ultimate soundtrack for scenic road trips, highway drives, and wanderlust journeys.',
    gradient: 'from-cyan-600 via-blue-700 to-indigo-950',
    bgGlow: 'rgba(6, 182, 212, 0.25)',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    primaryQuery: 'Hindi Road Trip Long Drive Songs',
    alternativeQueries: [
      'Bollywood Travel Journey Songs',
      'Highway Drive Hindi Hits',
      'Safar Hindi Songs',
      'Wanderlust Hindi Playlist'
    ],
    keywords: [
      'travel', 'travel mood', 'long drive', 'driving', 'drive', 'road trip',
      'roadtrip', 'journey', 'safar', 'trip', 'rasta', 'wanderlust',
      'car songs', 'highway', 'bike ride', 'adventure', 'mountains'
    ],
    color: '#06b6d4'
  },
  {
    id: 'focus',
    name: 'Focus & Study',
    hindiName: 'पढ़ाई और एकाग्रता',
    emoji: '🧠',
    subtitle: 'Deep concentration beats for work & coding',
    description: 'Clean instrumental and ambient soundscapes designed to help you stay in deep focus.',
    gradient: 'from-emerald-700 via-teal-900 to-slate-950',
    bgGlow: 'rgba(16, 185, 129, 0.25)',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    primaryQuery: 'Instrumental Focus Study Beats Ambient',
    alternativeQueries: [
      'Deep Work Concentration Music',
      'Coding Lo-Fi Beats',
      'Peaceful Study Music',
      'Ambient Focus Soundscape'
    ],
    keywords: [
      'focus', 'focus mood', 'study', 'study mood', 'work', 'coding',
      'concentration', 'reading', 'deep work', 'padhai', 'studying',
      'programmer', 'ambient study', 'exam', 'memory'
    ],
    color: '#10b981'
  },
  {
    id: 'rain',
    name: 'Monsoon & Rain',
    hindiName: 'बारिश और मौसम',
    emoji: '🌧️',
    subtitle: 'Chai, petrichor & magical rain melodies',
    description: 'Soul-stirring monsoon songs and romantic rain melodies for cloudy days.',
    gradient: 'from-sky-700 via-blue-900 to-slate-950',
    bgGlow: 'rgba(14, 165, 233, 0.25)',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    primaryQuery: 'Bollywood Baarish Monsoon Rain Hits',
    alternativeQueries: [
      'Hindi Rain Songs',
      'Barsaat Romantic Hindi',
      'Rimjhim Baarish Melodies',
      'Monsoon Magic Hits'
    ],
    keywords: [
      'rain', 'rain mood', 'baarish', 'barsaat', 'monsoon', 'clouds',
      'rimjhim', 'rainy day', 'rain vibe', 'chai baarish', 'mausam',
      'badal', 'water'
    ],
    color: '#0ea5e9'
  },
  {
    id: 'bhakti',
    name: 'Devotional & Bhakti',
    hindiName: 'भक्ति और आध्यात्मिक',
    emoji: '🪔',
    subtitle: 'Sacred chants, bhajans & spiritual peace',
    description: 'Divine bhajans, aartis, and spiritual mantras for morning positivity and inner tranquility.',
    gradient: 'from-amber-600 via-orange-800 to-stone-950',
    bgGlow: 'rgba(217, 119, 6, 0.25)',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    primaryQuery: 'Peaceful Bhakti Bhajans Krishna Shiv Aarti',
    alternativeQueries: [
      'Morning Aarti and Bhajans',
      'Spiritual Devotional Mantras',
      'Hanuman Chalisa and Shiv Tandav',
      'Krishna Bhajan Hits'
    ],
    keywords: [
      'bhakti', 'bhakti mood', 'devotional', 'spiritual', 'krishna', 'shiva',
      'mahadev', 'ram', 'hanuman', 'aarti', 'bhajan', 'prarthana',
      'mandir', 'puja', 'pooja', 'mantra', 'om', 'god', 'divine'
    ],
    color: '#d97706'
  },
  {
    id: 'retro',
    name: '90s & Retro Classics',
    hindiName: 'पुराने क्लासिक्स और यादें',
    emoji: '📻',
    subtitle: 'Evergreen golden era legends & timeless hits',
    description: 'Golden era Bollywood hits from Kishore Kumar, Lata Mangeshkar, Alka Yagnik, and Kumar Sanu.',
    gradient: 'from-violet-800 via-fuchsia-950 to-slate-950',
    bgGlow: 'rgba(139, 92, 246, 0.25)',
    badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    primaryQuery: '90s Romantic Evergreen Bollywood Classics',
    alternativeQueries: [
      'Kishore Kumar Lata Mangeshkar Hits',
      'Kumar Sanu Alka Yagnik 90s Hits',
      'Old Hindi Golden Era Songs',
      'Purane Gane Romantic'
    ],
    keywords: [
      'retro', 'retro mood', '90s', '90s songs', '80s', '70s', 'old hindi',
      'purane gane', 'purane gaane', 'kishore kumar', 'lata mangeshkar',
      'kumar sanu', 'alka yagnik', 'nostalgia', 'evergreen', 'golden era',
      'vintage', 'classic hindi'
    ],
    color: '#8b5cf6'
  }
];

/**
 * Normalizes query string for matching
 */
function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects if a user query corresponds to a mood.
 * Returns the matching MoodDefinition or null if no strong mood intent detected.
 */
export function detectMood(rawQuery: string): MoodDefinition | null {
  if (!rawQuery || typeof rawQuery !== 'string') return null;

  const normalized = normalizeQuery(rawQuery);
  if (!normalized) return null;

  // 1. Direct ID / exact Name match
  for (const mood of MOODS) {
    if (
      normalized === mood.id ||
      normalized === mood.name.toLowerCase() ||
      normalized === mood.hindiName.toLowerCase()
    ) {
      return mood;
    }
  }

  // 2. Exact keyword phrase match (e.g. "sad mood", "mood off", "dil toota", "broken heart")
  for (const mood of MOODS) {
    for (const kw of mood.keywords) {
      if (normalized === kw) {
        return mood;
      }
    }
  }

  // 3. Multi-word phrase or partial keyword token matching
  const words = normalized.split(' ');
  const hasMoodWord =
    words.includes('mood') ||
    words.includes('vibe') ||
    words.includes('vibes') ||
    words.includes('feeling') ||
    words.includes('songs') ||
    words.includes('song') ||
    words.includes('gaane') ||
    words.includes('gane');

  for (const mood of MOODS) {
    for (const kw of mood.keywords) {
      // Check if keyword is present as a standalone phrase or word in the query
      if (normalized.includes(kw)) {
        // If keyword has multiple words (e.g. "broken heart", "long drive")
        if (kw.includes(' ')) {
          return mood;
        }
        // If it's a single word match, ensure it's a distinct word
        if (words.includes(kw) || hasMoodWord) {
          return mood;
        }
      }
    }
  }

  return null;
}

/**
 * Gets a mood by its ID
 */
export function getMoodById(id: string): MoodDefinition | undefined {
  return MOODS.find((m) => m.id.toLowerCase() === id.toLowerCase());
}

/**
 * Returns all moods
 */
export function getAllMoods(): MoodDefinition[] {
  return MOODS;
}
