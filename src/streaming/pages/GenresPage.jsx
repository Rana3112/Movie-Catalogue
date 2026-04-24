import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import { discoverMoviesByGenre, discoverTVByGenre, getMovieGenres, getTVGenres } from '../api/tmdb';
import { ANIME_GENRES, getAnimeByGenre } from '../api/anilist';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Series' },
  { id: 'anime', label: 'Anime' },
];

const makeGenreKey = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const Section = ({ title, items, category, onClick }) => {
  if (!items?.length) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 19, fontWeight: 800 }}>{title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
        {items.map(item => (
          <MediaCard
            key={`${category}-${item.id}`}
            item={item}
            category={category}
            onClick={id => onClick(category, id)}
          />
        ))}
      </div>
    </section>
  );
};

export default function GenresPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [genreSearch, setGenreSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [movieGenres, setMovieGenres] = useState([]);
  const [tvGenres, setTVGenres] = useState([]);
  const [results, setResults] = useState({ movie: [], tv: [], anime: [] });
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getMovieGenres(), getTVGenres()])
      .then(([movies, tv]) => {
        setMovieGenres(movies);
        setTVGenres(tv);
      })
      .catch(() => setError('Could not load genre lists'));
  }, []);

  const genres = useMemo(() => {
    const sourceGenres = [];
    if (activeTab === 'all' || activeTab === 'movie') {
      movieGenres.forEach(genre => sourceGenres.push({ ...genre, key: makeGenreKey(genre.name), type: 'movie' }));
    }
    if (activeTab === 'all' || activeTab === 'tv') {
      tvGenres.forEach(genre => sourceGenres.push({ ...genre, key: makeGenreKey(genre.name), type: 'tv' }));
    }
    if (activeTab === 'all' || activeTab === 'anime') {
      ANIME_GENRES.forEach(name => sourceGenres.push({ id: name, name, key: makeGenreKey(name), type: 'anime' }));
    }

    const unique = new Map();
    sourceGenres.forEach(genre => {
      if (!unique.has(genre.key)) unique.set(genre.key, { ...genre, types: [genre.type] });
      else unique.get(genre.key).types.push(genre.type);
    });

    return Array.from(unique.values())
      .filter(genre => genre.name.toLowerCase().includes(genreSearch.toLowerCase().trim()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeTab, genreSearch, movieGenres, tvGenres]);

  const loadGenreResults = useCallback(async (genre, targetPage, replace = false) => {
    if (!genre) return;

    setIsLoading(true);
    setError('');
    try {
      const movieGenre = movieGenres.find(item => makeGenreKey(item.name) === genre.key);
      const tvGenre = tvGenres.find(item => makeGenreKey(item.name) === genre.key);
      const shouldLoadMovie = (activeTab === 'all' || activeTab === 'movie') && movieGenre;
      const shouldLoadTV = (activeTab === 'all' || activeTab === 'tv') && tvGenre;
      const shouldLoadAnime = (activeTab === 'all' || activeTab === 'anime') && ANIME_GENRES.some(name => makeGenreKey(name) === genre.key);

      const [movieData, tvData, animeData] = await Promise.all([
        shouldLoadMovie ? discoverMoviesByGenre(movieGenre.id, targetPage) : Promise.resolve(null),
        shouldLoadTV ? discoverTVByGenre(tvGenre.id, targetPage) : Promise.resolve(null),
        shouldLoadAnime ? getAnimeByGenre(genre.name, targetPage) : Promise.resolve(null),
      ]);

      setResults(prev => ({
        movie: replace ? (movieData?.results || []) : [...prev.movie, ...(movieData?.results || [])],
        tv: replace ? (tvData?.results || []) : [...prev.tv, ...(tvData?.results || [])],
        anime: replace ? (animeData?.results || []) : [...prev.anime, ...(animeData?.results || [])],
      }));
      setPage(targetPage);
      setHasNextPage(Boolean(
        (movieData && targetPage < (movieData.total_pages || 1)) ||
        (tvData && targetPage < (tvData.total_pages || 1)) ||
        animeData?.hasNextPage
      ));
    } catch (loadError) {
      setError(loadError.message || 'Could not load genre results');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, movieGenres, tvGenres]);

  useEffect(() => {
    if (!selectedGenre) return;
    setResults({ movie: [], tv: [], anime: [] });
    loadGenreResults(selectedGenre, 1, true);
  }, [activeTab, loadGenreResults, selectedGenre]);

  const selectGenre = (genre) => {
    setSelectedGenre(genre);
    setPage(1);
  };

  const navigateToDetail = (category, id) => {
    const route = category === 'movie' ? 'movie' : category === 'tv' ? 'tv' : 'anime';
    navigate(`/streaming/${route}/${id}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', paddingBottom: 40 }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: 16,
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: 12, width: 40, height: 40, display: 'grid', placeItems: 'center' }}
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 23, fontWeight: 900 }}>Genres</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Find movies, TV series, and anime by mood</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedGenre(null);
                setResults({ movie: [], tv: [], anime: [] });
              }}
              style={{
                flex: '0 0 auto',
                border: 'none',
                borderRadius: 999,
                padding: '9px 14px',
                color: '#fff',
                fontWeight: 800,
                background: activeTab === tab.id ? 'linear-gradient(135deg, #e50914, #ff6b35)' : 'rgba(255,255,255,0.08)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main style={{ padding: 16 }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          marginBottom: 14,
        }}>
          <Search size={18} style={{ position: 'absolute', left: 13, color: 'rgba(255,255,255,0.55)' }} />
          <input
            value={genreSearch}
            onChange={event => setGenreSearch(event.target.value)}
            placeholder="Search genres..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              padding: '13px 14px 13px 42px',
              fontSize: 15,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {genres.map(genre => (
            <button
              key={`${genre.key}-${genre.types.join('-')}`}
              onClick={() => selectGenre(genre)}
              style={{
                flex: '0 0 auto',
                padding: '9px 13px',
                borderRadius: 999,
                border: selectedGenre?.key === genre.key ? '1px solid rgba(255,107,53,0.9)' : '1px solid rgba(255,255,255,0.12)',
                background: selectedGenre?.key === genre.key ? 'rgba(229,9,20,0.24)' : 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: 14, borderRadius: 12, color: '#ffb4b4', background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)', marginTop: 16 }}>
            {error}
          </div>
        )}

        {!selectedGenre && (
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 28, textAlign: 'center' }}>Choose a genre to browse matching titles.</p>
        )}

        {selectedGenre && (
          <>
            <Section title="Movies" items={results.movie} category="movie" onClick={navigateToDetail} />
            <Section title="TV Series" items={results.tv} category="tv" onClick={navigateToDetail} />
            <Section title="Anime" items={results.anime} category="anime" onClick={navigateToDetail} />

            {!isLoading && !results.movie.length && !results.tv.length && !results.anime.length && (
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 28, textAlign: 'center' }}>No titles found for {selectedGenre.name}.</p>
            )}

            {isLoading && (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', padding: 24 }}>Loading...</p>
            )}

            {!isLoading && hasNextPage && (
              <button
                onClick={() => loadGenreResults(selectedGenre, page + 1)}
                style={{
                  width: '100%',
                  marginTop: 24,
                  padding: '14px 0',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontWeight: 800,
                }}
              >
                Load More
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
