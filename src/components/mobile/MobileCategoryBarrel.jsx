import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Film, Tv, Sparkles, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { netflixNeumorphic, netflixRaisedStyle, netflixRedButtonStyle, netflixInsetStyle } from '../../styles/netflixNeumorphic'

const CATEGORIES = [
  {
    id: 'MyCalendar',
    label: 'My Calendar',
    subtitle: 'All in one calendar',
    icon: CalendarIcon,
  },
  {
    id: 'Movies',
    label: 'Movies',
    subtitle: 'Feature Films & Cinema',
    icon: Film,
  },
  {
    id: 'Series',
    label: 'Series',
    subtitle: 'TV Shows & Web Series',
    icon: Tv,
  },
  {
    id: 'Anime',
    label: 'Anime',
    subtitle: 'Animation & Japanese',
    icon: Sparkles,
  },
]

export default function MobileCategoryBarrel({ onHover }) {
  const navigate = useNavigate()
  const setCategory = useStore(s => s.setCategory)
  const year = useStore(s => s.selectedYear)

  const handleClick = (cat) => {
    if (cat === 'MyCalendar') {
      setCategory(null)
      useStore.setState({ selectedGenres: [] })
      navigate('/calendar')
    } else {
      setCategory(cat)
      navigate('/genres')
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-5 pb-8">
      <div className="flex flex-col gap-5 w-full max-w-sm">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon
          const isSpecial = cat.id === 'MyCalendar'
          
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={() => handleClick(cat.id)}
              className="pressable relative flex items-center gap-5 p-5 transition-all duration-200"
              style={{
                ...(isSpecial ? netflixRedButtonStyle : netflixRaisedStyle),
                borderRadius: 32,
                minHeight: 100,
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              {/* Inner light reflection - cleaner version */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isSpecial 
                    ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 60%)'
                    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 60%)',
                }}
              />

              <div
                className="flex-shrink-0 flex items-center justify-center rounded-2xl relative z-10"
                style={{
                  width: 56,
                  height: 56,
                  ...(isSpecial ? { background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' } : netflixInsetStyle),
                }}
              >
                <Icon size={24} style={{ color: isSpecial ? '#FFFFFF' : netflixNeumorphic.red }} strokeWidth={1.5} />
              </div>

              <div className="flex-1 text-left min-w-0 relative z-10">
                <h3
                  className="text-lg tracking-wide"
                  style={{
                    color: netflixNeumorphic.text,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {cat.label}
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{
                    color: isSpecial ? 'rgba(255, 255, 255, 0.8)' : netflixNeumorphic.textSoft,
                    fontWeight: 400,
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {cat.subtitle}
                </p>
              </div>

              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full relative z-10"
                style={{
                  width: 32,
                  height: 32,
                  ...(isSpecial ? { background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' } : netflixInsetStyle),
                }}
              >
                <ChevronRight
                  size={18}
                  style={{ color: isSpecial ? '#FFFFFF' : netflixNeumorphic.textSoft }}
                  strokeWidth={2}
                />
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
