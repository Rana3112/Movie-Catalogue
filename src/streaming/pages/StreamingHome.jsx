import { useNavigate } from 'react-router-dom';
import { Film, Tv, Sword, Search, ChevronLeft, Tags } from 'lucide-react';
import { useTrendingMovies, usePopularMovies, useTopRatedMovies } from '../hooks/useMovies';
import { useTrendingTV, usePopularTV } from '../hooks/useTVShows';
import { useTrendingAnime, usePopularAnime, useSeasonalAnime } from '../hooks/useAnime';
import { useStreamingStore } from '../store/useStreamingStore';
import HeroSection from '../components/HeroSection';
import ContentCarousel from '../components/ContentCarousel';
import ContinueWatching from '../components/ContinueWatching';

export default function StreamingHome() {
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useStreamingStore();

  const { data: trendingMovies, isLoading: isLoadingTM } = useTrendingMovies();
  const { data: popularMovies, isLoading: isLoadingPM } = usePopularMovies();
  const { data: topRatedMovies, isLoading: isLoadingTRM } = useTopRatedMovies();

  const { data: trendingTV, isLoading: isLoadingTTV } = useTrendingTV();
  const { data: popularTV, isLoading: isLoadingPTV } = usePopularTV();

  const { data: trendingAnime, isLoading: isLoadingTA } = useTrendingAnime();
  const { data: popularAnime, isLoading: isLoadingPA } = usePopularAnime();
  const { data: seasonalAnime, isLoading: isLoadingSA } = useSeasonalAnime();

  const tabs = [
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'tv', label: 'TV Series', icon: Tv },
    { id: 'anime', label: 'Anime', icon: Sword },
  ];

  const heroItems = activeTab === 'movies'
    ? trendingMovies?.slice(0, 5)
    : activeTab === 'tv'
      ? trendingTV?.slice(0, 5)
      : trendingAnime?.slice(0, 5);

  return (
    <div className="streaming-page">
      <div className="streaming-topbar">
        <button
          onClick={() => navigate('/home')}
          className="streaming-icon-button"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="streaming-topbar-actions">
          <button
            onClick={() => navigate('/streaming/genres')}
            className="streaming-icon-button"
            aria-label="Genres"
          >
            <Tags size={20} />
          </button>

          <button
            onClick={() => navigate('/streaming/search')}
            className="streaming-icon-button"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      <HeroSection items={heroItems} activeTab={activeTab} />

      <div className="streaming-tabs-wrap">
        <div className="streaming-tabs" role="tablist" aria-label="Streaming categories">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`streaming-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="streaming-content">
        <ContinueWatching />

        {activeTab === 'movies' && (
          <>
            <ContentCarousel
              title="Trending Now"
              items={trendingMovies}
              isLoading={isLoadingTM}
              category="movie"
              seeAllTo="/streaming/list/movie/trending"
              onItemClick={id => navigate(`/streaming/movie/${id}`)}
            />
            <ContentCarousel
              title="Top Rated"
              items={topRatedMovies}
              isLoading={isLoadingTRM}
              category="movie"
              seeAllTo="/streaming/list/movie/top-rated"
              onItemClick={id => navigate(`/streaming/movie/${id}`)}
            />
            <ContentCarousel
              title="Popular Movies"
              items={popularMovies}
              isLoading={isLoadingPM}
              category="movie"
              seeAllTo="/streaming/list/movie/popular"
              onItemClick={id => navigate(`/streaming/movie/${id}`)}
            />
          </>
        )}

        {activeTab === 'tv' && (
          <>
            <ContentCarousel
              title="Trending Shows"
              items={trendingTV}
              isLoading={isLoadingTTV}
              category="tv"
              seeAllTo="/streaming/list/tv/trending"
              onItemClick={id => navigate(`/streaming/tv/${id}`)}
            />
            <ContentCarousel
              title="Popular Series"
              items={popularTV}
              isLoading={isLoadingPTV}
              category="tv"
              seeAllTo="/streaming/list/tv/popular"
              onItemClick={id => navigate(`/streaming/tv/${id}`)}
            />
          </>
        )}

        {activeTab === 'anime' && (
          <>
            <ContentCarousel
              title="Trending Anime"
              items={trendingAnime}
              isLoading={isLoadingTA}
              category="anime"
              seeAllTo="/streaming/list/anime/trending"
              onItemClick={id => navigate(`/streaming/anime/${id}`)}
            />
            <ContentCarousel
              title="This Season"
              items={seasonalAnime}
              isLoading={isLoadingSA}
              category="anime"
              seeAllTo="/streaming/list/anime/seasonal"
              onItemClick={id => navigate(`/streaming/anime/${id}`)}
            />
            <ContentCarousel
              title="All Time Popular"
              items={popularAnime}
              isLoading={isLoadingPA}
              category="anime"
              seeAllTo="/streaming/list/anime/popular"
              onItemClick={id => navigate(`/streaming/anime/${id}`)}
            />
          </>
        )}
      </main>
    </div>
  );
}
