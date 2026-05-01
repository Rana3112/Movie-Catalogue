import { useState } from 'react';
import { Play } from 'lucide-react';
import { imageUrl } from '../api/tmdb';
import { useTVEpisodes } from '../hooks/useTVShows';

export default function EpisodeList({ tvId, seasons, onEpisodeSelect, onEpisodePrewarm }) {
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
            >
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
              <div style={{ minWidth: 0 }}>
                <h4 className="streaming-episode-title">
                  {episode.episode_number}. {episode.name}
                </h4>
                <div className="streaming-episode-meta">
                  <span>{episode.runtime ? `${episode.runtime}m` : ''}</span>
                  <span>{episode.air_date?.slice(0, 4)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No episodes available.</p>
        )}
      </div>
    </section>
  );
}
