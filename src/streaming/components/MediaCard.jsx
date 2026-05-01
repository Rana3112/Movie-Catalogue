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
      className="streaming-media-card"
    >
      <div className="streaming-media-poster">
        <img 
          src={poster} 
          alt={title} 
        />
        
        <div className="streaming-rating-badge">
          <Star size={10} fill="#ffd700" color="#ffd700" /> {rating}
        </div>

        <div className="streaming-category-badge" style={{ background: badgeColor }}>
          {badgeLabel}
        </div>
      </div>
      
      <p className="streaming-media-title">
        {title}
      </p>
    </div>
  );
}
