import './MobileBackground.css'

export function MobilePillarBg({ variant = 'landing' }) {
  return (
    <div className={`mobile-pillar-bg ${variant === 'home' ? 'mobile-home-bg' : 'mobile-landing-bg'}`}>
      <div className="pillar pillar-1" />
      <div className="pillar pillar-2" />
      <div className="pillar pillar-3" />
    </div>
  )
}

export function MobileFloatingLinesBg() {
  return (
    <div className="mobile-floating-lines">
      <div className="line line-1" />
      <div className="line line-2" />
      <div className="line line-3" />
      <div className="line line-4" />
      <div className="line line-5" />
    </div>
  )
}

export function MobileStarsBg() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    size: `${1 + Math.random() * 2}px`,
  }))

  return (
    <div className="mobile-stars-bg">
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: s.left,
            top: s.top,
            animationDelay: s.delay,
            width: s.size,
            height: s.size,
          }}
        />
      ))}
    </div>
  )
}

export function MobileDarkGradient() {
  return <div className="mobile-dark-gradient" />
}
