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
    <div className="streaming-hero">
      {items.map((imgItem, idx) => (
        <img
          key={`hero-bg-${imgItem.id}`}
          src={isAnime ? (imgItem.bannerImage || imgItem.coverImage?.extraLarge) : imageUrl(imgItem.backdrop_path, 'w1280')}
          alt="hero"
          className={`streaming-hero-image ${idx === currentIndex ? 'is-active' : ''}`}
        />
      ))}
      
      <div className="streaming-hero-overlay" />

      <div className="streaming-hero-content">
        <h1 className="streaming-hero-title">
          {title}
        </h1>
        <p className="streaming-hero-overview">
          {overview}
        </p>
        
        <div className="streaming-actions">
          <button 
            onClick={handlePlayClick}
            className="streaming-primary-button"
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
            className="streaming-watchlist-button"
          />
        </div>
      </div>
      
      <div className="streaming-hero-dots">
        {items.map((_, i) => (
          <div 
            key={i} 
            className={`streaming-hero-dot ${i === currentIndex ? 'is-active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
