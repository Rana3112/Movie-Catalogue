import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { ChevronRight } from 'lucide-react'

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
              background: '#E8EAED',
              borderRadius: 32,
              boxShadow: isSelected
                ? 'inset 4px 4px 10px rgba(180,190,210,0.5), inset -2px -2px 6px rgba(255,255,255,0.95)'
                : '4px 4px 10px rgba(180,190,210,0.5), -2px -2px 6px rgba(255,255,255,0.95)',
              border: '1px solid rgba(255,255,255,0.95)',
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
                  ? 'linear-gradient(180deg, #7B8EC8 0%, rgba(123,142,200,0.4) 100%)'
                  : 'linear-gradient(180deg, rgba(155,168,210,0.7) 0%, rgba(155,168,210,0.25) 100%)',
                flexShrink: 0,
              }}
            />

            {/* Year Label */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? '#1A202C' : '#475569',
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
                    color: '#5A6478',
                    background: 'linear-gradient(145deg, rgba(218,223,236,0.9), rgba(200,208,226,0.85))',
                    border: '1px solid rgba(190,200,220,0.6)',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontFamily: "'Montserrat', 'Raleway', sans-serif",
                    boxShadow: '2px 2px 5px rgba(150,160,185,0.35), -1px -1px 4px rgba(255,255,255,0.9)',
                  }}
                >
                  NOW
                </span>
              )}
              {badge === 'chevron' && (
                <ChevronRight
                  size={20}
                  strokeWidth={1.5}
                  style={{ color: '#9CA3AF' }}
                />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
