import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MediaCard from './MediaCard';
import { CardSkeleton } from './LoadingSkeletons';

export default function ContentCarousel({ title, items = [], category, onItemClick, isLoading, seeAllTo }) {
  const navigate = useNavigate();

  if (!isLoading && (!items || items.length === 0)) return null;

  return (
    <div style={{ marginTop: 24, paddingLeft: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingRight: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>{title}</h2>
        {seeAllTo && (
          <button
            onClick={() => navigate(seeAllTo)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', fontSize: 13, gap: 2, cursor: 'pointer', padding: '8px 0 8px 12px' }}
          >
            See All <ChevronRight size={14} />
          </button>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, paddingRight: 16, WebkitOverflowScrolling: 'touch' }}>
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
    </div>
  );
}
