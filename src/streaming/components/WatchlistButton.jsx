import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useStreamingStore } from '../store/useStreamingStore';

export default function WatchlistButton({ item, style, className = '', label }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useStreamingStore();
  const inWatchlist = isInWatchlist(item.id);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(item.id);
    } else {
      addToWatchlist({
        id: item.id,
        title: item.title,
        posterUrl: item.posterUrl,
        category: item.category,
        addedAt: Date.now(),
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      style={style}
      className={className}
      aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {inWatchlist ? <BookmarkCheck size={22} color={style?.color || 'currentColor'} /> : <Bookmark size={22} color={style?.color || 'currentColor'} />}
      {label && <span>{label}</span>}
    </button>
  );
}
