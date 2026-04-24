import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Star, Calendar, Clock } from 'lucide-react';
import { useMovieDetail } from '../hooks/useMovies';
import { imageUrl } from '../api/tmdb';
import { getMovieEmbedUrl } from '../api/streams';
import WatchlistButton from '../components/WatchlistButton';
import { DetailSkeleton } from '../components/LoadingSkeletons';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: movie, isLoading } = useMovieDetail(id);

  if (isLoading || !movie) return <DetailSkeleton />;

  const handlePlay = () => {
    navigate('/streaming/player', {
      state: {
        mode: 'iframe',
        src: getMovieEmbedUrl(id),
        id: movie.id,
        title: movie.title,
        posterUrl: imageUrl(movie.poster_path, 'w500'),
        category: 'movie',
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#fff', paddingBottom: 40 }}>
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 10,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          border: 'none', borderRadius: '50%',
          width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer'
        }}
      >
        <ArrowLeft size={24} />
      </button>

      {/* Backdrop */}
      <div style={{ width: '100%', height: 300, position: 'relative' }}>
        <img 
          src={imageUrl(movie.backdrop_path, 'w1280')} 
          alt={movie.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0f, transparent)' }} />
      </div>

      {/* Content Meta */}
      <div style={{ padding: '0 16px', marginTop: -60, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <img 
            src={imageUrl(movie.poster_path, 'w342')} 
            alt={movie.title}
            style={{ width: 110, height: 165, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, marginTop: 40 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{movie.title}</h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.7)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={14} color="#ffd700" fill="#ffd700" />
                <span style={{ color: '#fff', fontWeight: 600 }}>{movie.vote_average?.toFixed(1)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} /> {movie.release_date?.slice(0, 4)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={14} /> {movie.runtime}m
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button 
            onClick={handlePlay}
            style={{ 
              flex: 1, padding: '14px 0', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #e50914, #ff6b35)', color: '#fff',
              fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer'
            }}
          >
            <Play size={20} fill="#fff" /> Play Movie
          </button>
          
          <WatchlistButton 
            item={{
              id: movie.id,
              title: movie.title,
              posterUrl: imageUrl(movie.poster_path, 'w500'),
              category: 'movie',
            }} 
            style={{ 
              width: 50, height: 50, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer'
            }} 
          />
        </div>

        {/* Overview */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700 }}>Overview</h3>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            {movie.overview}
          </p>
        </div>

        {/* Genres */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {movie.genres?.map(g => (
            <span key={g.id} style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', fontSize: 12 }}>
              {g.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
