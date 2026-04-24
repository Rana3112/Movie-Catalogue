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

  // Movies
  const { data: trendingMovies, isLoading: isLoadingTM } = useTrendingMovies();
  const { data: popularMovies, isLoading: isLoadingPM } = usePopularMovies();
  const { data: topRatedMovies, isLoading: isLoadingTRM } = useTopRatedMovies();

  // TV
  const { data: trendingTV, isLoading: isLoadingTTV } = useTrendingTV();
  const { data: popularTV, isLoading: isLoadingPTV } = usePopularTV();

  // Anime
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
    <div style={{ backgroundColor: '#0a0a0f', minHeight: '100vh', color: '#fff', paddingBottom: 80, overflowX: 'hidden' }}>
      
      {/* Header with Search and Back Buttons */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/home')}
          style={{
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%',
            width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer'
          }}
        >
          <ChevronLeft size={24} />
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => navigate('/streaming/genres')}
            aria-label="Genres"
            style={{
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%',
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer'
            }}
          >
            <Tags size={20} />
          </button>

          <button 
            onClick={() => navigate('/streaming/search')}
            aria-label="Search"
            style={{
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%',
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer'
            }}
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <HeroSection items={heroItems} activeTab={activeTab} />

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '10px 0',
              borderRadius: 12,
              border: 'none',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #e50914, #ff6b35)'
                : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 600, fontSize: 13,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Continue Watching */}
      <ContinueWatching />

      {/* Content Rows based on active tab */}
      {activeTab === 'movies' && (
        <>
          <ContentCarousel
            title="🔥 Trending Now"
            items={trendingMovies}
            isLoading={isLoadingTM}
            category="movie"
            seeAllTo="/streaming/list/movie/trending"
            onItemClick={id => navigate(`/streaming/movie/${id}`)}
          />
          <ContentCarousel
            title="⭐ Top Rated"
            items={topRatedMovies}
            isLoading={isLoadingTRM}
            category="movie"
            seeAllTo="/streaming/list/movie/top-rated"
            onItemClick={id => navigate(`/streaming/movie/${id}`)}
          />
          <ContentCarousel
            title="🎬 Popular"
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
            title="🔥 Trending Shows"
            items={trendingTV}
            isLoading={isLoadingTTV}
            category="tv"
            seeAllTo="/streaming/list/tv/trending"
            onItemClick={id => navigate(`/streaming/tv/${id}`)}
          />
          <ContentCarousel
            title="📺 Popular Series"
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
            title="🔥 Trending Anime"
            items={trendingAnime}
            isLoading={isLoadingTA}
            category="anime"
            seeAllTo="/streaming/list/anime/trending"
            onItemClick={id => navigate(`/streaming/anime/${id}`)}
          />
          <ContentCarousel
            title="📅 This Season"
            items={seasonalAnime}
            isLoading={isLoadingSA}
            category="anime"
            seeAllTo="/streaming/list/anime/seasonal"
            onItemClick={id => navigate(`/streaming/anime/${id}`)}
          />
          <ContentCarousel
            title="💫 All Time Popular"
            items={popularAnime}
            isLoading={isLoadingPA}
            category="anime"
            seeAllTo="/streaming/list/anime/popular"
            onItemClick={id => navigate(`/streaming/anime/${id}`)}
          />
        </>
      )}
    </div>
  );
}
