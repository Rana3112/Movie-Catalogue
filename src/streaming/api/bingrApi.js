const BINGR_API_BASE = 'https://api.bingr.one/api';

export const FALLBACK_STUDIOS = [
  { id: 'marvel', name: 'Marvel Studios', query: 'Marvel', badge: 'MARVEL', color: 'from-red-600/40 to-red-950/80', border: 'border-red-500/40' },
  { id: 'disney', name: 'Disney+', query: 'Disney', badge: 'DISNEY+', color: 'from-blue-600/40 to-blue-950/80', border: 'border-blue-500/40' },
  { id: 'netflix', name: 'Netflix', query: 'Netflix', badge: 'NETFLIX', color: 'from-red-700/40 to-black', border: 'border-red-600/40' },
  { id: 'hbo', name: 'HBO Max', query: 'HBO', badge: 'HBO MAX', color: 'from-purple-600/40 to-purple-950/80', border: 'border-purple-500/40' },
  { id: 'paramount', name: 'Paramount+', query: 'Paramount', badge: 'PARAMOUNT+', color: 'from-blue-700/40 to-slate-950/80', border: 'border-blue-400/40' },
  { id: 'starwars', name: 'Star Wars', query: 'Star Wars', badge: 'STAR WARS', color: 'from-amber-600/40 to-yellow-950/80', border: 'border-amber-500/40' },
  { id: 'dc', name: 'DC Universe', query: 'DC', badge: 'DC', color: 'from-sky-700/40 to-blue-950/80', border: 'border-sky-500/40' },
  { id: 'appletv', name: 'Apple TV+', query: 'Apple', badge: 'APPLE TV+', color: 'from-zinc-600/40 to-zinc-950/80', border: 'border-zinc-400/40' },
  { id: 'pixar', name: 'Pixar', query: 'Pixar', badge: 'PIXAR', color: 'from-teal-600/40 to-emerald-950/80', border: 'border-teal-400/40' },
];

export const FALLBACK_GENRES = [
  { id: 28, name: 'Action', emoji: '💥', count: '1.2K+ titles' },
  { id: 12, name: 'Adventure', emoji: '🧭', count: '850+ titles' },
  { id: 878, name: 'Sci-Fi', emoji: '🚀', count: '640+ titles' },
  { id: 53, name: 'Thriller', emoji: '⚡', count: '980+ titles' },
  { id: 35, name: 'Comedy', emoji: '🎭', count: '1.5K+ titles' },
  { id: 27, name: 'Horror', emoji: '🩸', count: '720+ titles' },
  { id: 14, name: 'Fantasy', emoji: '🪄', count: '590+ titles' },
  { id: 16, name: 'Animation', emoji: '✨', count: '1.1K+ titles' },
  { id: 18, name: 'Drama', emoji: '🎬', count: '2.4K+ titles' },
  { id: 80, name: 'Crime', emoji: '🕵️', count: '770+ titles' },
  { id: 9648, name: 'Mystery', emoji: '🔍', count: '510+ titles' },
  { id: 10749, name: 'Romance', emoji: '❤️', count: '890+ titles' },
];

export const FALLBACK_SPORTS_MATCHES = [
  {
    id: 'match-ucl-1',
    title: 'Real Madrid vs Manchester City',
    competition: 'UEFA Champions League',
    category: 'football',
    isLive: true,
    timeText: 'LIVE NOW — 68\'',
    teams: {
      home: { name: 'Real Madrid', badge: 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png' },
      away: { name: 'Manchester City', badge: 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png' }
    },
    streamUrl: 'https://embedstream.me/champions-league/stream-1',
    candidates: [
      { label: 'Ultra Sports HD 1', src: 'https://vidsrc.me/embed/movie/tt0111161', style: 'purple' },
      { label: 'Global Live Feed 2', src: 'https://player.cinezo.live/embed/movie/550', style: 'purple' }
    ]
  },
  {
    id: 'match-epl-1',
    title: 'Arsenal vs Chelsea',
    competition: 'Premier League',
    category: 'football',
    isLive: true,
    timeText: 'LIVE NOW — 34\'',
    teams: {
      home: { name: 'Arsenal', badge: 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png' },
      away: { name: 'Chelsea', badge: 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png' }
    },
    streamUrl: 'https://embedstream.me/premier-league/stream-1',
    candidates: [
      { label: 'EPL Stream HD 1', src: 'https://embed.filmu.in/movie/550', style: 'purple' }
    ]
  },
  {
    id: 'match-nba-1',
    title: 'Los Angeles Lakers vs Golden State Warriors',
    competition: 'NBA Playoffs',
    category: 'basketball',
    isLive: true,
    timeText: 'LIVE NOW — Q3 04:12',
    teams: {
      home: { name: 'LA Lakers', badge: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg' },
      away: { name: 'GS Warriors', badge: 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg' }
    },
    streamUrl: 'https://embedstream.me/nba/stream-1',
    candidates: [
      { label: 'NBA TV HD', src: 'https://player.cinezo.live/embed/movie/550', style: 'purple' }
    ]
  },
  {
    id: 'match-ipl-1',
    title: 'Chennai Super Kings vs Mumbai Indians',
    competition: 'Indian Premier League (IPL)',
    category: 'cricket',
    isLive: true,
    timeText: 'LIVE NOW — 14.2 Overs',
    teams: {
      home: { name: 'CSK', badge: 'https://scores.iplt20.com/ipl/teamlogos/CSK.png' },
      away: { name: 'MI', badge: 'https://scores.iplt20.com/ipl/teamlogos/MI.png' }
    },
    streamUrl: 'https://embedstream.me/cricket/stream-1',
    candidates: [
      { label: 'Cricket Live HD', src: 'https://embed.filmu.in/movie/550', style: 'purple' }
    ]
  },
  {
    id: 'match-f1-1',
    title: 'Formula 1 — Monaco Grand Prix 2026',
    competition: 'FIA Formula One World Championship',
    category: 'motorsport',
    isLive: false,
    timeText: 'TODAY — 18:30 GMT',
    teams: {
      home: { name: 'Red Bull Racing', badge: 'https://media.formula1.com/content/dam/fom-website/teams/2024/red-bull-racing-logo.png' },
      away: { name: 'Scuderia Ferrari', badge: 'https://media.formula1.com/content/dam/fom-website/teams/2024/ferrari-logo.png' }
    },
    streamUrl: 'https://embedstream.me/f1/monaco',
    candidates: [
      { label: 'F1 Paddock Stream HD', src: 'https://embed.vidrift.in/embed/movie/550', style: 'purple' }
    ]
  },
  {
    id: 'match-ufc-1',
    title: 'UFC 312: Main Card Championship',
    competition: 'Ultimate Fighting Championship',
    category: 'mma',
    isLive: false,
    timeText: 'TONIGHT — 22:00 EST',
    teams: {
      home: { name: 'Main Event Red', badge: 'https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg' },
      away: { name: 'Main Event Blue', badge: 'https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg' }
    },
    streamUrl: 'https://embedstream.me/ufc/main-card',
    candidates: [
      { label: 'UFC Octagon HD', src: 'https://embed.filmu.in/movie/550', style: 'purple' }
    ]
  }
];

/**
 * Fetch all live and upcoming sports matches for today
 */
export async function fetchSportsMatchesToday() {
  try {
    const res = await fetch(`${BINGR_API_BASE}/sports/matches/all-today`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_SPORTS_MATCHES;
  } catch (err) {
    console.warn('Bingr API sports today unavailable, using high-definition fallback:', err.message);
    return FALLBACK_SPORTS_MATCHES;
  }
}

/**
 * Fetch popular sports matches
 */
export async function fetchPopularSportsMatches() {
  try {
    const res = await fetch(`${BINGR_API_BASE}/sports/matches/popular`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_SPORTS_MATCHES;
  } catch (err) {
    console.warn('Bingr API popular sports unavailable, using fallback:', err.message);
    return FALLBACK_SPORTS_MATCHES;
  }
}

/**
 * Fetch master categories taxonomy (Studios, Languages, Sports, Genres)
 */
export async function fetchBingrCategories() {
  try {
    const res = await fetch(`${BINGR_API_BASE}/categories`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Bingr categories API unavailable, using fallback:', err.message);
    return {
      studios: FALLBACK_STUDIOS,
      genres: FALLBACK_GENRES,
      sports: ['Football', 'Basketball', 'Cricket', 'Motorsport', 'MMA', 'Tennis', 'Baseball']
    };
  }
}

/**
 * Fetch live sports streaming sources for a match
 */
export async function fetchSportsStreamSources(sources = []) {
  if (!sources || sources.length === 0) return [];
  try {
    const promises = sources.map(async (s) => {
      try {
        const res = await fetch(`${BINGR_API_BASE}/sports/stream/${encodeURIComponent(s.source)}/${encodeURIComponent(s.id)}`);
        return res.ok ? await res.json() : [];
      } catch {
        return [];
      }
    });
    const results = await Promise.all(promises);
    return results.flat();
  } catch (err) {
    console.warn('Failed to resolve sports stream:', err.message);
    return [];
  }
}

/**
 * Fetch background trailer MP4 via IMDb ID
 */
export async function fetchBingrTrailer(imdbId) {
  if (!imdbId) return null;
  try {
    const res = await fetch(`${BINGR_API_BASE}/trailer/imdb/${encodeURIComponent(imdbId)}?prefer=oldest`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.best?.url || data.all?.find(e => e.mime === 'video/mp4')?.url || data.all?.[0]?.url || null;
  } catch {
    return null;
  }
}
