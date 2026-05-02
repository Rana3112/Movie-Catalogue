import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, ListVideo } from 'lucide-react';
import { useAnimeDetail } from '../hooks/useAnime';
import { getAnimeEmbedUrl, getAnimeStreamCandidates, preconnectStreamingProviders, prewarmStreamCandidates, prewarmStreamUrl } from '../api/streams';
import WatchlistButton from '../components/WatchlistButton';
import StreamCalendarButton from '../components/StreamCalendarButton';
import { DetailSkeleton } from '../components/LoadingSkeletons';

export default function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: anime, isLoading } = useAnimeDetail(id);

  useEffect(() => {
    preconnectStreamingProviders();
    if (id) prewarmStreamUrl(getAnimeEmbedUrl(id, 1, { dub: false }));
  }, [id]);

  if (isLoading || !anime) return <DetailSkeleton />;

  const titleOptions = [
    anime.title?.english,
    anime.title?.romaji,
    anime.title?.native,
  ].filter(Boolean);
  const title = titleOptions[0];

  const handleEpisodeSelect = (epNumber) => {
    const streamUrl = getAnimeEmbedUrl(anime.id, epNumber, { dub: false });
    const streamCandidates = getAnimeStreamCandidates(anime.id, epNumber, { dub: false });
    navigate('/streaming/player', {
      state: {
        mode: 'iframe',
        src: streamUrl,
        id: anime.id,
        anilistId: anime.id,
        title,
        episodeTitle: `Episode ${epNumber}`,
        episode: epNumber,
        posterUrl: anime.coverImage?.extraLarge,
        category: 'anime',
        candidates: streamCandidates,
      }
    });
  };

  const handleEpisodePrewarm = (epNumber) => {
    prewarmStreamUrl(getAnimeEmbedUrl(anime.id, epNumber, { dub: false }));
    prewarmStreamCandidates(getAnimeStreamCandidates(anime.id, epNumber, { dub: false }));
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
        <img src={anime.bannerImage || anime.coverImage?.extraLarge} alt={title} />
      </div>

      <main className="streaming-detail-content">
        <section className="streaming-detail-hero">
          <img
            src={anime.coverImage?.extraLarge}
            alt={title}
            className="streaming-detail-poster"
          />

          <div className="streaming-detail-copy">
            <h1 className="streaming-detail-title">{title}</h1>

            <div className="streaming-meta">
              <div className="streaming-meta-item">
                <Star size={15} color="#ffd700" fill="#ffd700" />
                <span style={{ color: '#fff' }}>{anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}</span>
              </div>
              <div className="streaming-meta-item">
                <Calendar size={15} /> {anime.seasonYear || 'N/A'}
              </div>
              <div className="streaming-meta-item">
                <ListVideo size={15} /> {anime.episodes || '?'} Eps
              </div>
            </div>
          </div>

          <div className="streaming-detail-actions">
            <WatchlistButton
              item={{
                id: anime.id,
                title,
                posterUrl: anime.coverImage?.extraLarge,
                category: 'anime',
              }}
              className="streaming-secondary-button"
              label="Save"
            />

            <StreamCalendarButton
              category="anime"
              media={{
                title,
                releaseDate: anime.seasonYear ? `${anime.seasonYear}-01-01` : null,
                year: anime.seasonYear,
                poster: anime.coverImage?.extraLarge,
                genres: anime.genres || [],
                rating: anime.averageScore ? Math.round(anime.averageScore / 20) : 0,
                description: anime.description?.replace(/<[^>]+>/g, ''),
                imdbLink: null,
              }}
            />
          </div>
        </section>

        <section className="streaming-detail-section">
          <h3>Overview</h3>
          <p dangerouslySetInnerHTML={{ __html: anime.description }} />
        </section>

        <div className="streaming-genre-row">
          {anime.genres?.map(g => (
            <span key={g} className="streaming-pill">
              {g}
            </span>
          ))}
        </div>

        <section className="streaming-episodes">
          <h3>Episodes</h3>
          <div className="streaming-anime-grid">
            {Array.from({ length: anime.episodes || 12 }).map((_, i) => (
              <button
                key={`ep-${i + 1}`}
                onPointerEnter={() => handleEpisodePrewarm(i + 1)}
                onPointerDown={() => handleEpisodePrewarm(i + 1)}
                onClick={() => handleEpisodeSelect(i + 1)}
                className="streaming-anime-episode"
              >
                {i + 1}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
