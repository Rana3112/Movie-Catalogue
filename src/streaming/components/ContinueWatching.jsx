import { useNavigate } from 'react-router-dom';
import { useStreamingStore } from '../store/useStreamingStore';
import { PlayCircle } from 'lucide-react';

export default function ContinueWatching() {
  const history = useStreamingStore(s => s.history);
  const navigate = useNavigate();

  if (!history || history.length === 0) return null;

  // Show only last 5 items
  const recentHistory = history.slice(0, 5);

  const handleClick = (item) => {
    navigate(`/streaming/${item.category}/${item.id}`);
  };

  return (
    <section className="streaming-carousel">
      <h2 className="streaming-carousel-title" style={{ marginBottom: 14 }}>Continue Watching</h2>
      
      <div className="streaming-carousel-track">
        {recentHistory.map((item, idx) => (
          <div 
            key={`history-${item.id}-${idx}`}
            onClick={() => handleClick(item)}
            style={{ width: 160, flexShrink: 0, position: 'relative', cursor: 'pointer' }}
          >
            <div style={{ position: 'relative', width: '100%', height: 90, borderRadius: 8, overflow: 'hidden', backgroundColor: '#222' }}>
              <img 
                src={item.posterUrl || '/placeholder-poster.png'} 
                alt={item.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} 
              />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayCircle size={32} color="#fff" strokeWidth={1.5} />
              </div>
              
              {/* Progress Bar Mocked */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.3)' }}>
                <div style={{ width: '60%', height: '100%', backgroundColor: '#e50914' }} />
              </div>
            </div>
            
            <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </p>
            {item.episodeTitle && (
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                S{item.season} E{item.episode} - {item.episodeTitle}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
