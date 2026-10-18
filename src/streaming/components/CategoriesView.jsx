import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Sparkles, Film, ArrowRight, Compass } from 'lucide-react';
import { fetchBingrCategories, FALLBACK_STUDIOS, FALLBACK_GENRES, REGIONAL_HUBS } from '../api/bingrApi';

export default function CategoriesView() {
  const [categories, setCategories] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    fetchBingrCategories().then((res) => {
      if (mounted) {
        setCategories(res);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const studios = categories?.studios || FALLBACK_STUDIOS;
  const genres = categories?.genres || FALLBACK_GENRES;

  return (
    <div className="bingr-categories-section">
      {/* Hub Hero Banner */}
      <div className="bingr-categories-hero">
        <div className="bingr-categories-tag">
          <Layers size={14} className="text-red-400" />
          <span>STUDIOS & COLLECTIONS</span>
        </div>
        <h2 className="bingr-categories-title">
          Explore by Studio & Network
        </h2>
        <p className="bingr-categories-desc">
          Stream premier film libraries, franchise universes, and exclusive network originals.
        </p>
      </div>

      {/* Studios Grid */}
      <div className="bingr-shelf-wrapper">
        <div className="bingr-shelf-header">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-red-500" />
            <h3 className="bingr-shelf-title">Major Studios & Networks</h3>
          </div>
        </div>

        <div className="bingr-studios-grid">
          {studios.map(studio => (
            <div
              key={studio.id}
              onClick={() => navigate(`/streaming/studio/${studio.id}`)}
              className={`bingr-studio-card group relative overflow-hidden bg-gradient-to-br ${studio.color || 'from-zinc-900 to-black'} border ${studio.border || 'border-zinc-800'}`}
              style={{
                '--studio-accent': studio.accent || '#ff3b47',
                '--studio-glow': studio.glowColor || 'rgba(255, 59, 71, 0.35)',
              }}
            >
              {/* Cinematic Backdrop Poster */}
              {studio.backdrop && (
                <div className="bingr-studio-backdrop-wrap">
                  <img
                    src={studio.backdrop}
                    alt={studio.name}
                    className="bingr-studio-backdrop-img"
                    loading="lazy"
                  />
                  <div className="bingr-studio-backdrop-vignette" />
                </div>
              )}

              {/* Glossy top specular reflection */}
              <div className="bingr-studio-gloss" />

              {/* Top Tag & Badge */}
              <div className="bingr-studio-top-bar">
                <span className="bingr-studio-tag-pill">
                  {studio.category || 'STUDIO'}
                </span>
                <span className="bingr-studio-explore-pill">
                  Explore <ArrowRight size={11} />
                </span>
              </div>

              {/* Center Official Brand Logo */}
              <div className="bingr-studio-center-logo">
                {studio.logo ? (
                  <img
                    src={studio.logo}
                    alt={studio.name}
                    className="bingr-studio-brand-logo"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div
                  className="bingr-studio-badge-text"
                  style={{ display: studio.logo ? 'none' : 'block' }}
                >
                  {studio.badge || studio.name}
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="bingr-studio-footer">
                <div className="flex flex-col min-w-0">
                  <span className="bingr-studio-name truncate">{studio.name}</span>
                  {studio.tagline && (
                    <span className="bingr-studio-tagline truncate">{studio.tagline}</span>
                  )}
                </div>
                <div className="bingr-studio-arrow-circle shrink-0">
                  <ArrowRight size={13} className="bingr-studio-arrow" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Genre Grid */}
      <div className="bingr-shelf-wrapper mt-12">
        <div className="bingr-shelf-header">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-red-500" />
            <h3 className="bingr-shelf-title">Browse by Genre</h3>
          </div>
          <button
            onClick={() => navigate('/streaming/genres')}
            className="bingr-see-all-link"
          >
            <span>All Genres</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="bingr-genres-poster-grid">
          {genres.map(genre => (
            <div
              key={genre.id}
              onClick={() => navigate(`/streaming/genres?genre=${genre.id || genre.name.toLowerCase()}`)}
              className={`bingr-genre-card group relative overflow-hidden bg-gradient-to-br ${genre.color || 'from-zinc-900 to-black'} border ${genre.border || 'border-zinc-800'}`}
              style={{
                '--genre-accent': genre.accent || '#ff3b47',
                '--genre-glow': genre.glowColor || 'rgba(255, 59, 71, 0.35)',
              }}
            >
              {/* Genre Backdrop Poster */}
              {genre.backdrop && (
                <div className="bingr-genre-backdrop-wrap">
                  <img
                    src={genre.backdrop}
                    alt={genre.name}
                    className="bingr-genre-backdrop-img"
                    loading="lazy"
                  />
                  <div className="bingr-genre-backdrop-vignette" />
                </div>
              )}

              {/* Top Gloss */}
              <div className="bingr-genre-gloss" />

              {/* Genre Top Bar */}
              <div className="bingr-genre-top-bar">
                <span className="bingr-genre-emoji-bubble">
                  {genre.emoji || '🎬'}
                </span>
                <span className="bingr-genre-explore-text">
                  Browse <ArrowRight size={10} />
                </span>
              </div>

              {/* Genre Footer */}
              <div className="bingr-genre-card-footer">
                <div className="flex flex-col min-w-0">
                  <span className="bingr-genre-card-name truncate">{genre.name}</span>
                  {genre.count && (
                    <span className="bingr-genre-card-count truncate">{genre.count}</span>
                  )}
                </div>
                <div className="bingr-genre-arrow-bubble">
                  <ArrowRight size={12} className="bingr-genre-arrow-icon" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* International & Regional Hubs */}
      <div className="bingr-shelf-wrapper mt-12 mb-10">
        <div className="bingr-shelf-header">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-red-500" />
            <h3 className="bingr-shelf-title">International & Regional Hubs</h3>
          </div>
          <span className="text-xs text-zinc-400 font-medium hidden sm:inline-block">
            Stream native language cinema with multi-audio dubs
          </span>
        </div>

        <div className="bingr-hubs-poster-grid">
          {REGIONAL_HUBS.map(hub => (
            <div
              key={hub.code}
              onClick={() => navigate(`/streaming/hub/${hub.code}`)}
              className={`bingr-hub-card group relative overflow-hidden bg-gradient-to-br ${hub.color || 'from-zinc-900 to-black'} border ${hub.border || 'border-zinc-800'}`}
              style={{
                '--hub-accent': hub.accent || '#ff9933',
                '--hub-glow': hub.glowColor || 'rgba(255, 153, 51, 0.35)',
              }}
            >
              {/* Regional Backdrop Poster */}
              {hub.backdrop && (
                <div className="bingr-hub-backdrop-wrap">
                  <img
                    src={hub.backdrop}
                    alt={hub.name}
                    className="bingr-hub-backdrop-img"
                    loading="lazy"
                  />
                  <div className="bingr-hub-backdrop-vignette" />
                </div>
              )}

              {/* Top Gloss */}
              <div className="bingr-hub-gloss" />

              {/* Hub Top Bar with Flag Badge */}
              <div className="bingr-hub-top-bar">
                <div className="bingr-hub-flag-badge">
                  <span className="text-base leading-none">{hub.flag}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">{hub.code.toUpperCase()}</span>
                </div>
                <span className="bingr-hub-explore-tag">
                  Enter Hub <ArrowRight size={10} />
                </span>
              </div>

              {/* Hub Footer with Native and English name */}
              <div className="bingr-hub-footer">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="bingr-hub-name truncate">{hub.name}</span>
                  </div>
                  {hub.nativeName && (
                    <span className="bingr-hub-native truncate" style={{ color: hub.accent || '#fcd34d' }}>
                      {hub.nativeName}
                    </span>
                  )}
                </div>
                <div className="bingr-hub-arrow-circle">
                  <ArrowRight size={13} className="bingr-hub-arrow" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
