import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Radio, Trophy, Activity, Calendar, Zap, RefreshCw } from 'lucide-react';
import { fetchSportsMatchesToday, fetchPopularSportsMatches } from '../api/bingrApi';

export default function SportsView() {
  const [matches, setMatches] = useState([]);
  const [popularMatches, setPopularMatches] = useState([]);
  const [selectedSport, setSelectedSport] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const [today, pop] = await Promise.all([
        fetchSportsMatchesToday(),
        fetchPopularSportsMatches()
      ]);
      setMatches(today || []);
      setPopularMatches(pop || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const sportsFilters = [
    { id: 'all', label: 'All Events', icon: Trophy },
    { id: 'football', label: 'Football / Soccer', icon: Activity },
    { id: 'basketball', label: 'Basketball', icon: Zap },
    { id: 'cricket', label: 'Cricket', icon: Radio },
    { id: 'motorsport', label: 'Motorsport / F1', icon: Activity },
    { id: 'mma', label: 'MMA / UFC', icon: Zap },
  ];

  const filteredMatches = selectedSport === 'all'
    ? matches
    : matches.filter(m => m.category?.toLowerCase() === selectedSport.toLowerCase());

  const handleWatchMatch = (match) => {
    const candidates = match.candidates && match.candidates.length > 0
      ? match.candidates
      : [
          { label: 'Live Server 1', src: match.streamUrl || 'https://vidsrc.me/embed/movie/tt0111161', style: 'purple' },
          { label: 'Live Server 2', src: 'https://player.cinezo.live/embed/movie/550', style: 'purple' },
        ];

    navigate('/streaming/player', {
      state: {
        mode: 'iframe',
        src: candidates[0].src,
        id: match.id,
        title: match.title,
        episodeTitle: `${match.competition} • ${match.timeText || 'LIVE'}`,
        posterUrl: match.teams?.home?.badge || match.teams?.away?.badge || '',
        category: 'sports',
        candidates,
      }
    });
  };

  return (
    <div className="bingr-sports-section">
      {/* Banner */}
      <div className="bingr-sports-hero-banner">
        <div className="bingr-sports-hero-badge">
          <span className="bingr-live-indicator-dot" />
          <span>BINGR LIVE SPORTS ARENA</span>
        </div>
        <h2 className="bingr-sports-hero-title">
          Live & Upcoming Global Events
        </h2>
        <p className="bingr-sports-hero-subtitle">
          Watch real-time live broadcasts from Champions League, Premier League, NBA, IPL, Formula 1, and UFC with failover servers.
        </p>

        {/* Filter Pills */}
        <div className="bingr-sports-filters-scroll">
          {sportsFilters.map(filter => {
            const Icon = filter.icon;
            const isActive = selectedSport === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedSport(filter.id)}
                className={`bingr-sports-filter-pill ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={14} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Matches Grid */}
      <div className="bingr-sports-content">
        <div className="bingr-sports-header-row">
          <div className="bingr-sports-row-title-wrap">
            <Radio size={18} className="text-red-500 animate-pulse" />
            <h3 className="bingr-shelf-title">Live & Today's Fixtures</h3>
          </div>
          <button
            onClick={loadMatches}
            className="bingr-refresh-btn"
            title="Refresh Fixtures"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="bingr-sports-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bingr-match-card-skeleton animate-pulse" />
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="bingr-empty-state">
            <Calendar size={36} className="text-zinc-600 mb-2" />
            <p className="text-zinc-400">No scheduled fixtures right now for this category.</p>
          </div>
        ) : (
          <div className="bingr-sports-grid">
            {filteredMatches.map(match => (
              <div key={match.id} className="bingr-match-card">
                {/* Match Header Tag */}
                <div className="bingr-match-card-header">
                  <span className="bingr-competition-badge">
                    {match.competition || 'Major Tournament'}
                  </span>
                  {match.isLive ? (
                    <span className="bingr-live-pill">
                      <span className="bingr-live-dot" /> LIVE
                    </span>
                  ) : (
                    <span className="bingr-time-pill">
                      {match.timeText || 'Upcoming'}
                    </span>
                  )}
                </div>

                {/* Teams Showcase */}
                <div className="bingr-match-teams-box">
                  {/* Home Team */}
                  <div className="bingr-team-col">
                    <img
                      src={match.teams?.home?.badge || 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png'}
                      alt={match.teams?.home?.name}
                      className="bingr-team-badge"
                      onError={(e) => {
                        e.target.src = 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png';
                      }}
                    />
                    <span className="bingr-team-name">{match.teams?.home?.name || 'Home Team'}</span>
                  </div>

                  <div className="bingr-match-vs">
                    <span>VS</span>
                  </div>

                  {/* Away Team */}
                  <div className="bingr-team-col">
                    <img
                      src={match.teams?.away?.badge || 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png'}
                      alt={match.teams?.away?.name}
                      className="bingr-team-badge"
                      onError={(e) => {
                        e.target.src = 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png';
                      }}
                    />
                    <span className="bingr-team-name">{match.teams?.away?.name || 'Away Team'}</span>
                  </div>
                </div>

                {/* Match Action */}
                <button
                  onClick={() => handleWatchMatch(match)}
                  className="bingr-match-watch-btn"
                >
                  <Play size={16} fill="#ffffff" />
                  <span>{match.isLive ? 'Watch Live Stream' : 'Tune Into Stream'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
