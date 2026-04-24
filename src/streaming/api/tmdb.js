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
    params: { append_to_response: 'credits,videos,similar' }
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
    params: { append_to_response: 'credits,videos,similar' }
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
