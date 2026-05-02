import { CalendarPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { useToast } from '../../components/ui/Toast'

const toEntryDate = (value, fallbackYear) => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const year = fallbackYear || new Date().getFullYear()
  return `${year}-01-01`
}

const categoryLabel = {
  movie: 'Movies',
  tv: 'Series',
  anime: 'Anime',
}

export default function StreamCalendarButton({ media, category, className = 'streaming-secondary-button' }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, isGuest, addEntry, setYear, setCategory, setSelectedGenres, setSelectedMonth } = useStore()

  const handleAdd = async () => {
    if (!user?.email || isGuest) {
      toast?.addToast?.('Create an account to save StreamZone titles to your calendar.', 'warning')
      navigate('/signup')
      return
    }

    const finalCategory = categoryLabel[category] || 'Movies'
    const genres = Array.isArray(media.genres) && media.genres.length
      ? media.genres.map(g => typeof g === 'string' ? g : g.name).filter(Boolean)
      : ['General']
    const releaseDate = toEntryDate(media.releaseDate, media.year)
    const [year, month] = releaseDate.split('-').map(Number)

    setYear(year)
    setCategory(finalCategory)
    setSelectedGenres(genres)
    setSelectedMonth(Math.max(0, (month || 1) - 1))

    await addEntry(releaseDate, {
      title: media.title,
      status: 'upcoming',
      rating: media.rating || 0,
      poster: media.poster || null,
      genres,
      genre: genres[0] || 'General',
      category: finalCategory,
      year,
      description: media.description || null,
      imdbLink: media.imdbLink || null,
      source: 'streamzone',
    })

    toast?.addToast?.(`${media.title} added to ${finalCategory} calendar.`, 'success')
  }

  return (
    <button type="button" className={className} onClick={handleAdd}>
      <CalendarPlus size={18} />
      Add to Calendar
    </button>
  )
}
