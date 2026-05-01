import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Star, Calendar, Clock } from 'lucide-react';
import { useMovieDetail } from '../hooks/useMovies';
import { imageUrl } from '../api/tmdb';
import { getMovieEmbedUrl } from '../api/streams';
import WatchlistButton from '../components/WatchlistButton';
import { DetailSkeleton } from '../components/LoadingSkeletons';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: movie, isLoading } = useMovieDetail(id);

  if (isLoading || !movie) return <DetailSkeleton />;

  const handlePlay = () => {
    navigate('/streaming/player', {
      state: {
        mode: 'iframe',
        src: getMovieEmbedUrl(id),
        id: movie.id,
        title: movie.title,
        posterUrl: imageUrl(movie.poster_path, 'w500'),
        category: 'movie',
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

            <div className="streaming-detail-actions">
              <button onClick={handlePlay} className="streaming-primary-button">
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
            </div>
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
