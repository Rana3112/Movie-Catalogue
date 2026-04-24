export const CardSkeleton = () => (
  <div style={{ width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ width: '100%', height: 210, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
    <div style={{ width: '80%', height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
    <div style={{ width: '50%', height: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
  </div>
);

export const HeroSkeleton = () => (
  <div style={{ width: '100%', height: 400, backgroundColor: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
);

export const DetailSkeleton = () => (
  <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
    <div style={{ width: '100%', height: 280, backgroundColor: 'rgba(255,255,255,0.1)', animation: 'pulse 1.5s infinite' }} />
    <div style={{ padding: '0 16px', marginTop: -40, display: 'flex', gap: 14 }}>
      <div style={{ width: 90, height: 135, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
      <div style={{ flex: 1, marginTop: 40, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: '80%', height: 24, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '50%', height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  </div>
);
