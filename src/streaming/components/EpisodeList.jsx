import { useState } from 'react';
import { Play } from 'lucide-react';
import { imageUrl } from '../api/tmdb';
import { useTVEpisodes } from '../hooks/useTVShows';

export default function EpisodeList({ tvId, seasons, onEpisodeSelect }) {
  const [selectedSeason, setSelectedSeason] = useState(seasons?.find(s => s.season_number > 0)?.season_number || 1);
  const { data: episodes, isLoading } = useTVEpisodes(tvId, selectedSeason);

  if (!seasons || seasons.length === 0) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>Episodes</h3>
        <select 
          value={selectedSeason} 
          onChange={(e) => setSelectedSeason(Number(e.target.value))}
          style={{ 
            background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', 
            padding: '6px 12px', borderRadius: 8, fontSize: 14, outline: 'none' 
          }}
        >
          {seasons.filter(s => s.season_number > 0).map(season => (
             <option key={season.id} value={season.season_number} style={{ color: '#000' }}>
              Season {season.season_number}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Loading episodes...</p>
        ) : episodes && episodes.length > 0 ? (
          episodes.map(episode => (
            <div 
              key={episode.id} 
              onClick={() => onEpisodeSelect(selectedSeason, episode.episode_number, episode.name)}
              style={{ display: 'flex', gap: 12, padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
            >
              <div style={{ position: 'relative', width: 120, height: 68, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: '#222' }}>
                {episode.still_path ? (
                  <img src={imageUrl(episode.still_path, 'w300')} alt={episode.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>No Image</div>
                )}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                  <Play size={24} color="#fff" />
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {episode.episode_number}. {episode.name}
                </h4>
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
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
    </div>
  );
}
