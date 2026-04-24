import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import { getMovieCollectionPage, getTVCollectionPage } from '../api/tmdb';
import { getAnimeCollectionPage } from '../api/anilist';

const LIST_TITLES = {
  movie: {
    trending: 'Trending Movies',
    popular: 'Popular Movies',
    'top-rated': 'Top Rated Movies',
  },
  tv: {
    trending: 'Trending TV Series',
    popular: 'Popular TV Series',
  },
  anime: {
    trending: 'Trending Anime',
    seasonal: 'This Season',
    popular: 'All Time Popular Anime',
  },
};

const fetchCollection = (category, collection, page) => {
  if (category === 'movie') return getMovieCollectionPage(collection, page);
  if (category === 'tv') return getTVCollectionPage(collection, page);
  if (category === 'anime') return getAnimeCollectionPage(collection, page);
  throw new Error('Unknown collection');
};

export default function StreamingListPage() {
  const { category, collection } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const title = LIST_TITLES[category]?.[collection] || 'StreamZone';

  const loadPage = useCallback(async (targetPage, replace = false) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchCollection(category, collection, targetPage);
      const nextItems = data.results || [];
      setItems(prev => replace ? nextItems : [...prev, ...nextItems]);
      setPage(targetPage);
      setHasNextPage(Boolean(data.hasNextPage || targetPage < (data.total_pages || 1)));
    } catch (loadError) {
      setError(loadError.message || 'Could not load this collection');
    } finally {
      setIsLoading(false);
    }
  }, [category, collection]);

  useEffect(() => {
    setItems([]);
    loadPage(1, true);
  }, [loadPage]);

  const routePrefix = useMemo(() => {
    if (category === 'movie') return '/streaming/movie';
    if (category === 'tv') return '/streaming/tv';
    return '/streaming/anime';
  }, [category]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', paddingBottom: 40 }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px',
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: 12, width: 40, height: 40, display: 'grid', placeItems: 'center' }}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{title}</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Browse the full row</p>
        </div>
      </header>

      <main style={{ padding: 16 }}>
        {error && (
          <div style={{ padding: 14, borderRadius: 12, color: '#ffb4b4', background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, alignItems: 'start' }}>
          {items.map(item => (
            <MediaCard
              key={`${category}-${item.id}`}
              item={item}
              category={category}
              onClick={id => navigate(`${routePrefix}/${id}`)}
            />
          ))}
        </div>

        {isLoading && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', padding: 24 }}>Loading...</p>
        )}

        {!isLoading && hasNextPage && (
          <button
            onClick={() => loadPage(page + 1)}
            style={{
              width: '100%',
              marginTop: 24,
              padding: '14px 0',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Load More
          </button>
        )}
      </main>
    </div>
  );
}
