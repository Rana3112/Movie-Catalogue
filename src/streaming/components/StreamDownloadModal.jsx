import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  ExternalLink,
  Film,
  HardDrive,
  Info,
  Layers,
  Sparkles,
  Tv,
  X,
  Zap,
} from 'lucide-react';
import { fetchDownloadOptions, triggerFileDownload } from '../api/downloadService';

export default function StreamDownloadModal({
  isOpen,
  onClose,
  media, // { id, title, category, season, episode, posterUrl, year, duration }
}) {
  const [downloadData, setDownloadData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resolutions'); // 'resolutions' | 'mirrors'
  const [selectedFormat, setSelectedFormat] = useState('mkv'); // 'mkv' (default) | 'mp4'
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [downloadingQuality, setDownloadingQuality] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!isOpen || !media) return;

    let isMounted = true;
    setIsLoading(true);
    setNotice(null);

    fetchDownloadOptions({
      id: media.id,
      type: media.category || 'movie',
      season: media.season || 1,
      episode: media.episode || 1,
      title: media.title || 'Media',
      year: media.year || '',
      format: selectedFormat,
    }).then((data) => {
      if (isMounted) {
        setDownloadData(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, media, selectedFormat]);

  if (!isOpen || !media) return null;

  const title = media.title || 'Media';
  const category = media.category || 'movie';
  const season = media.season || 1;
  const episode = media.episode || 1;
  const posterUrl = media.posterUrl || media.poster;

  const handleDownload = (option) => {
    setDownloadingQuality(option.quality);
    setNotice(`⚡ Download Started: ${title} (${option.quality} .${selectedFormat.toUpperCase()})`);

    const safeTitle = (title || 'Media')
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .trim()
      .replace(/\s+/g, '.');

    const epSuffix = category === 'tv' || category === 'anime'
      ? `.S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
      : '';

    const filename = `${safeTitle}${epSuffix}.${option.quality}.${selectedFormat}`;

    let dlUrl = option.downloadUrl;
    if (dlUrl.includes('format=')) {
      dlUrl = dlUrl.replace(/format=(mkv|mp4)/, `format=${selectedFormat}`);
    } else {
      dlUrl = `${dlUrl}&format=${selectedFormat}`;
    }

    triggerFileDownload(dlUrl, filename);

    setTimeout(() => {
      setDownloadingQuality(null);
    }, 2500);

    setTimeout(() => {
      setNotice(null);
    }, 4500);
  };

  const handleCopyLink = (url, index) => {
    let dlUrl = url;
    if (dlUrl.includes('format=')) {
      dlUrl = dlUrl.replace(/format=(mkv|mp4)/, `format=${selectedFormat}`);
    } else {
      dlUrl = `${dlUrl}&format=${selectedFormat}`;
    }
    const fullUrl = dlUrl.startsWith('http') ? dlUrl : `${window.location.origin}${dlUrl}`;
    navigator.clipboard?.writeText(fullUrl).then(() => {
      setCopiedIndex(index);
      setNotice(`📋 Direct .${selectedFormat.toUpperCase()} link copied! Use IDM/FDM for max speed.`);
      setTimeout(() => setCopiedIndex(null), 2500);
      setTimeout(() => setNotice(null), 3500);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        backgroundColor: 'rgba(5, 7, 13, 0.82)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        touchAction: 'manipulation',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(94vw, 560px)',
          maxHeight: '90vh',
          backgroundColor: '#0D1117',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 24,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85), 0 0 32px rgba(56, 189, 248, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(13, 17, 23, 0.4) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #2563EB, #38BDF8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
              }}
            >
              <Download size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>
                Download Center
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                One-Click Direct High-Speed Download
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close download modal"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#94A3B8',
              transition: 'all 0.2s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Media Quick Overview */}
        <div
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              style={{
                width: 52,
                height: 74,
                objectFit: 'cover',
                borderRadius: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 74,
                borderRadius: 10,
                backgroundColor: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {category === 'tv' ? <Tv size={24} color="#94A3B8" /> : <Film size={24} color="#94A3B8" />}
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: '0 0 6px 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  textTransform: 'uppercase',
                }}
              >
                {category}
              </span>

              {(category === 'tv' || category === 'anime') && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    color: '#C084FC',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                  }}
                >
                  Season {season} • Episode {episode}
                </span>
              )}

              {media.year && (
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{media.year}</span>
              )}
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Check size={16} />
            <span>{notice}</span>
          </div>
        )}

        {/* Unreleased / Unavailable Notice */}
        {!isLoading && downloadData && !downloadData.isAvailable && (
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              borderBottom: '1px solid rgba(234, 179, 8, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: 12,
              lineHeight: 1.5,
              color: '#FDE047',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: '#FACC15' }} />
            <div>
              <span style={{ fontWeight: 700, color: '#FEF08A', display: 'block', marginBottom: 2 }}>
                Digital Stream Not Yet Released
              </span>
              This title does not have an official digital stream or download source available yet (e.g. upcoming release). You can try external mirror links or check released titles like <em>Inception</em>, <em>Spider-Man: No Way Home</em>, etc.
            </div>
          </div>
        )}

        {/* Tabs & Format Selector: Resolutions vs Fast Mirrors */}
        <div
          style={{
            padding: '12px 22px 0 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setActiveTab('resolutions')}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'resolutions' ? '2px solid #38BDF8' : '2px solid transparent',
                color: activeTab === 'resolutions' ? '#fff' : '#94A3B8',
                fontWeight: activeTab === 'resolutions' ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Layers size={14} />
              <span>Select Resolution</span>
            </button>

            <button
              onClick={() => setActiveTab('mirrors')}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'mirrors' ? '2px solid #38BDF8' : '2px solid transparent',
                color: activeTab === 'mirrors' ? '#fff' : '#94A3B8',
                fontWeight: activeTab === 'mirrors' ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ExternalLink size={14} />
              <span>Fast MKV Mirrors</span>
            </button>
          </div>

          {/* Container Format Switcher: .MKV (Default) vs .MP4 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 8,
              padding: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: 4,
            }}
          >
            <button
              onClick={() => setSelectedFormat('mkv')}
              title="MKV (Matroska) - Default container with high efficiency and multi-audio support"
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                backgroundColor: selectedFormat === 'mkv' ? '#2563EB' : 'transparent',
                color: selectedFormat === 'mkv' ? '#fff' : '#94A3B8',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              .MKV (Default)
            </button>
            <button
              onClick={() => setSelectedFormat('mp4')}
              title="MP4 - Standard video container"
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                backgroundColor: selectedFormat === 'mp4' ? '#2563EB' : 'transparent',
                color: selectedFormat === 'mp4' ? '#fff' : '#94A3B8',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              .MP4
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '18px 22px',
            overflowY: 'auto',
            maxHeight: '420px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 0',
                gap: 12,
                color: '#94A3B8',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '3px solid rgba(56, 189, 248, 0.25)',
                  borderTopColor: '#38BDF8',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span style={{ fontSize: 13 }}>Detecting available stream resolutions...</span>
            </div>
          ) : activeTab === 'resolutions' ? (
            downloadData?.qualities?.map((opt, idx) => (
              <div
                key={opt.quality}
                style={{
                  backgroundColor: opt.recommended ? 'rgba(56, 189, 248, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                  border: opt.recommended
                    ? '1.5px solid rgba(56, 189, 248, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: opt.color || '#38BDF8' }}>
                      {opt.quality}
                    </span>
                    <span style={{ fontSize: 9, color: selectedFormat === 'mkv' ? '#38BDF8' : '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>
                      {selectedFormat}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{opt.label}</span>
                      {opt.recommended && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: 4,
                            backgroundColor: 'rgba(56, 189, 248, 0.2)',
                            color: '#38BDF8',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Sparkles size={10} /> BEST
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>
                      {opt.resolution} • Est. {opt.size} • .{selectedFormat.toUpperCase()} Video
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Copy Link Button */}
                  <button
                    onClick={() => handleCopyLink(opt.downloadUrl, idx)}
                    title={`Copy direct .${selectedFormat.toUpperCase()} download link for IDM/FDM`}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: copiedIndex === idx ? '#34D399' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                  </button>

                  {/* One-Click Download Button */}
                  <button
                    onClick={() => handleDownload(opt)}
                    disabled={!downloadData?.isAvailable}
                    style={{
                      height: 38,
                      padding: '0 16px',
                      borderRadius: 10,
                      background: !downloadData?.isAvailable
                        ? 'rgba(255, 255, 255, 0.04)'
                        : opt.recommended
                        ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                        : 'rgba(255, 255, 255, 0.08)',
                      border: !downloadData?.isAvailable
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : opt.recommended
                        ? '1px solid #60A5FA'
                        : '1px solid rgba(255, 255, 255, 0.14)',
                      color: !downloadData?.isAvailable ? '#64748B' : '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: !downloadData?.isAvailable ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: downloadData?.isAvailable && opt.recommended ? '0 0 16px rgba(37, 99, 235, 0.4)' : 'none',
                    }}
                  >
                    <Download size={14} />
                    <span>
                      {!downloadData?.isAvailable
                        ? 'Unavailable'
                        : downloadingQuality === opt.quality
                        ? 'Starting...'
                        : `Download .${selectedFormat.toUpperCase()}`}
                    </span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            downloadData?.mirrors?.map((m) => (
              <a
                key={m.name}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: '#fff',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{m.flag || '⚡'}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{m.desc}</div>
                  </div>
                </div>

                <ExternalLink size={16} color="#94A3B8" />
              </a>
            ))
          )}
        </div>

        {/* Footer info note with speed tips */}
        <div
          style={{
            padding: '12px 22px',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: 11,
            color: '#64748B',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} color="#38BDF8" />
            <span>Format: <strong>.{selectedFormat.toUpperCase()}</strong> active. Paste link in <strong>IDM, FDM, or 1DM</strong> for 16x multi-thread speed.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
