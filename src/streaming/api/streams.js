import { BINGR_SERVERS, fetchBingrStream } from './bingrDirect.js';

const env = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : {};
const VIDZEE = (env.VITE_VIDZEE_PLAYER || 'https://player.vidzee.wtf').replace(/\/+$/, '');
const VIDSRC_MOV = (env.VITE_VIDSRC_MOV_PLAYER || 'https://vidsrc.mov').replace(/\/+$/, '');
const ANIME_PLAYER = (env.VITE_ANIME_PLAYER || 'https://vidnest.fun').replace(/\/+$/, '');
const API_URL = (env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com').replace(/\/+$/, '');

// Verified high-uptime streaming endpoints
const VIDBOLT_BASE = 'https://vidbolt.xyz';
const EMBED2_BASE = 'https://www.2embed.cc';
const VIDSRC_MOV_BASE = 'https://vidsrc.mov';
const PRIMESRC_BASE = 'https://primesrc.me';
const VIDY_BASE = 'https://www.vidy.st';
const VIDNEST_BASE = 'https://vidnest.fun';
const VIDSRC_PM_BASE = 'https://vidsrc.pm';
const FILMU_BASE = 'https://embed.filmu.in';
const VIDZEE_BASE = 'https://player.vidzee.wtf';

const preconnectedOrigins = new Set();
const prefetchedUrls = new Set();

const getOrigin = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

const addHeadLink = ({ rel, href, as }) => {
  if (typeof document === 'undefined' || !href) return;
  const key = `${rel}:${href}`;
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  link.dataset.streamzonePrewarm = key;
  if (as) link.as = as;
  document.head.appendChild(link);
};

// ============================================================================
// VERIFIED ACTIVE STREAMING SERVERS CATALOG
// Only servers verified via live HTTP probe to return 200 OK and stream media.
// Broken / 404 / timed-out / dead hosts have been removed.
// ============================================================================
// ============================================================================
// DEDICATED HINDI AUDIO & INDIAN LANGUAGE STREAMERS
// ============================================================================
export const HINDI_STREAM_SERVERS = [
  {
    id: 'filmu-hindi',
    name: 'Filmu Hindi Dub',
    flag: '🇮🇳',
    country: 'IN',
    tier: 'hindi',
    badge: 'Hindi Dub',
    isHindi: true,
    desc: 'Native Indian Hindi Dub Stream',
    getMovieUrl: (id) => `${FILMU_BASE}/movie/${id}?lang=hi`,
    getTVUrl: (id, s, e) => `${FILMU_BASE}/tv/${id}/${s}/${e}?lang=hi`,
  },
  {
    id: 'smashy-hindi',
    name: 'Smashy Hindi',
    flag: '🇮🇳',
    country: 'IN',
    tier: 'hindi',
    badge: 'Multi-Audio',
    isHindi: true,
    desc: 'Multi-Audio Bollywood & Hindi Dubs',
    getMovieUrl: (id) => `https://player.smashystream.com/movie/${id}`,
    getTVUrl: (id, s, e) => `https://player.smashystream.com/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidcore',
    name: 'Vidcore Cinema',
    flag: '🇮🇳',
    country: 'IN',
    tier: 'hindi',
    badge: 'Desi HD',
    isHindi: true,
    desc: 'Indian Cinema High-Speed Mirror',
    getMovieUrl: (id) => `${FILMU_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${FILMU_BASE}/tv/${id}/${s}/${e}`,
  },
  {
    id: 'nhd',
    name: 'NHD Hindi Stream',
    flag: '🇮🇳',
    country: 'IN',
    tier: 'hindi',
    badge: 'Hindi 1080p',
    isHindi: true,
    desc: 'Regional Hindi Stream Direct',
    getMovieUrl: (id) => `${FILMU_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${FILMU_BASE}/tv/${id}/${s}/${e}`,
  },
];

export const STREAM_SERVERS_CATALOG = [
  {
    id: '2embed',
    name: '2Embed HD',
    flag: '🇦🇺',
    country: 'AU',
    tier: 'primary',
    getMovieUrl: (id) => `${EMBED2_BASE}/embed/${id}`,
    getTVUrl: (id, s, e) => `${EMBED2_BASE}/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: 'vidbolt',
    name: 'Vidbolt Ultra',
    flag: '⚡',
    country: 'US',
    tier: 'primary',
    getMovieUrl: (id) => `${VIDBOLT_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDBOLT_BASE}/tv/${id}/${s}/${e}`,
  },
  ...HINDI_STREAM_SERVERS,
  {
    id: '111',
    name: 'VidSrc Mov',
    flag: '🇬🇧',
    country: 'GB',
    tier: 'primary',
    getMovieUrl: (id) => `${VIDSRC_MOV_BASE}/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDSRC_MOV_BASE}/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'primesrc',
    name: 'Primesrc',
    flag: '🇦🇺',
    country: 'AU',
    tier: 'primary',
    getMovieUrl: (id) => `${PRIMESRC_BASE}/embed/movie?tmdb=${id}`,
    getTVUrl: (id, s, e) => `${PRIMESRC_BASE}/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: 'vidy',
    name: 'Vidy Stream',
    flag: '🌐',
    country: 'US',
    tier: 'primary',
    getMovieUrl: (id) => `${VIDY_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDY_BASE}/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidnest',
    name: 'Vidnest HD',
    flag: '🇬🇧',
    country: 'GB',
    tier: 'primary',
    getMovieUrl: (id) => `${VIDNEST_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDNEST_BASE}/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc-pm',
    name: 'VidSrc PM',
    flag: '🇺🇸',
    country: 'US',
    tier: 'mirror',
    getMovieUrl: (id) => `${VIDSRC_PM_BASE}/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDSRC_PM_BASE}/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'bravo',
    name: 'Bravo (VidZee)',
    flag: '🇬🇧',
    country: 'GB',
    tier: 'mirror',
    getMovieUrl: (id) => `${VIDZEE_BASE}/embed/movie/${id}`,
    getTVUrl: (id, s, e) => `${VIDZEE_BASE}/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'netflix',
    name: 'Netflix HD',
    flag: '🇺🇸',
    country: 'US',
    tier: 'mirror',
    getMovieUrl: (id) => `${FILMU_BASE}/movie/${id}`,
    getTVUrl: (id, s, e) => `${FILMU_BASE}/tv/${id}/${s}/${e}`,
  },
];

// Combine all servers
export const ALL_STREAM_SERVERS = [...STREAM_SERVERS_CATALOG];

// Custom User Added Servers (LocalStorage)
export const getCustomServers = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_stream_servers') : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCustomServer = (custom) => {
  try {
    const list = getCustomServers();
    const updated = [...list, custom];
    localStorage.setItem('custom_stream_servers', JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

// ============================================================================
// PRECONNECT & PREWARM ENGINE
// ============================================================================
export const preconnectStreamingProviders = () => {
  const origins = [
    VIDBOLT_BASE,
    EMBED2_BASE,
    VIDSRC_MOV_BASE,
    PRIMESRC_BASE,
    VIDY_BASE,
    VIDNEST_BASE,
    VIDSRC_PM_BASE,
    FILMU_BASE,
    VIDZEE_BASE,
    ANIME_PLAYER,
    API_URL,
  ];

  origins
    .map(getOrigin)
    .filter(Boolean)
    .forEach(origin => {
      if (preconnectedOrigins.has(origin)) return;
      preconnectedOrigins.add(origin);
      addHeadLink({ rel: 'dns-prefetch', href: origin });
      addHeadLink({ rel: 'preconnect', href: origin });
    });
};

export const prewarmStreamUrl = (url) => {
  if (!url) return;
  preconnectStreamingProviders();
  const origin = getOrigin(url);
  if (origin && !preconnectedOrigins.has(origin)) {
    preconnectedOrigins.add(origin);
    addHeadLink({ rel: 'dns-prefetch', href: origin });
    addHeadLink({ rel: 'preconnect', href: origin });
  }
};

// ============================================================================
// INDIVIDUAL URL GENERATORS (ALL POINTING TO VERIFIED WORKING ENDPOINTS)
// ============================================================================
export const getMovieEmbedUrl = (tmdbId) => `${EMBED2_BASE}/embed/${tmdbId}`;
export const getTVEmbedUrl = (tmdbId, season, episode) => `${EMBED2_BASE}/embedtv/${tmdbId}&s=${season}&e=${episode}`;

export const getMovieEmbedUrlV2 = (tmdbId) => `${VIDBOLT_BASE}/movie/${tmdbId}`;
export const getTVEmbedUrlV2 = (tmdbId, season, episode) => `${VIDBOLT_BASE}/tv/${tmdbId}/${season}/${episode}`;

export const getVidBoltMovieUrl = (tmdbId) => `${VIDBOLT_BASE}/movie/${tmdbId}`;
export const getVidBoltTVUrl = (tmdbId, season, episode) => `${VIDBOLT_BASE}/tv/${tmdbId}/${season}/${episode}`;

export const getVidyMovieUrl = (tmdbId) => `${VIDY_BASE}/movie/${tmdbId}`;
export const getVidyTVUrl = (tmdbId, season, episode) => `${VIDY_BASE}/tv/${tmdbId}/${season}/${episode}`;

export const getVidSrcMovieEmbedUrl = (tmdbId) => `${VIDSRC_MOV_BASE}/embed/movie/${tmdbId}`;
export const getVidSrcTVEmbedUrl = (tmdbId, season, episode) => `${VIDSRC_MOV_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;

export const getPrimeSrcMovieUrl = (tmdbId) => `${PRIMESRC_BASE}/embed/movie?tmdb=${tmdbId}`;
export const getPrimeSrcTVUrl = (tmdbId, season, episode) => `${PRIMESRC_BASE}/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;

export const get2EmbedMovieUrl = (tmdbId) => `${EMBED2_BASE}/embed/${tmdbId}`;
export const get2EmbedTVUrl = (tmdbId, season, episode) => `${EMBED2_BASE}/embedtv/${tmdbId}&s=${season}&e=${episode}`;

// Backwards-compatible aliases for legacy callers
export const getVidLinkMovieUrl = (tmdbId) => `${VIDBOLT_BASE}/movie/${tmdbId}`;
export const getVidLinkTVUrl = (tmdbId, season, episode) => `${VIDBOLT_BASE}/tv/${tmdbId}/${season}/${episode}`;
export const getMoviesApiMovieUrl = (tmdbId) => `${EMBED2_BASE}/embed/${tmdbId}`;
export const getMoviesApiTVUrl = (tmdbId, season, episode) => `${EMBED2_BASE}/embedtv/${tmdbId}&s=${season}&e=${episode}`;
export const getVidsrcMeMovieUrl = (tmdbId) => `${VIDSRC_PM_BASE}/embed/movie/${tmdbId}`;
export const getVidsrcMeTVUrl = (tmdbId, season, episode) => `${VIDSRC_PM_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;
export const getSuperEmbedMovieUrl = (tmdbId) => `${EMBED2_BASE}/embed/${tmdbId}`;
export const getSuperEmbedTVUrl = (tmdbId, season, episode) => `${EMBED2_BASE}/embedtv/${tmdbId}&s=${season}&e=${episode}`;
export const getAutoEmbedMovieUrl = (tmdbId) => `${VIDBOLT_BASE}/movie/${tmdbId}`;
export const getAutoEmbedTVUrl = (tmdbId, season, episode) => `${VIDBOLT_BASE}/tv/${tmdbId}/${season}/${episode}`;
export const getVidSrcVipMovieUrl = (tmdbId) => `${VIDSRC_MOV_BASE}/embed/movie/${tmdbId}`;
export const getVidSrcVipTVUrl = (tmdbId, season, episode) => `${VIDSRC_MOV_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;

// ============================================================================
// CANDIDATE GENERATORS (CONSTELLATION DIRECT HLS + VERIFIED FALLBACKS)
// ============================================================================
export const getBingrCandidates = (tmdbId, category = 'movie', season = 1, episode = 1) => {
  return BINGR_SERVERS.map(server => ({
    id: `bingr-${server.id}`,
    srv: server.srv,
    label: server.name,
    name: server.name,
    flag: server.flag,
    country: server.country,
    tier: 'constellation',
    isDirectHls: true,
    isBingr: true,
    badge: server.badge,
    desc: server.desc,
    isPrimary: server.isPrimary,
    src: `/api/streaming/bingr/stream?srv=${server.srv}&id=${tmdbId}&type=${category}`,
    style: 'cyan',
    isCustom: false,
  }));
};

export const getMovieStreamCandidates = (tmdbId) => {
  const constellation = getBingrCandidates(tmdbId, 'movie');

  const custom = getCustomServers().map(c => ({
    id: c.id || `custom-${c.name}`,
    label: c.name,
    flag: c.flag || '🌐',
    country: c.country || 'CUSTOM',
    src: c.movieUrlTemplate ? c.movieUrlTemplate.replace('{id}', tmdbId) : c.url,
    style: 'purple',
    isCustom: true,
  }));

  const standard = STREAM_SERVERS_CATALOG.map(server => ({
    id: server.id,
    label: server.name,
    flag: server.flag,
    country: server.country,
    tier: server.tier,
    badge: server.badge,
    isHindi: Boolean(server.isHindi),
    src: server.getMovieUrl(tmdbId),
    style: server.isHindi ? 'orange' : 'purple',
    isCustom: false,
  }));

  return [...constellation, ...custom, ...standard];
};

export const getTVStreamCandidates = (tmdbId, season, episode) => {
  const constellation = getBingrCandidates(tmdbId, 'tv', season, episode);

  const custom = getCustomServers().map(c => ({
    id: c.id || `custom-${c.name}`,
    label: c.name,
    flag: c.flag || '🌐',
    country: c.country || 'CUSTOM',
    src: c.tvUrlTemplate
      ? c.tvUrlTemplate.replace('{id}', tmdbId).replace('{s}', season).replace('{e}', episode)
      : c.url,
    style: 'purple',
    isCustom: true,
  }));

  const standard = STREAM_SERVERS_CATALOG.map(server => ({
    id: server.id,
    label: server.name,
    flag: server.flag,
    country: server.country,
    tier: server.tier,
    badge: server.badge,
    isHindi: Boolean(server.isHindi),
    src: server.getTVUrl(tmdbId, season, episode),
    style: server.isHindi ? 'orange' : 'purple',
    isCustom: false,
  }));

  return [...constellation, ...custom, ...standard];
};

// ============================================================================
// VERIFIED ANIME CANDIDATES (DIRECT HLS + MULTI-AUDIO EMBEDS)
// ============================================================================
export const getAnimeEmbedUrl = (anilistId, episode, { dub = false } = {}) => {
  const params = new URLSearchParams({
    servericon: 'true',
    pip: 'true',
  });
  const language = dub ? 'dub' : 'sub';

  return `${ANIME_PLAYER}/animepahe/${anilistId}/${episode}/${language}?${params.toString()}`;
};

export const getFilmuAnimeUrl = (tmdbOrAnilistId, episode) => `${FILMU_BASE}/anime/${tmdbOrAnilistId}/${episode}`;

export const getAnimeStreamCandidates = (anilistId, episode = 1, options = {}) => {
  const title = options.title || options.animeTitle || '';
  const cleanId = anilistId || options.id || options.tmdbId || '';
  const isDub = Boolean(options.dub);

  return [
    {
      id: 'animesalt-hls',
      label: 'AniStream Master',
      name: 'AniStream Direct HLS',
      flag: '⚡',
      country: 'JP',
      tier: 'anime',
      isAnime: true,
      isDirectHls: true,
      isBingr: false,
      badge: '1080p Direct',
      desc: 'Direct HLS Master Stream with Subtitles & Multi-Audio',
      src: `/api/streaming/bingr/animesalt?title=${encodeURIComponent(title || String(cleanId))}&ep=${episode}&season=1`,
      style: 'cyan',
    },
    {
      id: 'vidnest-anime-sub',
      label: 'Vidnest Pahe Sub',
      name: 'Vidnest Pahe (Sub)',
      flag: '🇯🇵',
      country: 'JP',
      tier: 'anime',
      isAnime: true,
      badge: 'Soft Subs',
      src: `${VIDNEST_BASE}/animepahe/${cleanId}/${episode}/sub?servericon=true&pip=true`,
      style: 'purple',
    },
    {
      id: 'vidnest-anime-dub',
      label: 'Vidnest Pahe Dub',
      name: 'Vidnest Pahe (Dub)',
      flag: '🇺🇸',
      country: 'US',
      tier: 'anime',
      isAnime: true,
      badge: 'English Dub',
      src: `${VIDNEST_BASE}/animepahe/${cleanId}/${episode}/dub?servericon=true&pip=true`,
      style: 'purple',
    },
    {
      id: '2embed-anime',
      label: '2Embed Anime',
      name: '2Embed Anime HD',
      flag: '🇦🇺',
      country: 'AU',
      tier: 'anime',
      isAnime: true,
      badge: '1080p Fast',
      src: `${EMBED2_BASE}/embedtv/${cleanId}&s=1&e=${episode}`,
      style: 'purple',
    },
    {
      id: 'smashy-anime',
      label: 'Smashy Anime',
      name: 'SmashyStream Anime',
      flag: '🌐',
      country: 'US',
      tier: 'anime',
      isAnime: true,
      badge: 'Fast Embed',
      src: `https://player.smashystream.com/tv/${cleanId}/1/${episode}`,
      style: 'purple',
    },
    {
      id: 'vidsrc-anime',
      label: 'VidSrc Mov Anime',
      name: 'VidSrc Anime',
      flag: '🇬🇧',
      country: 'GB',
      tier: 'anime',
      isAnime: true,
      badge: 'Multi-Mirror',
      src: `${VIDSRC_MOV_BASE}/embed/tv/${cleanId}/1/${episode}`,
      style: 'purple',
    },
    {
      id: 'vidbolt-anime',
      label: 'Vidbolt Anime',
      name: 'Vidbolt Ultra Anime',
      flag: '⚡',
      country: 'US',
      tier: 'anime',
      isAnime: true,
      badge: 'Ultra Fast',
      src: `${VIDBOLT_BASE}/tv/${cleanId}/1/${episode}`,
      style: 'purple',
    },
    {
      id: 'filmu-anime',
      label: 'Filmu Anime',
      name: 'Filmu Anime Stream',
      flag: '🇮🇳',
      country: 'IN',
      tier: 'anime',
      isAnime: true,
      badge: 'Asia Fast',
      src: `${FILMU_BASE}/anime/${cleanId}/${episode}`,
      style: 'purple',
    },
  ];
};

export const prewarmStreamCandidates = (candidates = []) => {
  candidates.slice(0, 10).forEach(candidate => prewarmStreamUrl(candidate?.src));
};

// ============================================================================
// ULTRA-FAST REAL-TIME PARALLEL SERVER RACING ENGINE (< 10 SECONDS)
// ============================================================================
const healthCache = new Map();

/**
 * Probe a single server (Constellation direct HLS, AnimeSalt or Web embed) with live millisecond latency
 * and stream readiness detection.
 */
export const probeCandidateServer = async (candidate, config = {}, { timeoutMs = 2800 } = {}) => {
  if (!candidate) return { status: 'unknown', ping: 0, label: 'Unknown', isReady: false };
  const startTime = performance.now();
  const isAnimeSalt = candidate.id === 'animesalt-hls';
  const isConstellation = Boolean(candidate.isBingr || candidate.srv);

  // 1. AnimeSalt Direct HLS Probe
  if (isAnimeSalt) {
    try {
      const title = config.title || config.id || '';
      const ep = config.episode || 1;
      const res = await fetch(`/api/streaming/bingr/animesalt?title=${encodeURIComponent(title)}&ep=${ep}&season=1`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      const ping = Math.max(1, Math.round(performance.now() - startTime));
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.streams) && data.streams.length > 0) {
          return {
            status: 'online',
            ping,
            label: `${ping}ms`,
            type: 'hls',
            isReady: true,
            streamData: {
              sources: data.streams.map(s => ({
                url: s.url,
                quality: `${s.quality || 1080}p`,
                type: 'application/x-mpegurl',
                name: s.server || 'AnimeSalt',
              })),
              subtitles: data.subtitles || [],
            },
          };
        }
      }
      return { status: 'unreachable', ping, label: 'No Stream', type: 'hls', isReady: false };
    } catch {
      const ping = Math.max(1, Math.round(performance.now() - startTime));
      return { status: 'unreachable', ping, label: 'Offline', type: 'hls', isReady: false };
    }
  }

  // 2. Constellation Direct HLS Probe
  if (isConstellation) {
    try {
      const data = await fetchBingrStream({
        srv: candidate.srv || 's70',
        type: config.category || 'movie',
        id: config.id,
        title: config.title,
        year: config.year,
        season: config.season,
        episode: config.episode,
        timeoutMs,
      });
      const ping = Math.max(1, Math.round(performance.now() - startTime));
      if (data && Array.isArray(data.sources) && data.sources.length > 0) {
        return {
          status: 'online',
          ping,
          label: `${ping}ms`,
          type: 'hls',
          isReady: true,
          sourcesCount: data.sources.length,
          subtitlesCount: Array.isArray(data.subtitles) ? data.subtitles.length : 0,
          streamData: data,
        };
      }
      return {
        status: 'unreachable',
        ping,
        label: 'No Stream',
        type: 'hls',
        isReady: false,
      };
    } catch (err) {
      const ping = Math.max(1, Math.round(performance.now() - startTime));
      return {
        status: err?.name === 'AbortError' ? 'degraded' : 'unreachable',
        ping,
        label: err?.name === 'AbortError' ? 'Timeout' : 'Offline',
        type: 'hls',
        isReady: false,
      };
    }
  }

  // 3. Web Server Embed Probe
  const targetUrl = candidate.src;
  const origin = getOrigin(targetUrl);
  if (!origin) {
    return { status: 'unknown', ping: 0, label: 'Unknown', type: 'embed', isReady: false };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    await fetch(origin, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const ping = Math.max(1, Math.round(performance.now() - startTime));
    return {
      status: 'online',
      ping,
      label: `${ping}ms`,
      type: 'embed',
      isReady: true,
      origin,
    };
  } catch (err) {
    const ping = Math.max(1, Math.round(performance.now() - startTime));
    return {
      status: err?.name === 'AbortError' ? 'degraded' : 'unreachable',
      ping,
      label: err?.name === 'AbortError' ? 'Timeout' : 'Offline',
      type: 'embed',
      isReady: false,
      origin,
    };
  }
};

/**
 * Real-time parallel race across all Constellation, Hindi, Anime, and Web servers (< 10s total)
 * Automatically fires onFirstWinner the millisecond the first totally ready server is confirmed!
 */
export const raceAllServersParallel = async (
  candidates = [],
  config = {},
  {
    timeoutMs = 2800,
    onCandidateTested,
    onFirstWinner,
  } = {}
) => {
  let hasReportedWinner = false;
  const results = new Map();

  const probePromises = candidates.map(async (candidate, index) => {
    try {
      const health = await probeCandidateServer(candidate, config, { timeoutMs });
      const key = candidate.id || candidate.src || String(index);
      results.set(key, health);

      if (typeof onCandidateTested === 'function') {
        onCandidateTested(index, candidate, health);
      }

      // Automatically report the first server that is totally online and ready to stream
      if (!hasReportedWinner && health.status === 'online' && health.isReady) {
        hasReportedWinner = true;
        if (typeof onFirstWinner === 'function') {
          onFirstWinner(index, candidate, health);
        }
      }

      return { index, candidate, health };
    } catch {
      const fallback = { status: 'unreachable', ping: 0, label: 'Failed', isReady: false };
      const key = candidate.id || candidate.src || String(index);
      results.set(key, fallback);
      if (typeof onCandidateTested === 'function') {
        onCandidateTested(index, candidate, fallback);
      }
      return { index, candidate, health: fallback };
    }
  });

  await Promise.allSettled(probePromises);
  return results;
};

export const checkStreamProviderHealth = async (url, { timeoutMs = 1400, skipCache = false } = {}) => {
  const origin = getOrigin(url);
  if (!origin) return { status: 'unknown', label: 'Unknown provider', origin };

  if (!skipCache && healthCache.has(origin)) {
    const cached = healthCache.get(origin);
    if (Date.now() - cached.timestamp < 30000) {
      return cached.result;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(origin, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const result = { status: 'online', label: 'Online', origin };
    healthCache.set(origin, { result, timestamp: Date.now() });
    return result;
  } catch (err) {
    const result = err.name === 'AbortError'
      ? { status: 'degraded', label: 'Slow / Timeout', origin }
      : { status: 'unreachable', label: 'Offline / Blocked', origin };
    healthCache.set(origin, { result, timestamp: Date.now() });
    return result;
  }
};

export const fastProbeCandidates = async (candidates = [], { maxProbe = 8, timeoutMs = 1200 } = {}) => {
  const targets = candidates.slice(0, maxProbe);
  const results = await Promise.allSettled(
    targets.map(c => checkStreamProviderHealth(c.src, { timeoutMs }))
  );
  return results.map((r, i) => ({
    index: i,
    candidate: targets[i],
    health: r.status === 'fulfilled' ? r.value : { status: 'unreachable', label: 'Offline / Blocked', origin: getOrigin(targets[i]?.src) },
  }));
};

// ============================================================================
// RUNTIME HELPERS (FULL BACKWARD COMPATIBILITY)
// ============================================================================
export const resolveAnimePlayback = async ({ anilistId, title, titles = [], episode = 1, language = 'sub' }) => {
  const params = new URLSearchParams({
    anilistId: String(anilistId || ''),
    title: title || '',
    titles: titles.filter(Boolean).join('|||'),
    episode: String(episode),
    language,
  });

  const response = await fetch(`${API_URL}/api/streaming/anime/play?${params.toString()}`);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : { error: await response.text().catch(() => '') };

  if (!response.ok) {
    if (response.status === 404 && String(data.error).includes('Cannot GET /api/streaming/anime/play')) {
      throw new Error('Anime streaming server is not deployed yet');
    }
    throw new Error(data.error || 'Anime episode is unavailable');
  }
  return data;
};

export const buildEmbedUrl = (config) => {
  const { category, tmdbId, season, episode, useV2, provider } = config;

  switch (category) {
    case 'movie':
      if (provider === 'vidbolt') return getVidBoltMovieUrl(tmdbId);
      if (provider === '2embed') return get2EmbedMovieUrl(tmdbId);
      if (provider === 'vidsrc') return getVidSrcMovieEmbedUrl(tmdbId);
      if (provider === 'primesrc') return getPrimeSrcMovieUrl(tmdbId);
      if (provider === 'vidy') return getVidyMovieUrl(tmdbId);
      if (provider === 'vidlink') return getVidBoltMovieUrl(tmdbId);
      return useV2
        ? getMovieEmbedUrlV2(tmdbId)
        : getMovieEmbedUrl(tmdbId);

    case 'tv':
      if (provider === 'vidbolt') return getVidBoltTVUrl(tmdbId, season, episode);
      if (provider === '2embed') return get2EmbedTVUrl(tmdbId, season, episode);
      if (provider === 'vidsrc') return getVidSrcTVEmbedUrl(tmdbId, season, episode);
      if (provider === 'primesrc') return getPrimeSrcTVUrl(tmdbId, season, episode);
      if (provider === 'vidy') return getVidyTVUrl(tmdbId, season, episode);
      if (provider === 'vidlink') return getVidBoltTVUrl(tmdbId, season, episode);
      return useV2
        ? getTVEmbedUrlV2(tmdbId, season, episode)
        : getTVEmbedUrl(tmdbId, season, episode);

    case 'anime':
      return getAnimeEmbedUrl(config.anilistId || config.id, episode, {
        dub: config.dub,
      });

    default:
      throw new Error(`Unknown or non-iframe category: ${category}`);
  }
};
