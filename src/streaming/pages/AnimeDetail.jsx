import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, ListVideo } from 'lucide-react';
import { useAnimeDetail } from '../hooks/useAnime';
import { getAnimeEmbedUrl } from '../api/streams';
import WatchlistButton from '../components/WatchlistButton';
import { DetailSkeleton } from '../components/LoadingSkeletons';

export default function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: anime, isLoading } = useAnimeDetail(id);

  if (isLoading || !anime) return <DetailSkeleton />;

  const titleOptions = [
    anime.title?.english,
    anime.title?.romaji,
    anime.title?.native,
  ].filter(Boolean);
  const title = titleOptions[0];
  
  const handleEpisodeSelect = (epNumber) => {
    navigate('/streaming/player', {
      state: {
        mode: 'iframe',
        src: getAnimeEmbedUrl(anime.id, epNumber, { dub: false }),
        id: anime.id,
        anilistId: anime.id,
        title,
        episodeTitle: `Episode ${epNumber}`,
        episode: epNumber,
        posterUrl: anime.coverImage?.extraLarge,
        category: 'anime',
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
          src={anime.bannerImage || anime.coverImage?.extraLarge} 
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0f, transparent)' }} />
      </div>

      {/* Content Meta */}
      <div style={{ padding: '0 16px', marginTop: -60, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <img 
            src={anime.coverImage?.extraLarge} 
            alt={title}
            style={{ width: 110, height: 165, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, marginTop: 40 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{title}</h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.7)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={14} color="#ffd700" fill="#ffd700" />
                <span style={{ color: '#fff', fontWeight: 600 }}>{anime.averageScore ? (anime.averageScore/10).toFixed(1) : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} /> {anime.seasonYear || 'N/A'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ListVideo size={14} /> {anime.episodes || '?'} Eps
              </div>
            </div>
            
            <div style={{ marginTop: 16 }}>
              <WatchlistButton 
                item={{
                  id: anime.id,
                  title: title,
                  posterUrl: anime.coverImage?.extraLarge,
                  category: 'anime',
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
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: anime.description }} />
        </div>

        {/* Genres */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {anime.genres?.map(g => (
            <span key={g} style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', fontSize: 12 }}>
              {g}
            </span>
          ))}
        </div>

        {/* Simple Episode Grid */}
        <div style={{ marginTop: 32 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700, color: '#fff' }}>Episodes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 8 }}>
            {Array.from({ length: anime.episodes || 12 }).map((_, i) => (
              <button
                key={`ep-${i+1}`}
                onClick={() => handleEpisodeSelect(i + 1)}
                style={{
                  padding: '12px 0',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
