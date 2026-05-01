import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MediaCard from './MediaCard';
import { CardSkeleton } from './LoadingSkeletons';

export default function ContentCarousel({ title, items = [], category, onItemClick, isLoading, seeAllTo }) {
  const navigate = useNavigate();

  if (!isLoading && (!items || items.length === 0)) return null;

  return (
    <section className="streaming-carousel">
      <div className="streaming-carousel-header">
        <h2 className="streaming-carousel-title">{title}</h2>
        {seeAllTo && (
          <button
            onClick={() => navigate(seeAllTo)}
            className="streaming-see-all"
          >
            See All <ChevronRight size={14} />
          </button>
        )}
      </div>
      
      <div className="streaming-carousel-track">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={`skeleton-${i}`} />)
        ) : (
          items.map(item => (
            <MediaCard 
              key={`${category}-${item.id}`} 
              item={item} 
              category={category} 
              onClick={onItemClick} 
            />
          ))
        )}
      </div>
    </section>
  );
}
