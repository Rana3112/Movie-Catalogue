import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Tv } from 'lucide-react';
import { useTVDetail } from '../hooks/useTVShows';
import { imageUrl } from '../api/tmdb';
import { getTVEmbedUrl } from '../api/streams';
import WatchlistButton from '../components/WatchlistButton';
import EpisodeList from '../components/EpisodeList';
import { DetailSkeleton } from '../components/LoadingSkeletons';

export default function TVDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tv, isLoading } = useTVDetail(id);

  if (isLoading || !tv) return <DetailSkeleton />;

  const handleEpisodeSelect = (season, episode, epName) => {
    navigate('/streaming/player', {
      state: {
        mode: 'iframe',
        src: getTVEmbedUrl(id, season, episode),
        id: tv.id,
        title: tv.name,
        episodeTitle: epName,
        season,
        episode,
        posterUrl: imageUrl(tv.poster_path, 'w500'),
        category: 'tv',
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
          src={imageUrl(tv.backdrop_path, 'w1280')} 
          alt={tv.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0f, transparent)' }} />
      </div>

      {/* Content Meta */}
      <div style={{ padding: '0 16px', marginTop: -60, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <img 
            src={imageUrl(tv.poster_path, 'w342')} 
            alt={tv.name}
            style={{ width: 110, height: 165, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, marginTop: 40 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{tv.name}</h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.7)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={14} color="#ffd700" fill="#ffd700" />
                <span style={{ color: '#fff', fontWeight: 600 }}>{tv.vote_average?.toFixed(1)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} /> {tv.first_air_date?.slice(0, 4)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tv size={14} /> {tv.number_of_seasons} Seasons
              </div>
            </div>
            
            <div style={{ marginTop: 16 }}>
              <WatchlistButton 
                item={{
                  id: tv.id,
                  title: tv.name,
                  posterUrl: imageUrl(tv.poster_path, 'w500'),
                  category: 'tv',
                }} 
                style={{ 
                  width: '100%', padding: '12px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', cursor: 'pointer', fontWeight: 600
                }} 
              />
            </div>
          </div>
        </div>

        {/* Overview */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700 }}>Overview</h3>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            {tv.overview}
          </p>
        </div>

        {/* Episode List */}
        <EpisodeList 
          tvId={tv.id} 
          seasons={tv.seasons} 
          onEpisodeSelect={handleEpisodeSelect} 
        />
      </div>
    </div>
  );
}
