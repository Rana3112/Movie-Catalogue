import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CalendarDays, ExternalLink } from 'lucide-react'
import { netflixNeumorphic, netflixPageStyle, netflixRaisedStyle, netflixSurfaceStyle } from '../styles/netflixNeumorphic'

const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'

const flatten = (entriesByDate = {}) => (
  Object.entries(entriesByDate)
    .flatMap(([date, entries]) => (entries || []).map(entry => ({ ...entry, date })))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
)

export default function SharedCalendar() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const resetTimer = window.setTimeout(() => {
      if (!cancelled) {
        setLoading(true)
        setError('')
        setData(null)
      }
    }, 0)
    fetch(`${API_URL}/api/calendar/share/${encodeURIComponent(token)}`)
      .then(async response => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error || 'Unable to open shared calendar')
        return body
      })
      .then(body => {
        if (!cancelled) setData(body)
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      window.clearTimeout(resetTimer)
    }
  }, [token])

  const entries = useMemo(() => flatten(data?.entriesByDate), [data])

  return (
    <div className="min-h-screen" style={netflixPageStyle}>
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: '10%', left: '8%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,9,20,0.22), transparent 70%)', filter: 'blur(76px)' }} />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-10 md:px-8">
        <header className="rounded-[34px] p-6 md:p-8" style={netflixSurfaceStyle}>
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.24em]" style={{ color: netflixNeumorphic.muted }}>Shared watch calendar</p>
              <h1 className="m-0 mt-2 text-4xl font-black md:text-6xl">
                {loading ? 'Opening calendar...' : error ? 'Share unavailable' : `${data?.total || 0} saved titles`}
              </h1>
              {data?.owner && <p className="m-0 mt-3" style={{ color: netflixNeumorphic.textSoft }}>Shared by {data.owner}</p>}
            </div>
            <Link to="/" className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 font-extrabold no-underline" style={{ ...netflixRaisedStyle, color: netflixNeumorphic.text }}>
              Open Categloge <ExternalLink size={16} />
            </Link>
          </div>
        </header>

        {error && (
          <section className="mt-6 rounded-[28px] p-6" style={netflixRaisedStyle}>
            <p className="m-0" style={{ color: '#ffb4b9' }}>{error}</p>
          </section>
        )}

        {!error && !loading && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(entry => (
              <article key={entry._id || `${entry.date}-${entry.title}`} className="overflow-hidden rounded-[28px]" style={netflixRaisedStyle}>
                <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 p-4">
                  <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-neutral-950">
                    {entry.poster ? <img src={entry.poster} alt={entry.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full place-items-center"><CalendarDays /></div>}
                  </div>
                  <div className="min-w-0">
                    <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: netflixNeumorphic.muted }}>{entry.date}</p>
                    <h2 className="m-0 mt-2 line-clamp-2 text-xl font-black">{entry.title}</h2>
                    <p className="m-0 mt-2 text-sm" style={{ color: netflixNeumorphic.textSoft }}>{entry.category || 'Movies'} | {entry.status || 'saved'}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(entry.genres || [entry.genre || 'General']).slice(0, 3).map(genre => (
                        <span key={genre} className="rounded-full px-2 py-1 text-[10px] font-extrabold uppercase" style={{ background: 'rgba(229,9,20,0.14)', color: '#ffb4b9', border: `1px solid ${netflixNeumorphic.borderStrong}` }}>
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
