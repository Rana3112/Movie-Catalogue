import { Star } from 'lucide-react';
import { imageUrl } from '../api/tmdb';

export default function MediaCard({ item, category, onClick }) {
  const isAnime = category === 'anime';
  const title = isAnime 
    ? (item.title?.english || item.title?.romaji) 
    : (item.title || item.name);
    
  const poster = isAnime 
    ? item.coverImage?.extraLarge 
    : imageUrl(item.poster_path, 'w185');
    
  const rating = isAnime 
    ? (item.averageScore ? (item.averageScore / 10).toFixed(1) : 'N/A') 
    : (item.vote_average ? item.vote_average.toFixed(1) : 'N/A');

  const badgeColor = category === 'movie' ? '#e50914' : category === 'tv' ? '#3b82f6' : '#10b981';
  const badgeLabel = category.toUpperCase();

  return (
    <div 
      onClick={() => onClick(item.id)}
      style={{ width: 140, flexShrink: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      <div style={{ position: 'relative', width: '100%', height: 210, borderRadius: 12, overflow: 'hidden' }}>
        <img 
          src={poster} 
          alt={title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#222' }} 
        />
        
        {/* Rating Badge */}
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#fff' }}>
          <Star size={10} fill="#ffd700" color="#ffd700" /> {rating}
        </div>

        {/* Category Badge */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, background: badgeColor, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
          {badgeLabel}
        </div>
      </div>
      
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {title}
      </p>
    </div>
  );
}
