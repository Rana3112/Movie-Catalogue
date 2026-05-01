import { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Tv } from 'lucide-react';
import { useTVDetail } from '../hooks/useTVShows';
import { imageUrl } from '../api/tmdb';
import { getTVEmbedUrl, preconnectStreamingProviders, prewarmStreamUrl } from '../api/streams';
import WatchlistButton from '../components/WatchlistButton';
import EpisodeList from '../components/EpisodeList';
import { DetailSkeleton } from '../components/LoadingSkeletons';

export default function TVDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tv, isLoading } = useTVDetail(id);

  const getEpisodeStreamUrl = useCallback((season, episode) => (
    getTVEmbedUrl(id, season, episode)
  ), [id]);

  useEffect(() => {
    preconnectStreamingProviders();
  }, []);

  if (isLoading || !tv) return <DetailSkeleton />;

  const handleEpisodeSelect = (season, episode, epName) => {
    const streamUrl = getEpisodeStreamUrl(season, episode);
    navigate('/streaming/player', {
      state: {
        mode: 'iframe',
        src: streamUrl,
        id: tv.id,
        title: tv.name,
        episodeTitle: epName,
        season,
        episode,
        posterUrl: imageUrl(tv.poster_path, 'w500'),
        category: 'tv',
      }
    });
  };

  const handleEpisodePrewarm = (season, episode) => {
    preconnectStreamingProviders();
    prewarmStreamUrl(getEpisodeStreamUrl(season, episode));
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
        <img src={imageUrl(tv.backdrop_path, 'w1280')} alt={tv.name} />
      </div>

      <main className="streaming-detail-content">
        <section className="streaming-detail-hero">
          <img
            src={imageUrl(tv.poster_path, 'w342')}
            alt={tv.name}
            className="streaming-detail-poster"
          />

          <div className="streaming-detail-copy">
            <h1 className="streaming-detail-title">{tv.name}</h1>

            <div className="streaming-meta">
              <div className="streaming-meta-item">
                <Star size={15} color="#ffd700" fill="#ffd700" />
                <span style={{ color: '#fff' }}>{tv.vote_average?.toFixed(1)}</span>
              </div>
              <div className="streaming-meta-item">
                <Calendar size={15} /> {tv.first_air_date?.slice(0, 4)}
              </div>
              <div className="streaming-meta-item">
                <Tv size={15} /> {tv.number_of_seasons} Seasons
              </div>
            </div>

            <div className="streaming-detail-actions">
              <WatchlistButton
                item={{
                  id: tv.id,
                  title: tv.name,
                  posterUrl: imageUrl(tv.poster_path, 'w500'),
                  category: 'tv',
                }}
                className="streaming-secondary-button"
                label="Save"
              />
            </div>
          </div>
        </section>

        <section className="streaming-detail-section">
          <h3>Overview</h3>
          <p>{tv.overview}</p>
        </section>

        <EpisodeList
          tvId={tv.id}
          seasons={tv.seasons}
          onEpisodeSelect={handleEpisodeSelect}
          onEpisodePrewarm={handleEpisodePrewarm}
        />
      </main>
    </div>
  );
}
