import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import { useUnifiedSearch } from '../hooks/useSearch';
import MediaCard from '../components/MediaCard';

// Hook for debouncing search input
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const { movies, tvShows, anime, isLoading } = useUnifiedSearch(
    debouncedQuery,
    debouncedQuery.length > 2
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#fff', paddingBottom: 40 }}>
      {/* Header Search Bar */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 100, 
        background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)',
        padding: '16px', display: 'flex', alignItems: 'center', gap: 12
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={24} />
        </button>
        
        <div style={{ 
          flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.1)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <SearchIcon size={18} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: 12 }} />
          <input 
            type="text" 
            placeholder="Search movies, tv, anime..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', background: 'transparent', border: 'none', color: '#fff',
              padding: '12px 36px 12px 40px', fontSize: 15, outline: 'none'
            }}
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Results Area */}
      <div style={{ padding: 16 }}>
        {debouncedQuery.length <= 2 ? (
          <div style={{ textAlign: 'center', marginTop: 60, color: 'rgba(255,255,255,0.4)' }}>
            <SearchIcon size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Type at least 3 characters to search</p>
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', marginTop: 60, color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ 
              width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#e50914', 
              borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' 
            }} />
            <p>Searching everywhere...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Movies */}
            {movies?.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Movies</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                  {movies.map(item => (
                    <MediaCard key={`m-${item.id}`} item={item} category="movie" onClick={id => navigate(`/streaming/movie/${id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* TV Shows */}
            {tvShows?.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>TV Series</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                  {tvShows.map(item => (
                    <MediaCard key={`t-${item.id}`} item={item} category="tv" onClick={id => navigate(`/streaming/tv/${id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Anime */}
            {anime?.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Anime</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                  {anime.map(item => (
                    <MediaCard key={`a-${item.id}`} item={item} category="anime" onClick={id => navigate(`/streaming/anime/${id}`)} />
                  ))}
                </div>
              </div>
            )}

            {!movies?.length && !tvShows?.length && !anime?.length && (
              <div style={{ textAlign: 'center', marginTop: 60, color: 'rgba(255,255,255,0.4)' }}>
                <p>No results found for "{debouncedQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
