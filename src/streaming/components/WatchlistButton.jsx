import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useStreamingStore } from '../store/useStreamingStore';

export default function WatchlistButton({ item, style }) {
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
    <button onClick={handleToggle} style={style}>
      {inWatchlist ? <BookmarkCheck size={22} color={style?.color || 'currentColor'} /> : <Bookmark size={22} color={style?.color || 'currentColor'} />}
    </button>
  );
}
