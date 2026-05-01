import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { ChevronRight } from 'lucide-react'
import { netflixNeumorphic, netflixRaisedStyle, netflixInsetStyle } from '../../styles/netflixNeumorphic'

export default function MobileYearBarrel() {
  const scrollRef = useRef(null)
  const navigate = useNavigate()
  const setYear = useStore(s => s.setYear)
  const selectedYear = useStore(s => s.selectedYear)

  const years = []
  for (let y = 1900; y <= 2050; y++) years.push(y)

  const currentYear = new Date().getFullYear()

  // Scroll to selected year on mount
  useEffect(() => {
    if (scrollRef.current && selectedYear) {
      const idx = years.indexOf(selectedYear)
      if (idx >= 0) {
        setTimeout(() => {
          const itemHeight = 86 // 72px card + 14px gap
          const container = scrollRef.current
          if (container) {
             container.scrollTop = Math.max(0, idx * itemHeight - container.clientHeight / 2 + itemHeight / 2)
          }
        }, 100)
      }
    }
  }, [selectedYear])

  // Which badge to show per year
  const getBadge = (y) => {
    if (y === currentYear) return 'now'
    if (y === currentYear + 1) return 'chevron'
    return null
  }

  return (
    <div
      ref={scrollRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflowY: 'auto',
        paddingTop: 12,
        paddingBottom: 200, // Extra bottom space for better scroll reach
        willChange: 'scroll-position',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        overscrollBehavior: 'contain',
        position: 'relative',
      }}
    >
      {years.map((y) => {
        const badge = getBadge(y)
        const isSelected = y === selectedYear

        return (
          <button
            key={y}
            onClick={() => {
              setYear(y)
              navigate('/category')
            }}
            aria-label={`Select year ${y}`}
            className="pressable"
            style={{
              width: '100%',
              height: 72,
              minHeight: 72,
              flexShrink: 0,
              // Matched to top navigation buttons exactly
              ...(isSelected ? netflixInsetStyle : netflixRaisedStyle),
              borderRadius: 32,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 20,
              paddingRight: 20,
              overflow: 'hidden',
              position: 'relative',
              willChange: 'transform, box-shadow',
            }}
          >
            {/* Left accent bar */}
            <div
              style={{
                width: 4,
                height: 32,
                borderRadius: 4,
                background: isSelected
                  ? `linear-gradient(180deg, ${netflixNeumorphic.red} 0%, rgba(229,9,20,0.35) 100%)`
                  : 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 100%)',
                flexShrink: 0,
              }}
            />

            {/* Year Label */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? netflixNeumorphic.text : netflixNeumorphic.textSoft,
                  letterSpacing: '0.05em',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                {y}
              </span>
            </div>

            {/* Right badge */}
            <div style={{ flexShrink: 0, width: 60, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              {badge === 'now' && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: netflixNeumorphic.text,
                    background: 'rgba(229,9,20,0.16)',
                    border: '1px solid rgba(229,9,20,0.35)',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontFamily: "'Montserrat', 'Raleway', sans-serif",
                    boxShadow: '0 8px 18px rgba(229,9,20,0.16)',
                  }}
                >
                  NOW
                </span>
              )}
              {badge === 'chevron' && (
                <ChevronRight
                  size={20}
                  strokeWidth={1.5}
                  style={{ color: netflixNeumorphic.textSoft }}
                />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
