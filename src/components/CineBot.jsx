import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { CalendarClock } from 'lucide-react'
import { useStore } from '../store/useStore'
import './CineBot.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'

const normalizeCalendarCategory = (data = {}) => {
    const explicitCat = String(data.category || '').trim().toLowerCase()
    if (explicitCat === 'anime') return 'Anime'
    if (explicitCat === 'series' || explicitCat === 'tv' || explicitCat === 'tv series') return 'Series'
    if (explicitCat === 'movies' || explicitCat === 'movie' || explicitCat === 'film') return 'Movies'

    const explicitType = String(data.type || '').trim().toLowerCase()
    if (/series|tv|tvseries|tv series|tvminiseries|tv mini series|tvspecial|tvshort|episode|show|television|web series|miniseries/.test(explicitType)) {
        return 'Series'
    }
    if (/movie|feature|film/.test(explicitType)) {
        return 'Movies'
    }
    if (/anime|animeseries/.test(explicitType)) {
        return 'Anime'
    }

    const genres = Array.isArray(data.genres)
        ? data.genres
        : (data.genre ? String(data.genre).split(',') : [])
    const text = [
        data.type,
        data.title,
        data.description,
        data.country,
        data.language,
        data.genre,
        ...genres,
    ].filter(Boolean).join(' ').toLowerCase()

    if (/\banime\b|anime series|japanese animation|\bmanga\b|\bshoujo\b|\bshojo\b|\bshounen\b|\bshonen\b|\bseinen\b|\bisekai\b/.test(text)) {
        return 'Anime'
    }

    if (genres.some(g => /animation/i.test(g)) && /japan|japanese/.test(text)) {
        return 'Anime'
    }

    if (/\btv\b|tvseries|tvminiseries|tv-series|tv series|tv mini series|tv mini-series|television|series|mini-series|miniseries|limited series|web series|\bshow\b|episode|season/i.test(text)) {
        return 'Series'
    }

    return 'Movies'
}

const normalizeTitleForMatch = (value = '') => (
    String(value)
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
)

const enrichWithImdbSuggestion = async (movieData, query) => {
    const searchTitle = movieData.title || query
    const normalizedSearch = normalizeTitleForMatch(searchTitle)
    if (!normalizedSearch) return movieData

    try {
        const firstChar = normalizedSearch.replace(/\s+/g, '')[0] || 't'
        const suggestionUrl = `https://v2.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(searchTitle)}.json`
        const suggestionRes = await fetch(suggestionUrl)
        if (!suggestionRes.ok) return movieData

        const suggestionData = await suggestionRes.json()
        const candidates = Array.isArray(suggestionData.d) ? suggestionData.d : []
        const best = candidates.find(item => normalizeTitleForMatch(item.l) === normalizedSearch)
            || candidates.find(item => normalizeTitleForMatch(item.l).includes(normalizedSearch))
            || candidates[0]

        if (!best) return movieData
        const yearMatch = typeof best.yr === 'string' ? best.yr.match(/\d{4}/) : null
        const yearFromRange = yearMatch ? parseInt(yearMatch[0], 10) : null
        const imdbType = String(best.qid || best.q || '').toLowerCase()
        const isTvSeries = /tvseries|tvminiseries|tvspecial|tvshort|series|tv/.test(imdbType)

        return {
            ...movieData,
            title: movieData.title || best.l,
            year: movieData.year || best.y || yearFromRange,
            imdbLink: movieData.imdbLink || (best.id ? `https://www.imdb.com/title/${best.id}/` : null),
            type: movieData.type || best.qid || best.q,
            category: isTvSeries ? 'Series' : (movieData.category || null)
        }
    } catch (error) {
        console.warn('[CineBot] IMDb suggestion fallback failed:', error)
        return movieData
    }
}

const enrichWithAniList = async (movieData, query) => {
    const searchTitle = movieData.title || query
    const normalizedSearch = normalizeTitleForMatch(searchTitle)
    if (!normalizedSearch) return movieData

    try {
        const res = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                  query ($search: String) {
                    Page(page: 1, perPage: 5) {
                      media(search: $search, type: ANIME, isAdult: false) {
                        id
                        title { romaji english native }
                        seasonYear
                        genres
                        coverImage { extraLarge large }
                        description(asHtml: false)
                      }
                    }
                  }
                `,
                variables: { search: searchTitle }
            })
        })
        if (!res.ok) return movieData

        const data = await res.json()
        const matches = data?.data?.Page?.media || []
        const best = matches.find(item => {
            const titles = [item.title?.english, item.title?.romaji, item.title?.native].filter(Boolean)
            return titles.some(title => normalizeTitleForMatch(title) === normalizedSearch)
        })

        if (!best) return movieData

        const currentType = String(movieData.type || '').toLowerCase()
        const hasStrongMovieEvidence = /movie|feature|film/.test(currentType)
        if (hasStrongMovieEvidence) return movieData

        return {
            ...movieData,
            category: 'Anime',
            type: 'anime',
            title: movieData.title || best.title?.english || best.title?.romaji || searchTitle,
            genres: movieData.genres?.length ? movieData.genres : (best.genres || []),
            genre: movieData.genre && movieData.genre !== 'General' ? movieData.genre : (best.genres?.[0] || movieData.genre || 'General'),
            year: movieData.year || best.seasonYear,
            releaseDate: movieData.releaseDate || (best.seasonYear ? `${best.seasonYear}-01-01` : null),
            poster: movieData.poster || best.coverImage?.extraLarge || best.coverImage?.large || null,
            description: movieData.description || best.description || null,
        }
    } catch (error) {
        console.warn('[CineBot] AniList fallback failed:', error)
        return movieData
    }
}

export default function CineBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'bot', content: "Hey! 🎬 I'm **CineBot**, your AI movie assistant. Ask me about any movie, series, or anime and I'll fetch its details and can add it to your calendar!" }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef(null)
    const messagesContainerRef = useRef(null)
    const inputRef = useRef(null)

    const { user, addEntry, setYear, setCategory, setSelectedGenres, setSelectedMonth, setCineBotPendingEntry } = useStore()
    const navigate = useNavigate()
    const location = useLocation()

    // Auto-scroll to bottom on new messages
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
    }

    // Effect: Scroll to bottom immediately on any messages/loading change
    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    // Effect: Setup MutationObserver to catch any layout shifts in the chat (e.g., text rendering)
    useEffect(() => {
        if (!messagesContainerRef.current) return

        const observer = new MutationObserver(() => {
            scrollToBottom()
        })

        observer.observe(messagesContainerRef.current, {
            childList: true,
            subtree: true,
            attributes: false
        })

        return () => observer.disconnect()
    }, [isOpen])

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen])

    // Build conversation history for context
    const getConversationHistory = () => {
        return messages
            .filter(m => m.role === 'user' || m.role === 'bot' || m.role === 'movie')
            .map(m => {
                if (m.role === 'movie') {
                    return { role: 'assistant', content: `[Showed movie card for: ${m.data.title}]` }
                }
                return {
                    role: m.role === 'bot' ? 'assistant' : 'user',
                    content: m.content
                }
            })
            .slice(-10)
    }

    // Handle sending a message
    const handleSend = async () => {
        const text = input.trim()
        if (!text || isLoading) return

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: text }])
        setInput('')
        setIsLoading(true)

        try {
            // Step 1: Send to chat endpoint
            const chatRes = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    userEmail: user?.email || null,
                    conversationHistory: getConversationHistory()
                })
            })

            const chatData = await chatRes.json()

            if (!chatRes.ok) {
                throw new Error(chatData.error || 'Chat request failed')
            }

            // Add bot reply
            setMessages(prev => [...prev, { role: 'bot', content: chatData.reply }])

            // Step 2: Determine if we should do a movie lookup
            let lookupQueries = []

            if (chatData.action && chatData.action.type === 'movie_lookup') {
                // Normal path: LLM returned the action block
                if (chatData.action.queries && chatData.action.queries.length > 0) {
                    lookupQueries = chatData.action.queries
                } else if (chatData.action.query) {
                    lookupQueries = [chatData.action.query]
                }
            } else if (!chatData.action) {
                // Fallback: detect when the LLM should have triggered a lookup but didn't
                const replyLower = (chatData.reply || '').toLowerCase()
                const textLower = text.toLowerCase()

                // Check if the bot's reply suggests it intended to look something up
                const botIntendedLookup = replyLower.includes('look that up') ||
                    replyLower.includes('look it up') ||
                    replyLower.includes('let me look') ||
                    replyLower.includes('let me find') ||
                    replyLower.includes('let me search') ||
                    replyLower.includes('searching for') ||
                    replyLower.includes('fetch more details') ||
                    replyLower.includes('here\'s the details') ||
                    replyLower.includes('here are the details') ||
                    replyLower.includes('i\'ll find') ||
                    replyLower.includes('i\'ll look') ||
                    replyLower.includes('i\'ll search') ||
                    replyLower.includes('i\'ll fetch')

                // Check if user's message looks like a movie title (short, no question)
                const looksLikeTitle = text.split(/\s+/).length <= 8 &&
                    !text.includes('?') &&
                    !textLower.startsWith('how') &&
                    !textLower.startsWith('why') &&
                    !textLower.startsWith('what is') &&
                    !textLower.startsWith('who') &&
                    !textLower.startsWith('recommend') &&
                    !textLower.startsWith('suggest') &&
                    textLower !== 'yes' &&
                    textLower !== 'no' &&
                    textLower !== 'ok' &&
                    textLower !== 'thanks'

                // Check if bot's reply talks about a specific movie/show
                const botTalksAboutMovie = replyLower.includes('film') ||
                    replyLower.includes('movie') ||
                    replyLower.includes('series') ||
                    replyLower.includes('anime') ||
                    replyLower.includes('great choice')

                if (botIntendedLookup || (looksLikeTitle && botTalksAboutMovie)) {
                    lookupQueries = [text] // Use the user's original message as the query
                }
            }

            // Step 3: If we have lookup queries, fetch movie data
            if (lookupQueries.length > 0) {
                setMessages(prev => [...prev, { role: 'bot', content: '🔍 Searching for title details...' }])

                const fetches = lookupQueries.map(async (query) => {
                    try {
                        const lookupRes = await fetch(`${API_URL}/api/movie-lookup`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query })
                        })
                        let movieData = await lookupRes.json()
                        if (lookupRes.ok && movieData.title) {
                            movieData = await enrichWithImdbSuggestion(movieData, query)
                            movieData = await enrichWithAniList(movieData, query)
                            // Frontend fallback: If backend returns 'General' or is missing poster, fetch via OMDB using IMDB id!
                            if (movieData.imdbLink && (movieData.genre === 'General' || !movieData.genres || movieData.genres.length === 0 || !movieData.poster)) {
                                const imdbIdMatch = movieData.imdbLink.match(/title\/(tt\d+)/);
                                if (imdbIdMatch) {
                                    try {
                                        const omdbKey = import.meta.env.VITE_OMDB_API_KEY || 'trilogy';
                                        if (omdbKey) {
                                            const omdbRes = await fetch(`https://www.omdbapi.com/?i=${imdbIdMatch[1]}&apikey=${omdbKey}`);
                                            const omdbData = await omdbRes.json();
                                            if (omdbRes.ok && omdbData.Response === 'True') {
                                                if (omdbData.Genre && omdbData.Genre !== 'N/A') {
                                                    movieData.genres = omdbData.Genre.split(',').map(g => g.trim());
                                                    movieData.genre = movieData.genres[0];
                                                }
                                                if (omdbData.Type && omdbData.Type !== 'N/A') {
                                                    movieData.type = omdbData.Type;
                                                }
                                                if (omdbData.Country && omdbData.Country !== 'N/A') {
                                                    movieData.country = omdbData.Country;
                                                }
                                                if (omdbData.Language && omdbData.Language !== 'N/A') {
                                                    movieData.language = omdbData.Language;
                                                }
                                                if (!movieData.poster && omdbData.Poster && omdbData.Poster !== 'N/A') {
                                                    movieData.poster = omdbData.Poster;
                                                }
                                                if (!movieData.year && omdbData.Year) {
                                                    movieData.year = parseInt(omdbData.Year);
                                                }
                                                if (omdbData.Ratings) {
                                                    const rt = omdbData.Ratings.find(r => r.Source === "Rotten Tomatoes");
                                                    if (rt) {
                                                        movieData.rtCriticScore = rt.Value.replace('%', '');
                                                    }
                                                }
                                            }
                                        }
                                    } catch (err) {
                                        console.error('OMDB fallback failed:', err);
                                    }
                                }
                            }
                            movieData.category = normalizeCalendarCategory(movieData)
                            return movieData
                        }
                    } catch (e) {
                        console.error(e)
                    }
                    return null
                })

                const results = await Promise.all(fetches)
                const validMovies = results.filter(m => m !== null)

                setMessages(prev => {
                    const updated = [...prev]
                    // Remove the last "searching..." message
                    if (updated[updated.length - 1]?.content?.includes('Searching')) {
                        updated.pop()
                    }

                    if (validMovies.length > 0) {
                        // Append a movie card for each valid result
                        validMovies.forEach(movie => {
                            updated.push({ role: 'movie', data: movie })
                        })
                    } else {
                        updated.push({ role: 'bot', content: "Sorry, I couldn't find detailed info for those titles. Try slightly different names? 🤔" })
                    }
                    return updated
                })
            }

        } catch (err) {
            console.error('[CineBot] Error:', err)
            setMessages(prev => [...prev, {
                role: 'bot',
                content: `Oops! Something went wrong: ${err.message}. Please try again.`
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleBuildPlanner = async () => {
        if (isLoading) return
        if (!user?.email) {
            setMessages(prev => [...prev, { role: 'bot', content: 'Sign in first so I can build a planner from your saved calendar.' }])
            return
        }

        setIsLoading(true)
        setMessages(prev => [...prev, { role: 'user', content: 'Build my CineBot watch planner' }])

        try {
            const response = await fetch(`${API_URL}/api/watch-planner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, days: 5 })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Planner request failed')

            setMessages(prev => [
                ...prev,
                { role: 'bot', content: 'I built a focused watch plan from your catalogue.' },
                { role: 'plan', data }
            ])
        } catch (err) {
            console.error('[CineBot Planner] Error:', err)
            setMessages(prev => [...prev, { role: 'bot', content: `Planner failed: ${err.message}. Try again in a moment.` }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddPlanToCalendar = async (plan) => {
        const items = Array.isArray(plan?.items) ? plan.items : []
        if (!items.length) return
        setIsLoading(true)
        try {
            for (const item of items) {
                await addEntry(item.date, {
                    title: item.title,
                    status: item.status || 'upcoming',
                    rating: item.rating || 0,
                    poster: item.poster || null,
                    category: item.category || 'Movies',
                    genres: item.genres?.length ? item.genres : ['General'],
                    genre: item.genres?.[0] || 'General',
                    year: item.year || Number(String(item.date).slice(0, 4)),
                    description: item.description || item.reason || null,
                    source: 'cinebot-watch-planner',
                })
            }
            setMessages(prev => [...prev, { role: 'bot', content: `Saved ${items.length} planner entries to your calendar.` }])
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', content: `I saved what I could, but one planner item failed: ${err.message}` }])
        } finally {
            setIsLoading(false)
        }
    }

    // Handle adding movie to calendar — navigates through the proper app flow
    const handleAddToCalendar = (movieData) => {
        if (!movieData.releaseDate && !movieData.year) {
            setMessages(prev => [...prev, {
                role: 'bot',
                content: "⚠️ I couldn't find the release date for this title, so I can't navigate to the calendar."
            }])
            return
        }

        // Parse the release date safely
        let year = movieData.year || new Date().getFullYear()
        let month = 0
        let day = 1

        if (movieData.releaseDate) {
            if (String(movieData.releaseDate).includes('-')) {
                // ISO format: YYYY-MM-DD
                const dateParts = String(movieData.releaseDate).split('-')
                year = parseInt(dateParts[0]) || year
                month = dateParts[1] ? parseInt(dateParts[1]) - 1 : 0
                day = dateParts[2] ? parseInt(dateParts[2]) : 1
            } else {
                // Parse date strings (e.g. "October 21, 2022")
                const parsedDate = new Date(movieData.releaseDate)
                if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1800) {
                    year = parsedDate.getFullYear()
                    month = parsedDate.getMonth()
                    day = parsedDate.getDate()
                } else {
                    const yearMatch = String(movieData.releaseDate).match(/(\d{4})/)
                    if (yearMatch) year = parseInt(yearMatch[1])
                }
            }
        }

        const category = normalizeCalendarCategory(movieData)
        const standardGenreMap = {
            'science fiction': 'Sci-Fi',
            'rom-com': 'Romance',
            'romantic comedy': 'Romance',
            'tv-movie': 'TV Movie',
            'tv show': 'General',
            'action & adventure': 'Action',
            'kids': 'Family'
        };

        let fetchedGenres = [];
        if (movieData.genres && Array.isArray(movieData.genres) && movieData.genres.length > 0) {
            fetchedGenres = movieData.genres;
        } else if (movieData.genre) {
            fetchedGenres = typeof movieData.genre === 'string' ? movieData.genre.split(',').map(g => g.trim()) : [movieData.genre];
        }

        const genres = [...new Set(fetchedGenres
            .filter(g => g && g.toLowerCase() !== 'general')
            .map(g => {
                const lower = g.toLowerCase();
                return standardGenreMap[lower] || (g.charAt(0).toUpperCase() + g.slice(1));
            }))];

        if (genres.length === 0) genres.push('General');

        // Step 1: Set store state to navigate through the app flow
        setYear(year)
        setCategory(category)
        setSelectedGenres(genres)
        setSelectedMonth(month)

        // Step 2: Set pending entry for Calendar to auto-open modal
        setCineBotPendingEntry({
            title: movieData.title,
            poster: movieData.poster || null,
            description: movieData.description || null,
            imdbLink: movieData.imdbLink || null,
            genres,
            rtCriticScore: movieData.rtCriticScore || '',
            rtAudienceScore: movieData.rtAudienceScore || '',
            releaseDate: movieData.releaseDate,
            day,
            month,
            year,
            category,
            status: 'watched'
        })

        // Step 3: Navigate to calendar
        setMessages(prev => [...prev, {
            role: 'bot',
            content: `🚀 Navigating to **${category}** calendar for **${movieData.title}** (${year})... The add entry modal will open automatically!`
        }])

        // Close chat panel and navigate
        setTimeout(() => {
            setIsOpen(false)
            navigate('/calendar')
        }, 800)
    }

    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Format markdown-like bold text
    const formatText = (text) => {
        if (!text) return ''
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    }

    if (location.pathname.startsWith('/streaming')) {
        return null;
    }

    return (
        <>
            {/* Floating Action Button */}
            <button
                className="cinebot-fab"
                onClick={() => setIsOpen(!isOpen)}
                title="CineBot AI Assistant"
            >
                {isOpen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <path d="M12 7v2" strokeLinecap="round" />
                        <path d="M8 11h8" strokeLinecap="round" />
                        <path d="M8 14h5" strokeLinecap="round" />
                    </svg>
                )}
            </button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <Motion.div
                        className="cinebot-panel neon-glimpse-border"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        {/* Header */}
                        <div className="cinebot-header">
                            <div className="cinebot-header-left">
                                <div className="cinebot-avatar">🤖</div>
                                <div className="cinebot-header-text">
                                    <h3>CineBot</h3>
                                    <p>AI Movie Assistant</p>
                                </div>
                            </div>
                            <button className="cinebot-close" onClick={() => setIsOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="cinebot-messages" ref={messagesContainerRef}>
                            {messages.map((msg, idx) => {
                                // Movie Card
                                if (msg.role === 'movie') {
                                    const m = msg.data
                                    const calendarCategory = normalizeCalendarCategory(m)
                                    return (
                                        <div key={idx} className="cinebot-movie-card">
                                            <div className="cinebot-movie-card-inner">
                                                {m.poster ? (
                                                    <img
                                                        src={m.poster}
                                                        alt={m.title}
                                                        className="cinebot-movie-poster"
                                                        onLoad={scrollToBottom}
                                                        onError={(e) => { e.target.style.display = 'none'; scrollToBottom(); }}
                                                    />
                                                ) : (
                                                    <div className="cinebot-movie-poster-placeholder">🎬</div>
                                                )}
                                                <div className="cinebot-movie-info">
                                                    <h4>{m.title}</h4>
                                                    <div className="movie-meta">
                                                        <span>🗂️ {calendarCategory}</span>
                                                        {m.year && <span>📆 Year: {m.year}</span>}
                                                    </div>
                                                    {m.description && <p className="movie-desc">{m.description}</p>}
                                                </div>
                                            </div>
                                            <div className="cinebot-movie-actions">
                                                <button
                                                    className="cinebot-add-btn"
                                                    onClick={() => handleAddToCalendar(m)}
                                                    disabled={!m.releaseDate && !m.year}
                                                >
                                                    📅 Add to Calendar
                                                </button>
                                                {m.imdbLink && (
                                                    <a
                                                        href={m.imdbLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="cinebot-imdb-btn"
                                                    >
                                                        ⭐ IMDb
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }

                                if (msg.role === 'plan') {
                                    const plan = msg.data || {}
                                    const items = Array.isArray(plan.items) ? plan.items : []
                                    return (
                                        <div key={idx} className="cinebot-plan-card">
                                            <div className="cinebot-plan-head">
                                                <div>
                                                    <h4>{plan.title || 'CineBot Watch Plan'}</h4>
                                                    <p>{plan.source === 'starter-plan' ? 'Starter recommendations' : 'Based on your calendar history'}</p>
                                                </div>
                                                <span>{items.length} days</span>
                                            </div>
                                            <div className="cinebot-plan-list">
                                                {items.map((item, planIndex) => (
                                                    <div key={`${item.date}-${item.title}-${planIndex}`} className="cinebot-plan-item">
                                                        <div className="cinebot-plan-date">
                                                            <strong>{String(item.date || '').slice(8, 10) || planIndex + 1}</strong>
                                                            <span>{String(item.date || '').slice(5, 7) || 'Day'}</span>
                                                        </div>
                                                        <div className="cinebot-plan-copy">
                                                            <h5>{item.title}</h5>
                                                            <p>{item.reason || item.description}</p>
                                                            <div>
                                                                <span>{item.category || 'Movies'}</span>
                                                                {(item.genres || ['General']).slice(0, 2).map(genre => (
                                                                    <span key={genre}>{genre}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="cinebot-add-btn cinebot-plan-save" onClick={() => handleAddPlanToCalendar(plan)} disabled={isLoading}>
                                                Save Full Plan
                                            </button>
                                        </div>
                                    )
                                }

                                // Regular messages
                                return (
                                    <div
                                        key={idx}
                                        className={`cinebot-msg ${msg.role === 'user' ? 'user' : 'bot'}`}
                                        dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                                    />
                                )
                            })}

                            {/* Typing indicator */}
                            {isLoading && (
                                <div className="cinebot-typing">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="cinebot-input-area">
                            <button
                                type="button"
                                className="cinebot-planner-chip"
                                onClick={handleBuildPlanner}
                                disabled={isLoading}
                                aria-label="Build watch planner"
                                title="Build watch planner"
                                data-tooltip="Watch planner"
                            >
                                <CalendarClock size={18} strokeWidth={2.3} />
                            </button>
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about any movie, series, or anime..."
                                disabled={isLoading}
                            />
                            <button
                                className="cinebot-send-btn"
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </button>
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
