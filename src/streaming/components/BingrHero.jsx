import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Star, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { imageUrl } from '../api/tmdb';
import {
  getAnimeEmbedUrl,
  getAnimeStreamCandidates,
  getMovieEmbedUrl,
  getMovieStreamCandidates,
  getTVEmbedUrl,
  getTVStreamCandidates,
  prewarmStreamCandidates,
  prewarmStreamUrl,
} from '../api/streams';
import { fetchBingrTrailer } from '../api/bingrApi';
import WatchlistButton from './WatchlistButton';
import { HeroSkeleton } from './LoadingSkeletons';

export default function BingrHero({ items = [], activeTab }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Auto rotate hero slides every 7 seconds
  useEffect(() => {
    if (!items || items.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [items]);

  const item = items[currentIndex];
  const isAnime = activeTab === 'anime';
  const isTV = activeTab === 'tv';

  // Fetch optional ambient trailer for movie/tv if available
  useEffect(() => {
    let isMounted = true;
    setTrailerUrl(null);
    setVideoLoaded(false);

    if (!item || isAnime) return;

    const imdbId = item.imdb_id;
    if (imdbId) {
      fetchBingrTrailer(imdbId).then((url) => {
        if (isMounted && url) {
          setTrailerUrl(url);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [item, isAnime]);

  if (!items || items.length === 0 || !item) {
    return <HeroSkeleton />;
  }

  const title = isAnime ? (item.title?.english || item.title?.romaji) : (item.title || item.name);
  const overview = isAnime ? item.description?.replace(/<[^>]*>?/gm, '') : item.overview;
  const rating = isAnime
    ? (item.averageScore ? (item.averageScore / 10).toFixed(1) : '8.6')
    : (item.vote_average ? item.vote_average.toFixed(1) : '8.4');
  const releaseYear = isAnime
    ? (item.startDate?.year || 2024)
    : new Date(item.release_date || item.first_air_date || Date.now()).getFullYear();

  const backdropSrc = isAnime
    ? (item.bannerImage || item.coverImage?.extraLarge)
    : imageUrl(item.backdrop_path, 'original') || imageUrl(item.backdrop_path, 'w1280');

  const buildPlayerState = () => {
    if (isTV) {
      const season = 1;
      const episode = 1;
      const streamUrl = getTVEmbedUrl(item.id, season, episode);
      const candidates = getTVStreamCandidates(item.id, season, episode);

      return {
        mode: 'iframe',
        src: streamUrl,
        id: item.id,
        title,
        episodeTitle: 'Episode 1',
        season,
        episode,
        posterUrl: imageUrl(item.poster_path, 'w500'),
        category: 'tv',
        candidates,
      };
    }

    if (isAnime) {
      const episode = 1;
      const streamUrl = getAnimeEmbedUrl(item.id, episode, { dub: false });
      const candidates = getAnimeStreamCandidates(item.id, episode, { dub: false });

      return {
        mode: 'iframe',
        src: streamUrl,
        id: item.id,
        anilistId: item.id,
        title,
        episodeTitle: 'Episode 1',
        episode,
        posterUrl: item.coverImage?.extraLarge,
        category: 'anime',
        candidates,
      };
    }

    const streamUrl = getMovieEmbedUrl(item.id);
    const candidates = getMovieStreamCandidates(item.id);

    return {
      mode: 'iframe',
      src: streamUrl,
      id: item.id,
      title,
      posterUrl: imageUrl(item.poster_path, 'w500'),
      category: 'movie',
      candidates,
    };
  };

  const prewarmHeroStream = () => {
    const playerState = buildPlayerState();
    prewarmStreamUrl(playerState.src);
    prewarmStreamCandidates(playerState.candidates);
  };

  const handlePlayClick = () => {
    const playerState = buildPlayerState();
    prewarmStreamUrl(playerState.src);
    prewarmStreamCandidates(playerState.candidates);
    navigate('/streaming/player', { state: playerState });
  };

  const handleDetailsClick = () => {
    if (isAnime) {
      navigate(`/streaming/anime/${item.id}`);
    } else if (isTV) {
      navigate(`/streaming/tv/${item.id}`);
    } else {
      navigate(`/streaming/movie/${item.id}`);
    }
  };

  return (
    <div className="bingr-hero-container">
      {/* Background Media Layer */}
      <div className="bingr-hero-backdrop-wrap">
        {trailerUrl ? (
          <video
            ref={videoRef}
            src={trailerUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            className={`bingr-hero-video ${videoLoaded ? 'is-visible' : ''}`}
          />
        ) : null}

        <img
          src={backdropSrc}
          alt={title}
          className={`bingr-hero-image ${trailerUrl && videoLoaded ? 'is-hidden' : 'is-visible'}`}
        />

        {/* Ambient Dark Gradients */}
        <div className="bingr-hero-vignette" />
        <div className="bingr-hero-bottom-fade" />
      </div>

      {/* Hero Content Overlay */}
      <div className="bingr-hero-content">
        {/* Meta Pill Badges */}
        <div className="bingr-hero-meta-row">
          <span className="bingr-meta-badge bingr-rating-badge">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span>{rating}</span>
          </span>

          <span className="bingr-meta-badge bingr-year-badge">
            {releaseYear}
          </span>

          <span className="bingr-meta-badge bingr-quality-badge">
            4K ULTRA HD
          </span>

          <span className="bingr-meta-badge bingr-tag-badge">
            {isAnime ? 'ANIME' : isTV ? 'TV SERIES' : 'FEATURE FILM'}
          </span>

          <span className="bingr-meta-badge bingr-cert-badge">
            {isAnime ? '16+' : 'PG-13'}
          </span>
        </div>

        {/* Cinematic Title */}
        <h1 className="bingr-hero-title">
          {title}
        </h1>

        {/* Overview Synopsis */}
        <p className="bingr-hero-overview">
          {overview || 'Experience this masterclass title in stunning 4K streaming quality with multi-provider failover and immersive audio.'}
        </p>

        {/* Action Buttons */}
        <div className="bingr-hero-actions">
          <button
            onPointerEnter={prewarmHeroStream}
            onPointerDown={prewarmHeroStream}
            onClick={handlePlayClick}
            className="bingr-primary-btn"
          >
            <Play size={18} fill="#ffffff" />
            <span>Watch Now</span>
          </button>

          <WatchlistButton
            item={{
              id: item.id,
              title: title,
              posterUrl: isAnime ? item.coverImage?.extraLarge : imageUrl(item.poster_path, 'w185'),
              category: activeTab,
            }}
            className="bingr-watchlist-btn"
          />

          <button
            onClick={handleDetailsClick}
            className="bingr-secondary-btn"
            title="View Details, Cast & Episodes"
          >
            <Info size={18} />
            <span>Details</span>
          </button>

          {trailerUrl && videoLoaded && (
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className="bingr-sound-btn"
              title={isMuted ? 'Unmute Trailer' : 'Mute Trailer'}
            >
              {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          )}
        </div>
      </div>

      {/* Hero Carousel Navigation Pill Dots */}
      <div className="bingr-hero-indicators">
        {items.slice(0, 6).map((slide, idx) => (
          <button
            key={`slide-dot-${slide.id || idx}`}
            onClick={() => setCurrentIndex(idx)}
            className={`bingr-hero-indicator-bar ${idx === currentIndex ? 'is-active' : ''}`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
