const VIDZEE = (import.meta.env.VITE_VIDZEE_PLAYER || 'https://player.vidzee.wtf').replace(/\/+$/, '');
const ANIME_PLAYER = (import.meta.env.VITE_ANIME_PLAYER || 'https://vidnest.fun').replace(/\/+$/, '');
const API_URL = (import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com').replace(/\/+$/, '');

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

export const preconnectStreamingProviders = () => {
  [VIDZEE, ANIME_PLAYER, API_URL]
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
  if (prefetchedUrls.has(url)) return;
  prefetchedUrls.add(url);
  addHeadLink({ rel: 'prefetch', href: url, as: 'document' });
};

export const getMovieEmbedUrl = (tmdbId) =>
  `${VIDZEE}/embed/movie/${tmdbId}`;

export const getTVEmbedUrl = (tmdbId, season, episode) =>
  `${VIDZEE}/embed/tv/${tmdbId}/${season}/${episode}`;

export const getMovieEmbedUrlV2 = (tmdbId) =>
  `${VIDZEE}/v2/embed/movie/${tmdbId}`;

export const getTVEmbedUrlV2 = (tmdbId, season, episode) =>
  `${VIDZEE}/v2/embed/tv/${tmdbId}/${season}/${episode}`;

export const getAnimeEmbedUrl = (anilistId, episode, { dub = false } = {}) => {
  const params = new URLSearchParams({
    servericon: 'true',
    pip: 'true',
  });
  const language = dub ? 'dub' : 'sub';

  return `${ANIME_PLAYER}/animepahe/${anilistId}/${episode}/${language}?${params.toString()}`;
};

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
  const { category, tmdbId, season, episode, useV2 } = config;

  switch (category) {
    case 'movie':
      return useV2
        ? getMovieEmbedUrlV2(tmdbId)
        : getMovieEmbedUrl(tmdbId);

    case 'tv':
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
