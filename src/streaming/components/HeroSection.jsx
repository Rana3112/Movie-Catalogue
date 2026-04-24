import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { imageUrl } from '../api/tmdb';
import WatchlistButton from './WatchlistButton';
import { HeroSkeleton } from './LoadingSkeletons';

export default function HeroSection({ items = [], activeTab }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!items || items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return <HeroSkeleton />;

  const item = items[currentIndex];
  // Ensure we have a valid item before rendering
  if (!item) return <HeroSkeleton />;
  
  const isAnime = activeTab === 'anime';
  
  const title = isAnime ? (item.title?.english || item.title?.romaji) : (item.title || item.name);
  const overview = isAnime ? item.description?.replace(/<[^>]*>?/gm, '') : item.overview;
  
  const handlePlayClick = () => {
    navigate(`/streaming/${activeTab}/${item.id}`);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 400, overflow: 'hidden' }}>
      {items.map((imgItem, idx) => (
        <img
          key={`hero-bg-${imgItem.id}`}
          src={isAnime ? (imgItem.bannerImage || imgItem.coverImage?.extraLarge) : imageUrl(imgItem.backdrop_path, 'w1280')}
          alt="hero"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: idx === currentIndex ? 1 : 0,
            transition: 'opacity 1s ease-in-out'
          }}
        />
      ))}
      
      {/* Gradient Overlay */}
      <div 
        style={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(to top, #0a0a0f 0%, rgba(10,10,15,0.4) 50%, transparent 100%)' 
        }} 
      />

      <div style={{ position: 'absolute', bottom: 40, left: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {title}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {overview}
        </p>
        
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button 
            onClick={handlePlayClick}
            style={{ 
              flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #e50914, #ff6b35)', color: '#fff',
              fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer'
            }}
          >
            <Play size={18} fill="#fff" /> Watch Now
          </button>
          
          <WatchlistButton 
            item={{
              id: item.id,
              title: title,
              posterUrl: isAnime ? item.coverImage?.extraLarge : imageUrl(item.poster_path, 'w185'),
              category: activeTab,
            }} 
            style={{ 
              width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer'
            }} 
          />
        </div>
      </div>
      
      {/* Pagination Dots */}
      <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
        {items.map((_, i) => (
          <div 
            key={i} 
            style={{ 
              width: i === currentIndex ? 16 : 6, height: 6, borderRadius: 3,
              backgroundColor: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.3s'
            }} 
          />
        ))}
      </div>
    </div>
  );
}
