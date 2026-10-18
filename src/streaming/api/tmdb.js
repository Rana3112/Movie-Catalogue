import axios from 'axios';

const tmdb = axios.create({
  baseURL: import.meta.env.VITE_TMDB_BASE_URL,
  params: { api_key: import.meta.env.VITE_TMDB_API_KEY },
});

export const imageUrl = (path, size = 'w500') => {
  if (!path) return '/placeholder-poster.png';
  return `${import.meta.env.VITE_TMDB_IMAGE_BASE}/${size}${path}`;
};

// ─── Movies ───────────────────────────────────────────────────

export const getTrendingMovies = () =>
  tmdb.get('/trending/movie/week').then(r => r.data.results);

export const getTrendingMoviesPage = (page = 1) =>
  tmdb.get('/trending/movie/week', { params: { page } }).then(r => r.data);

export const getPopularMovies = () =>
  tmdb.get('/movie/popular').then(r => r.data.results);

export const getPopularMoviesPage = (page = 1) =>
  tmdb.get('/movie/popular', { params: { page } }).then(r => r.data);

export const getTopRatedMovies = () =>
  tmdb.get('/movie/top_rated').then(r => r.data.results);

export const getTopRatedMoviesPage = (page = 1) =>
  tmdb.get('/movie/top_rated', { params: { page } }).then(r => r.data);

export const getNowPlayingMovies = () =>
  tmdb.get('/movie/now_playing').then(r => r.data.results);

export const getMovieDetail = (id) =>
  tmdb.get(`/movie/${id}`, {
    params: { append_to_response: 'credits,videos,similar,external_ids' }
  }).then(r => r.data);

export const searchMovies = (query) =>
  tmdb.get('/search/movie', { params: { query } })
    .then(r => r.data.results);

// ─── TV Shows ─────────────────────────────────────────────────

export const getTrendingTV = () =>
  tmdb.get('/trending/tv/week').then(r => r.data.results);

export const getTrendingTVPage = (page = 1) =>
  tmdb.get('/trending/tv/week', { params: { page } }).then(r => r.data);

export const getPopularTV = () =>
  tmdb.get('/tv/popular').then(r => r.data.results);

export const getPopularTVPage = (page = 1) =>
  tmdb.get('/tv/popular', { params: { page } }).then(r => r.data);

export const getTopRatedTV = () =>
  tmdb.get('/tv/top_rated').then(r => r.data.results);

export const getTVDetail = (id) =>
  tmdb.get(`/tv/${id}`, {
    params: { append_to_response: 'credits,videos,similar,external_ids' }
  }).then(r => r.data);

export const getTVSeasonEpisodes = (tvId, season) =>
  tmdb.get(`/tv/${tvId}/season/${season}`)
    .then(r => r.data.episodes);

export const searchTV = (query) =>
  tmdb.get('/search/tv', { params: { query } })
    .then(r => r.data.results);

// ─── Multi Search ─────────────────────────────────────────────

export const searchMulti = (query) =>
  tmdb.get('/search/multi', {
    params: { query }
  }).then(r => r.data.results.filter(r => r.media_type !== 'person'));

export const getMovieGenres = () =>
  tmdb.get('/genre/movie/list').then(r => r.data.genres || []);

export const getTVGenres = () =>
  tmdb.get('/genre/tv/list').then(r => r.data.genres || []);

export const discoverMoviesByGenre = (genreId, page = 1) =>
  tmdb.get('/discover/movie', {
    params: {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page,
    }
  }).then(r => r.data);

export const discoverTVByGenre = (genreId, page = 1) =>
  tmdb.get('/discover/tv', {
    params: {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page,
    }
  }).then(r => r.data);

export const getMovieCollectionPage = (collection, page = 1) => {
  const endpoint = {
    trending: '/trending/movie/week',
    popular: '/movie/popular',
    'top-rated': '/movie/top_rated',
  }[collection];

  if (!endpoint) throw new Error(`Unknown movie collection: ${collection}`);
  return tmdb.get(endpoint, { params: { page } }).then(r => r.data);
};

export const getTVCollectionPage = (collection, page = 1) => {
  const endpoint = {
    trending: '/trending/tv/week',
    popular: '/tv/popular',
  }[collection];

  if (!endpoint) throw new Error(`Unknown TV collection: ${collection}`);
  return tmdb.get(endpoint, { params: { page } }).then(r => r.data);
};

// ─── Studio & Network Discovery ─────────────────────────────
export const discoverStudioMovies = (studio, { page = 1, sortBy = 'popularity.desc' } = {}) => {
  const params = {
    sort_by: sortBy,
    page,
    'vote_count.gte': 5,
  };

  if (studio?.companyIds) {
    params.with_companies = studio.companyIds;
  } else if (studio?.watchProviderIds) {
    params.with_watch_providers = studio.watchProviderIds;
    params.watch_region = 'US';
  } else if (studio?.query) {
    params.with_keywords = studio.query;
  }

  return tmdb.get('/discover/movie', { params }).then(r => r.data);
};

export const discoverStudioTV = (studio, { page = 1, sortBy = 'popularity.desc' } = {}) => {
  const params = {
    sort_by: sortBy,
    page,
    'vote_count.gte': 2,
  };

  if (studio?.networkIds) {
    params.with_networks = studio.networkIds;
  } else if (studio?.companyIds) {
    params.with_companies = studio.companyIds;
  } else if (studio?.query) {
    params.with_keywords = studio.query;
  }

  return tmdb.get('/discover/tv', { params }).then(r => r.data);
};

export const discoverStudioCombined = async (studio, { page = 1, filter = 'all', sortBy = 'popularity.desc' } = {}) => {
  if (!studio) return { results: [], total_pages: 1, total_results: 0, page };

  if (filter === 'movie') {
    const data = await discoverStudioMovies(studio, { page, sortBy });
    return {
      results: (data.results || []).map(item => ({ ...item, media_type: 'movie' })),
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
      page,
      moviesCount: data.total_results || 0,
      tvCount: 0,
    };
  }

  if (filter === 'tv') {
    const data = await discoverStudioTV(studio, { page, sortBy });
    return {
      results: (data.results || []).map(item => ({ ...item, media_type: 'tv' })),
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
      page,
      moviesCount: 0,
      tvCount: data.total_results || 0,
    };
  }

  // filter === 'all'
  const [movieData, tvData] = await Promise.all([
    discoverStudioMovies(studio, { page, sortBy }).catch(() => ({ results: [], total_pages: 1, total_results: 0 })),
    discoverStudioTV(studio, { page, sortBy }).catch(() => ({ results: [], total_pages: 1, total_results: 0 })),
  ]);

  const movies = (movieData.results || []).map(m => ({ ...m, media_type: 'movie' }));
  const tv = (tvData.results || []).map(t => ({ ...t, media_type: 'tv' }));

  // Interleave and sort by popularity
  const combined = [...movies, ...tv].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return {
    results: combined,
    total_pages: Math.max(movieData.total_pages || 1, tvData.total_pages || 1),
    total_results: (movieData.total_results || 0) + (tvData.total_results || 0),
    page,
    moviesCount: movieData.total_results || 0,
    tvCount: tvData.total_results || 0,
  };
};

// ─── Language & Regional Hub Discovery ────────────────────────
export const discoverLanguageMovies = (langCode, { page = 1, sortBy = 'popularity.desc' } = {}) => {
  return tmdb.get('/discover/movie', {
    params: {
      with_original_language: langCode,
      sort_by: sortBy,
      page,
      'vote_count.gte': 5,
    }
  }).then(r => r.data);
};

export const discoverLanguageTV = (langCode, { page = 1, sortBy = 'popularity.desc' } = {}) => {
  return tmdb.get('/discover/tv', {
    params: {
      with_original_language: langCode,
      sort_by: sortBy,
      page,
      'vote_count.gte': 2,
    }
  }).then(r => r.data);
};

export const discoverLanguageCombined = async (langCode, { page = 1, filter = 'all', sortBy = 'popularity.desc' } = {}) => {
  if (!langCode) return { results: [], total_pages: 1, total_results: 0, page };

  if (filter === 'movie') {
    const data = await discoverLanguageMovies(langCode, { page, sortBy });
    return {
      results: (data.results || []).map(item => ({ ...item, media_type: 'movie' })),
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
      page,
      moviesCount: data.total_results || 0,
      tvCount: 0,
    };
  }

  if (filter === 'tv') {
    const data = await discoverLanguageTV(langCode, { page, sortBy });
    return {
      results: (data.results || []).map(item => ({ ...item, media_type: 'tv' })),
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
      page,
      moviesCount: 0,
      tvCount: data.total_results || 0,
    };
  }

  // filter === 'all'
  const [movieData, tvData] = await Promise.all([
    discoverLanguageMovies(langCode, { page, sortBy }).catch(() => ({ results: [], total_pages: 1, total_results: 0 })),
    discoverLanguageTV(langCode, { page, sortBy }).catch(() => ({ results: [], total_pages: 1, total_results: 0 })),
  ]);

  const movies = (movieData.results || []).map(m => ({ ...m, media_type: 'movie' }));
  const tv = (tvData.results || []).map(t => ({ ...t, media_type: 'tv' }));

  const combined = [...movies, ...tv].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return {
    results: combined,
    total_pages: Math.max(movieData.total_pages || 1, tvData.total_pages || 1),
    total_results: (movieData.total_results || 0) + (tvData.total_results || 0),
    page,
    moviesCount: movieData.total_results || 0,
    tvCount: tvData.total_results || 0,
  };
};
