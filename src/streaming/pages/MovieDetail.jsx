import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Star, Calendar, Clock } from 'lucide-react';
import { useMovieDetail } from '../hooks/useMovies';
import { imageUrl } from '../api/tmdb';
import { getMovieEmbedUrl, getMovieStreamCandidates, prewarmStreamCandidates, prewarmStreamUrl } from '../api/streams';
import WatchlistButton from '../components/WatchlistButton';
import StreamCalendarButton from '../components/StreamCalendarButton';
import { DetailSkeleton } from '../components/LoadingSkeletons';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: movie, isLoading } = useMovieDetail(id);
  const streamUrl = useMemo(() => getMovieEmbedUrl(id), [id]);
  const streamCandidates = useMemo(() => getMovieStreamCandidates(id), [id]);

  useEffect(() => {
    prewarmStreamUrl(streamUrl);
    prewarmStreamCandidates(streamCandidates);
  }, [streamUrl, streamCandidates]);

  if (isLoading || !movie) return <DetailSkeleton />;

  const handlePlay = () => {
    navigate('/streaming/player', {
      state: {
        mode: 'iframe',
        src: streamUrl,
        id: movie.id,
        title: movie.title,
        posterUrl: imageUrl(movie.poster_path, 'w500'),
        category: 'movie',
        candidates: streamCandidates,
      }
    });
  };

  return (
    <div className="streaming-page streaming-detail">
      <button
        onClick={() => navigate(-1)}
        className="streaming-icon-button"
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 10 }}
        aria-label="Back"
      >
        <ArrowLeft size={22} />
      </button>

      <div className="streaming-detail-backdrop">
        <img src={imageUrl(movie.backdrop_path, 'w1280')} alt={movie.title} />
      </div>

      <main className="streaming-detail-content">
        <section className="streaming-detail-hero">
          <img
            src={imageUrl(movie.poster_path, 'w342')}
            alt={movie.title}
            className="streaming-detail-poster"
          />

          <div className="streaming-detail-copy">
            <h1 className="streaming-detail-title">{movie.title}</h1>

            <div className="streaming-meta">
              <div className="streaming-meta-item">
                <Star size={15} color="#ffd700" fill="#ffd700" />
                <span style={{ color: '#fff' }}>{movie.vote_average?.toFixed(1)}</span>
              </div>
              <div className="streaming-meta-item">
                <Calendar size={15} /> {movie.release_date?.slice(0, 4)}
              </div>
              <div className="streaming-meta-item">
                <Clock size={15} /> {movie.runtime}m
              </div>
            </div>
          </div>

          <div className="streaming-detail-actions">
            <button
              onPointerEnter={() => prewarmStreamUrl(streamUrl)}
              onPointerDown={() => prewarmStreamUrl(streamUrl)}
              onClick={handlePlay}
              className="streaming-primary-button"
            >
              <Play size={19} fill="#fff" /> Play Movie
            </button>

            <WatchlistButton
              item={{
                id: movie.id,
                title: movie.title,
                posterUrl: imageUrl(movie.poster_path, 'w500'),
                category: 'movie',
              }}
              className="streaming-watchlist-button"
            />

            <StreamCalendarButton
              category="movie"
              media={{
                title: movie.title,
                releaseDate: movie.release_date,
                year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : undefined,
                poster: imageUrl(movie.poster_path, 'w500'),
                genres: movie.genres || [],
                rating: Math.round((movie.vote_average || 0) / 2),
                description: movie.overview,
                imdbLink: movie.external_ids?.imdb_id ? `https://www.imdb.com/title/${movie.external_ids.imdb_id}/` : null,
              }}
            />
          </div>
        </section>

        <section className="streaming-detail-section">
          <h3>Overview</h3>
          <p>{movie.overview}</p>
        </section>

        <div className="streaming-genre-row">
          {movie.genres?.map(g => (
            <span key={g.id} className="streaming-pill">
              {g.name}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
