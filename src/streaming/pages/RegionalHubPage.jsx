import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Film, Tv, Sparkles, Filter, Search, RefreshCw, Star, Globe2, Layers } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import { discoverLanguageCombined } from '../api/tmdb';
import { getRegionalHubByCode, REGIONAL_HUBS } from '../api/bingrApi';

const SORT_OPTIONS = [
  { id: 'popularity.desc', label: 'Most Popular' },
  { id: 'vote_average.desc', label: 'Highest Rated' },
  { id: 'primary_release_date.desc', label: 'Newest Release' },
];

export default function RegionalHubPage() {
  const { langCode } = useParams();
  const navigate = useNavigate();

  const hub = useMemo(() => {
    return getRegionalHubByCode(langCode) || REGIONAL_HUBS[0];
  }, [langCode]);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'movie' | 'tv'
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ movies: 0, tv: 0, total: 0 });

  const loadHubContent = useCallback(async (targetPage = 1, replace = false) => {
    if (!hub) return;

    if (targetPage === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError('');

    try {
      const data = await discoverLanguageCombined(hub.code, {
        page: targetPage,
        filter: activeTab,
        sortBy,
      });

      const nextResults = data.results || [];
      setItems(prev => replace ? nextResults : [...prev, ...nextResults]);
      setPage(targetPage);
      setHasNextPage(targetPage < (data.total_pages || 1));

      if (targetPage === 1) {
        setStats({
          movies: data.moviesCount || 0,
          tv: data.tvCount || 0,
          total: data.total_results || nextResults.length,
        });
      }
    } catch (err) {
      setError(err?.message || 'Could not load regional catalog. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [hub, activeTab, sortBy]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setItems([]);
    setPage(1);
    loadHubContent(1, true);
  }, [loadHubContent]);

  const displayedItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      const title = (item.title || item.name || '').toLowerCase();
      const overview = (item.overview || '').toLowerCase();
      return title.includes(q) || overview.includes(q);
    });
  }, [items, searchQuery]);

  return (
    <div className="streaming-page regional-hub-view min-h-screen pb-20">
      {/* Regional Hero Cinematic Banner */}
      <div className="relative w-full overflow-hidden bg-zinc-950 border-b border-zinc-800/80">
        <div className="absolute inset-0 z-0">
          <img
            src={hub?.heroBackdrop || hub?.backdrop}
            alt={hub?.name}
            className="w-full h-full object-cover object-top opacity-35 blur-xs scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          <div
            className="absolute inset-0 opacity-35 mix-blend-color"
            style={{ backgroundColor: hub?.accent || '#e50914' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/streaming')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-xs font-semibold shadow-lg"
            >
              <ArrowLeft size={16} />
              <span>Back to StreamZone</span>
            </button>

            {/* Region Hub Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border backdrop-blur-md"
              style={{
                backgroundColor: `${hub?.accent || '#ff9933'}22`,
                borderColor: `${hub?.accent || '#ff9933'}66`,
                color: hub?.accent || '#ff9933',
              }}
            >
              <Globe2 size={13} />
              <span>{hub?.badge || 'Regional Hub'}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
            {/* Flag & Emblem Frame */}
            <div
              className="w-28 h-28 md:w-36 md:h-36 rounded-2xl p-4 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-xl border shadow-2xl relative overflow-hidden group shrink-0"
              style={{ borderColor: `${hub?.accent || '#555'}55` }}
            >
              <div
                className="absolute inset-0 opacity-20 transition-opacity duration-300 group-hover:opacity-35"
                style={{ backgroundColor: hub?.accent || '#ffffff' }}
              />
              <span className="text-5xl md:text-6xl drop-shadow-lg relative z-10 select-none">
                {hub?.flag || '🌐'}
              </span>
              <span
                className="mt-1 text-[11px] font-extrabold uppercase tracking-wider relative z-10"
                style={{ color: hub?.accent || '#fff' }}
              >
                {hub?.code?.toUpperCase()}
              </span>
            </div>

            {/* Titles & Descriptions */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                  {hub?.name}
                </h1>
                {hub?.nativeName && (
                  <span
                    className="text-lg sm:text-xl font-bold px-2.5 py-0.5 rounded-lg bg-zinc-900/80 border border-zinc-700/60"
                    style={{ color: hub?.accent || '#fcd34d' }}
                  >
                    {hub.nativeName}
                  </span>
                )}
              </div>

              {hub?.tagline && (
                <p
                  className="text-base sm:text-lg font-semibold mt-1 drop-shadow"
                  style={{ color: hub?.accent || '#fcd34d' }}
                >
                  {hub.tagline}
                </p>
              )}
              {hub?.description && (
                <p className="text-zinc-400 text-sm max-w-2xl mt-2 leading-relaxed">
                  {hub.description}
                </p>
              )}

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 pt-3 border-t border-zinc-800/60 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Film size={14} className="text-red-400" />
                  <span>{stats.movies > 0 ? `${stats.movies.toLocaleString()}+ Movies` : 'Regional Movies'}</span>
                </span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Tv size={14} className="text-blue-400" />
                  <span>{stats.tv > 0 ? `${stats.tv.toLocaleString()}+ Series` : 'TV Series'}</span>
                </span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span>Multi-Language Audio & Dubs</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-800">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-zinc-800 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>All Titles</span>
            </button>
            <button
              onClick={() => setActiveTab('movie')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'movie'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film size={14} />
              <span>Movies</span>
            </button>
            <button
              onClick={() => setActiveTab('tv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'tv'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv size={14} />
              <span>TV Series</span>
            </button>
          </div>

          {/* Right Controls: Sort & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800/80">
              <Filter size={13} className="text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-200 outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-zinc-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder={`Search in ${hub?.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center justify-between mb-6">
            <span>{error}</span>
            <button
              onClick={() => loadHubContent(1, true)}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-500 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-xl bg-zinc-900/70 border border-zinc-800/50 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && displayedItems.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayedItems.map((item, idx) => {
              const cat = item.media_type || (item.title ? 'movie' : 'tv');
              const targetRoute = cat === 'tv' ? `/streaming/tv/${item.id}` : `/streaming/movie/${item.id}`;

              return (
                <MediaCard
                  key={`${item.id}-${cat}-${idx}`}
                  item={item}
                  category={cat}
                  onClick={() => navigate(targetRoute)}
                />
              );
            })}
          </div>
        )}

        {!isLoading && displayedItems.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/40">
            <Film size={40} className="mx-auto text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-zinc-300">No titles match your search</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              Try adjusting your search terms or clearing the filter to see all titles in {hub?.name}.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {!isLoading && hasNextPage && !searchQuery && (
          <div className="text-center mt-12">
            <button
              onClick={() => loadHubContent(page + 1, false)}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sm font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-red-500" />
                  <span>Loading more {hub?.name} titles...</span>
                </>
              ) : (
                <>
                  <span>Load More Titles</span>
                  <span className="text-xs text-zinc-400 font-normal">
                    (Page {page + 1})
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
