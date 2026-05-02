import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Clapperboard, Compass, Flame, Star, Tv } from 'lucide-react'
import { useStore } from '../store/useStore'
import UserBadge from '../components/ui/UserBadge'
import { netflixNeumorphic, netflixPageStyle, netflixRaisedStyle, netflixRedButtonStyle, netflixSurfaceStyle } from '../styles/netflixNeumorphic'

const flattenEntries = (entriesByDate = {}) => (
  Object.values(entriesByDate).flat().filter(Boolean)
)

const countBy = (items, getKey) => {
  const counts = new Map()
  items.forEach(item => {
    const key = getKey(item)
    if (!key) return
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

const percent = (value, total) => {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export default function TasteDNA() {
  const navigate = useNavigate()
  const { calendarEntries, fetchEntries, user } = useStore()

  useEffect(() => {
    fetchEntries().catch(() => {})
  }, [fetchEntries])

  const entries = useMemo(() => flattenEntries(calendarEntries), [calendarEntries])
  const total = entries.length
  const categoryStats = useMemo(() => countBy(entries, entry => entry.category || 'Movies'), [entries])
  const genreStats = useMemo(() => {
    const genres = entries.flatMap(entry => entry.genres?.length ? entry.genres : [entry.genre || 'General'])
    return countBy(genres, genre => genre).slice(0, 10)
  }, [entries])
  const statusStats = useMemo(() => countBy(entries, entry => entry.status || 'watched'), [entries])
  const topRated = useMemo(() => (
    [...entries]
      .filter(entry => Number(entry.rating) > 0)
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 6)
  ), [entries])
  const averageRating = useMemo(() => {
    const rated = entries.filter(entry => Number(entry.rating) > 0)
    if (!rated.length) return 0
    return (rated.reduce((sum, entry) => sum + Number(entry.rating || 0), 0) / rated.length).toFixed(1)
  }, [entries])
  const dominantGenre = genreStats[0]?.name || 'Discovery'
  const dominantCategory = categoryStats[0]?.name || 'Movies'

  return (
    <div className="min-h-screen" style={netflixPageStyle}>
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: '8%', left: '7%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,9,20,0.23), transparent 70%)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', right: '8%', bottom: '8%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(80,0,12,0.26), transparent 72%)', filter: 'blur(80px)' }} />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 md:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="grid h-12 w-12 place-items-center rounded-2xl"
            style={netflixRaisedStyle}
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.24em]" style={{ color: netflixNeumorphic.muted }}>Personal analytics</p>
            <h1 className="m-0 mt-1 text-3xl font-black md:text-5xl">Taste DNA</h1>
          </div>
        </div>
        <UserBadge />
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-6 px-5 pb-24 md:grid-cols-[1.08fr_0.92fr] md:px-8">
        <section className="rounded-[34px] p-6 md:p-8" style={netflixSurfaceStyle}>
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="m-0 text-[12px] font-extrabold uppercase tracking-[0.22em]" style={{ color: netflixNeumorphic.muted }}>
                {user?.name || 'Your'} viewing profile
              </p>
              <h2 className="m-0 mt-3 text-4xl font-black leading-tight md:text-6xl">
                {dominantGenre} driven, {dominantCategory.toLowerCase()} heavy.
              </h2>
            </div>
            <div className="grid h-28 w-28 place-items-center rounded-[32px]" style={netflixRedButtonStyle}>
              <Flame size={42} />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Saved titles', value: total, icon: Clapperboard },
              { label: 'Avg rating', value: averageRating ? `${averageRating}/5` : 'N/A', icon: Star },
              { label: 'Top genre', value: dominantGenre, icon: Compass },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-[26px] p-5" style={netflixRaisedStyle}>
                  <Icon size={22} style={{ color: netflixNeumorphic.red }} />
                  <p className="m-0 mt-4 text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: netflixNeumorphic.muted }}>{item.label}</p>
                  <strong className="mt-2 block text-2xl">{item.value}</strong>
                </div>
              )
            })}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 size={18} style={{ color: netflixNeumorphic.red }} />
              <h3 className="m-0 text-xl font-black">Genre fingerprint</h3>
            </div>
            <div className="grid gap-3">
              {genreStats.length ? genreStats.map(item => (
                <div key={item.name} className="grid grid-cols-[120px_minmax(0,1fr)_42px] items-center gap-3">
                  <span className="truncate text-sm font-bold" style={{ color: netflixNeumorphic.textSoft }}>{item.name}</span>
                  <div className="h-3 overflow-hidden rounded-full" style={{ background: netflixNeumorphic.panelSoft, border: `1px solid ${netflixNeumorphic.border}` }}>
                    <div style={{ width: `${percent(item.count, total)}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${netflixNeumorphic.red}, ${netflixNeumorphic.redDeep})` }} />
                  </div>
                  <span className="text-right text-xs font-black" style={{ color: netflixNeumorphic.muted }}>{item.count}</span>
                </div>
              )) : (
                <p style={{ color: netflixNeumorphic.textSoft }}>Add titles to your calendar to generate your Taste DNA.</p>
              )}
            </div>
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-[34px] p-6" style={netflixSurfaceStyle}>
            <div className="flex items-center gap-2">
              <Tv size={18} style={{ color: netflixNeumorphic.red }} />
              <h3 className="m-0 text-xl font-black">Category mix</h3>
            </div>
            <div className="mt-5 grid gap-3">
              {categoryStats.map(item => (
                <div key={item.name} className="rounded-[22px] p-4" style={netflixRaisedStyle}>
                  <div className="flex items-center justify-between gap-3">
                    <strong>{item.name}</strong>
                    <span style={{ color: netflixNeumorphic.textSoft }}>{percent(item.count, total)}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: '#0d0d0f' }}>
                    <div style={{ width: `${percent(item.count, total)}%`, height: '100%', background: netflixNeumorphic.red }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[34px] p-6" style={netflixSurfaceStyle}>
            <h3 className="m-0 text-xl font-black">Status pulse</h3>
            <div className="mt-5 flex flex-wrap gap-3">
              {statusStats.map(item => (
                <div key={item.name} className="rounded-2xl px-4 py-3" style={netflixRaisedStyle}>
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: netflixNeumorphic.muted }}>{item.name}</span>
                  <strong className="mt-1 block text-2xl">{item.count}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[34px] p-6" style={netflixSurfaceStyle}>
            <h3 className="m-0 text-xl font-black">Highest rated</h3>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {topRated.length ? topRated.map(entry => (
                <div key={entry._id || `${entry.title}-${entry.date}`} className="overflow-hidden rounded-[20px]" style={netflixRaisedStyle}>
                  <div className="aspect-[2/3] bg-neutral-950">
                    {entry.poster ? <img src={entry.poster} alt={entry.title} className="h-full w-full object-cover" loading="lazy" /> : null}
                  </div>
                  <div className="p-3">
                    <h4 className="m-0 line-clamp-2 text-sm font-black">{entry.title}</h4>
                    <p className="m-0 mt-1 text-xs" style={{ color: netflixNeumorphic.textSoft }}>Star {entry.rating}/5</p>
                  </div>
                </div>
              )) : (
                <p className="col-span-2" style={{ color: netflixNeumorphic.textSoft }}>Rate a few entries to unlock this panel.</p>
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}
