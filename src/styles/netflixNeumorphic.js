export const netflixNeumorphic = {
  pageBackground: `
    radial-gradient(circle at 10% 8%, rgba(229,9,20,0.22), transparent 28%),
    radial-gradient(circle at 86% 14%, rgba(122,18,28,0.18), transparent 30%),
    radial-gradient(circle at 50% 110%, rgba(80,0,12,0.28), transparent 38%),
    linear-gradient(135deg, #050505 0%, #111111 46%, #080808 100%)
  `,
  pageBackgroundSoft: `
    radial-gradient(circle at 12% 10%, rgba(229,9,20,0.18), transparent 28%),
    radial-gradient(circle at 92% 8%, rgba(122,18,28,0.16), transparent 30%),
    linear-gradient(135deg, #070707 0%, #121214 52%, #070707 100%)
  `,
  panel: '#151515',
  panelSoft: '#1B1B1F',
  panelRaised: '#202024',
  panelMuted: '#26262A',
  red: '#E50914',
  redDark: '#B20710',
  redDeep: '#650007',
  text: '#F5F5F1',
  textSoft: '#B3B3B3',
  muted: '#777777',
  dim: '#4F4F52',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(229,9,20,0.42)',
  raisedShadow: '12px 12px 28px rgba(0,0,0,0.62), -7px -7px 18px rgba(255,255,255,0.035)',
  softShadow: '8px 8px 20px rgba(0,0,0,0.5), -4px -4px 12px rgba(255,255,255,0.03)',
  insetShadow: 'inset 5px 5px 12px rgba(0,0,0,0.58), inset -4px -4px 10px rgba(255,255,255,0.035)',
  redShadow: '0 18px 34px rgba(229,9,20,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
}

export const netflixPageStyle = {
  background: netflixNeumorphic.pageBackground,
  fontFamily: "'Montserrat', 'Raleway', sans-serif",
  color: netflixNeumorphic.text,
}

export const netflixSurfaceStyle = {
  background: `linear-gradient(145deg, ${netflixNeumorphic.panelRaised}, ${netflixNeumorphic.panel})`,
  boxShadow: netflixNeumorphic.raisedShadow,
  border: `1px solid ${netflixNeumorphic.border}`,
}

export const netflixRaisedStyle = {
  background: netflixNeumorphic.panelSoft,
  boxShadow: netflixNeumorphic.softShadow,
  border: `1px solid ${netflixNeumorphic.border}`,
}

export const netflixInsetStyle = {
  background: netflixNeumorphic.panelSoft,
  boxShadow: netflixNeumorphic.insetShadow,
  border: `1px solid ${netflixNeumorphic.border}`,
}

export const netflixRedButtonStyle = {
  background: `linear-gradient(135deg, ${netflixNeumorphic.red}, ${netflixNeumorphic.redDark})`,
  color: '#FFFFFF',
  boxShadow: netflixNeumorphic.redShadow,
  border: `1px solid ${netflixNeumorphic.borderStrong}`,
}
