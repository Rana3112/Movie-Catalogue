import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Tv, Flame, Trophy, Layers, Search, ChevronLeft, Tags, Sparkles } from 'lucide-react';
import { useTrendingMovies, usePopularMovies, useTopRatedMovies } from '../hooks/useMovies';
import { useTrendingTV, usePopularTV } from '../hooks/useTVShows';
import { useTrendingAnime, usePopularAnime, useSeasonalAnime } from '../hooks/useAnime';
import { useStreamingStore } from '../store/useStreamingStore';
import BingrHero from '../components/BingrHero';
import ContentCarousel from '../components/ContentCarousel';
import ContinueWatching from '../components/ContinueWatching';
import SportsView from '../components/SportsView';
import CategoriesView from '../components/CategoriesView';
import { preconnectStreamingProviders } from '../api/streams';

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

  useEffect(() => {
    preconnectStreamingProviders();
  }, []);

  const tabs = [
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'tv', label: 'TV Shows', icon: Tv },
    { id: 'anime', label: 'Anime', icon: Flame },
    { id: 'sports', label: 'Live Sports', icon: Trophy, isLive: true },
    { id: 'categories', label: 'Studios & Hubs', icon: Layers },
  ];

  const heroItems = activeTab === 'movies'
    ? trendingMovies?.slice(0, 6)
    : activeTab === 'tv'
      ? trendingTV?.slice(0, 6)
      : activeTab === 'anime'
        ? trendingAnime?.slice(0, 6)
        : null;

  return (
    <div className="streaming-page bingr-theme">
      {/* Bingr Obsidian Topbar */}
      <header className="bingr-topbar">
        <div className="bingr-topbar-left">
          <button
            onClick={() => navigate('/home')}
            className="bingr-nav-icon-btn"
            aria-label="Back to Portal Home"
            title="Return to Home"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Bingr Brand Pill */}
          <div className="bingr-brand-badge" onClick={() => setActiveTab('movies')}>
            <span className="bingr-brand-dot" />
            <span className="bingr-brand-title">STREAMZONE</span>
            <span className="bingr-brand-sub">BINGR PRO</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="bingr-topbar-actions">
          <button
            onClick={() => navigate('/streaming/genres')}
            className="bingr-nav-icon-btn"
            aria-label="Genres & Categories"
            title="Genres & Categories"
          >
            <Tags size={19} />
          </button>

          <button
            onClick={() => navigate('/streaming/search')}
            className="bingr-nav-icon-btn"
            aria-label="Search Catalog"
            title="Search Movies, Shows, Anime"
          >
            <Search size={19} />
          </button>
        </div>
      </header>

      {/* Hero Showcase (Only rendered for Movies, TV, and Anime) */}
      {heroItems && heroItems.length > 0 && (
        <BingrHero items={heroItems} activeTab={activeTab} />
      )}

      {/* Bingr Floating Category Pill Tabs */}
      <nav className={`bingr-tabs-wrapper ${!heroItems ? 'no-hero' : ''}`}>
        <div className="bingr-tabs" role="tablist" aria-label="Streaming categories">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`bingr-tab-pill ${isActive ? 'is-active' : ''}`}
                role="tab"
                aria-selected={isActive}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.isLive && (
                  <span className="bingr-tab-live-badge">
                    <span className="bingr-tab-live-dot" />
                    LIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content Shelves & Hubs */}
      <main className="streaming-content bingr-main-content">
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
              title="Top Rated Films"
              items={topRatedMovies}
              isLoading={isLoadingTRM}
              category="movie"
              seeAllTo="/streaming/list/movie/top-rated"
              onItemClick={id => navigate(`/streaming/movie/${id}`)}
            />
            <ContentCarousel
              title="Popular Blockbusters"
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

        {activeTab === 'sports' && (
          <SportsView />
        )}

        {activeTab === 'categories' && (
          <CategoriesView />
        )}
      </main>
    </div>
  );
}
