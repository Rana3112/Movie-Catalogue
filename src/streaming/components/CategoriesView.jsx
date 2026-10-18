import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Sparkles, Film, ArrowRight, Compass } from 'lucide-react';
import { fetchBingrCategories, FALLBACK_STUDIOS, FALLBACK_GENRES } from '../api/bingrApi';

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

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi / Bollywood', flag: '🇮🇳' },
    { code: 'ja', name: 'Japanese / Anime', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean / K-Drama', flag: '🇰🇷' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
  ];

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
      <div className="bingr-shelf-wrapper mt-10">
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

        <div className="bingr-genres-grid">
          {genres.map(genre => (
            <div
              key={genre.id}
              onClick={() => navigate('/streaming/genres')}
              className="bingr-genre-tile"
            >
              <span className="bingr-genre-emoji">{genre.emoji || '🎬'}</span>
              <div className="bingr-genre-info">
                <span className="bingr-genre-name">{genre.name}</span>
                {genre.count && <span className="bingr-genre-count">{genre.count}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Languages Row */}
      <div className="bingr-shelf-wrapper mt-10 mb-8">
        <div className="bingr-shelf-header">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-red-500" />
            <h3 className="bingr-shelf-title">International & Regional Hubs</h3>
          </div>
        </div>

        <div className="bingr-languages-row">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => navigate(`/streaming/search?q=${encodeURIComponent(lang.name)}`)}
              className="bingr-language-pill"
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
