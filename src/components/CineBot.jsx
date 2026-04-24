import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import './CineBot.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://movie-catalogue-api.onrender.com'

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

    const { user, setYear, setCategory, setSelectedGenres, setSelectedMonth, setCineBotPendingEntry } = useStore()
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
                setMessages(prev => [...prev, { role: 'bot', content: '🔍 Searching for movie details...' }])

                const fetches = lookupQueries.map(async (query) => {
                    try {
                        const lookupRes = await fetch(`${API_URL}/api/movie-lookup`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query })
                        })
                        const movieData = await lookupRes.json()
                        if (lookupRes.ok && movieData.title) {
                            // Frontend fallback: If backend returns 'General' or is missing poster, fetch via OMDB using IMDB id!
                            if (movieData.imdbLink && (movieData.genre === 'General' || !movieData.genres || movieData.genres.length === 0 || !movieData.poster)) {
                                const imdbIdMatch = movieData.imdbLink.match(/title\/(tt\d+)/);
                                if (imdbIdMatch) {
                                    try {
                                        const omdbKey = import.meta.env.VITE_OMDB_API_KEY;
                                        if (omdbKey) {
                                            const omdbRes = await fetch(`https://www.omdbapi.com/?i=${imdbIdMatch[1]}&apikey=${omdbKey}`);
                                            const omdbData = await omdbRes.json();
                                            if (omdbRes.ok && omdbData.Response === 'True') {
                                                if (omdbData.Genre && omdbData.Genre !== 'N/A') {
                                                    movieData.genres = omdbData.Genre.split(',').map(g => g.trim());
                                                    movieData.genre = movieData.genres[0];
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
            if (movieData.releaseDate.includes('-')) {
                // ISO format: YYYY-MM-DD
                const dateParts = movieData.releaseDate.split('-')
                year = parseInt(dateParts[0]) || year
                month = dateParts[1] ? parseInt(dateParts[1]) - 1 : 0
                day = dateParts[2] ? parseInt(dateParts[2]) : 1
            } else {
                // Irregular string format (e.g., "September 1, 2022 (United States)")
                const yearMatch = movieData.releaseDate.match(/(\d{4})/)
                if (yearMatch) {
                    year = parseInt(yearMatch[1])
                }
            }
        }

        // Determine category from type/genre/description
        let category = 'Movies' // Default
        const desc = (movieData.description || '').toLowerCase()
        const genre = (movieData.genre || '').toLowerCase()
        const mediaType = (movieData.type || '').toLowerCase()

        if (desc.includes('anime') || genre.includes('animation') || genre.includes('anime')) {
            category = 'Anime'
        } else if (mediaType === 'series' || mediaType.includes('tv') || desc.includes('series') || desc.includes('tv show') || desc.includes('television')) {
            category = 'Series'
        }

        // Determine genres array
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
                    <motion.div
                        className="cinebot-panel"
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
                                                        {m.releaseDate && <span>📅 {m.releaseDate}</span>}
                                                        {m.genre && <span>🎭 {m.genre}</span>}
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
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
