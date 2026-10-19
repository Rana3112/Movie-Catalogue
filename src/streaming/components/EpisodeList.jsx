import { useState } from 'react';
import { Play, Download } from 'lucide-react';
import { imageUrl } from '../api/tmdb';
import { useTVEpisodes } from '../hooks/useTVShows';

export default function EpisodeList({ tvId, seasons, onEpisodeSelect, onEpisodePrewarm, onEpisodeDownload }) {
  const [selectedSeason, setSelectedSeason] = useState(seasons?.find(s => s.season_number > 0)?.season_number || 1);
  const { data: episodes, isLoading } = useTVEpisodes(tvId, selectedSeason);

  if (!seasons || seasons.length === 0) return null;

  return (
    <section className="streaming-episodes">
      <div className="streaming-episodes-header">
        <h3>Episodes</h3>
        <select 
          value={selectedSeason} 
          onChange={(e) => setSelectedSeason(Number(e.target.value))}
          className="streaming-season-select"
        >
          {seasons.filter(s => s.season_number > 0).map(season => (
             <option key={season.id} value={season.season_number}>
              Season {season.season_number}
            </option>
          ))}
        </select>
      </div>

      <div className="streaming-episode-list">
        {isLoading ? (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Loading episodes...</p>
        ) : episodes && episodes.length > 0 ? (
          episodes.map(episode => (
            <div 
              key={episode.id} 
              onPointerEnter={() => onEpisodePrewarm?.(selectedSeason, episode.episode_number)}
              onPointerDown={() => onEpisodePrewarm?.(selectedSeason, episode.episode_number)}
              onClick={() => onEpisodeSelect(selectedSeason, episode.episode_number, episode.name)}
              className="streaming-episode-row"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                <div className="streaming-episode-thumb">
                  {episode.still_path ? (
                    <img src={imageUrl(episode.still_path, 'w300')} alt={episode.name} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>No Image</div>
                  )}
                  <div className="streaming-episode-play">
                    <Play size={24} color="#fff" />
                  </div>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 className="streaming-episode-title">
                    {episode.episode_number}. {episode.name}
                  </h4>
                  <div className="streaming-episode-meta">
                    <span>{episode.runtime ? `${episode.runtime}m` : ''}</span>
                    <span>{episode.air_date?.slice(0, 4)}</span>
                  </div>
                </div>
              </div>

              {onEpisodeDownload && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEpisodeDownload(selectedSeason, episode.episode_number);
                  }}
                  title={`Download Episode ${episode.episode_number} on any resolution`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#38BDF8',
                    flexShrink: 0,
                    marginLeft: 10,
                    transition: 'all 0.2s',
                  }}
                >
                  <Download size={16} />
                </button>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No episodes available.</p>
        )}
      </div>
    </section>
  );
}
