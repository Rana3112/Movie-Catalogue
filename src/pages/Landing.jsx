import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight,
  CalendarDays,
  Clapperboard,
  Code2,
  Database,
  Film,
  Layers3,
  ListVideo,
  Play,
  Search,
  Server,
  Shield,
  Sparkles,
  Star,
  Tv,
  WandSparkles,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import './Landing.css'

gsap.registerPlugin(ScrollTrigger)

const officialPosters = {
  apex: 'https://image.tmdb.org/t/p/w500/eTp7gSPkSF3Aw79mNx1NkBP1PZT.jpg',
  projectHailMary: 'https://image.tmdb.org/t/p/w500/yihdXomYb5kTeSivtFndMy5iDmf.jpg',
  michael: 'https://image.tmdb.org/t/p/w500/j57QWe3OoaXL9Idi9gLtsAybWLP.jpg',
  avatarFireAsh: 'https://image.tmdb.org/t/p/w500/aabwWZWx6z1aYP4PX2ADvbDKktd.jpg',
  theDrama: 'https://image.tmdb.org/t/p/w500/ikcNOWB6Qo1ER1H1BJL6Vf0W22s.jpg',
  theyWillKillYou: 'https://image.tmdb.org/t/p/w500/6oI4oQKTWMVUlr8Ivqydp28Ruu6.jpg',
  theBoys: 'https://image.tmdb.org/t/p/w500/in1R2dDc421JxsoRWaIIAqVI2KE.jpg',
  daredevilBornAgain: 'https://image.tmdb.org/t/p/w500/xDUoAsU8lQHOOoRkFiBuarmACDN.jpg',
  from: 'https://image.tmdb.org/t/p/w500/pRtJagIxpfODzzb0T0NAvZSzErC.jpg',
  invincible: 'https://image.tmdb.org/t/p/w500/4tblBrslcKSifMVZ3TmtT2ukMor.jpg',
  onePieceLiveAction: 'https://image.tmdb.org/t/p/w500/blWCPEqDGLBuLB9u89CxP9ORQP4.jpg',
  monarch: 'https://image.tmdb.org/t/p/w500/7LBbaEaLSbqdviBYaSS1rRPMnrs.jpg',
  drStone: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx105333-GybuoSoOZfpH.jpg',
  reZero: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21355-wRVUrGxpvIQQ.jpg',
  sakamotoDays: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx177709-e5Qx6RlsBgD5.png',
  kaijuNo8: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153288-25FBfFJzEQ5O.jpg',
  soloLeveling: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png',
  onePieceAnime: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg',
  avengersDoomsday: 'https://image.tmdb.org/t/p/w500/8HkIe2i4ScpCkcX9SzZ9IPasqWV.jpg',
  hungerGames: 'https://image.tmdb.org/t/p/w500/yXCbOiVDCxO71zI7cuwBRXdftq8.jpg',
  goodfellas: 'https://image.tmdb.org/t/p/w500/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg',
  gladiator: 'https://image.tmdb.org/t/p/w500/wN2xWp1eIwCKOD0BHTcErTBv1Uq.jpg',
  inception: 'https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg',
}

const posterBackground = (poster, overlay) => {
  if (!poster) return undefined
  const posterImage = `url(${poster})`
  return {
    '--poster-image': posterImage,
    ...(overlay ? { backgroundImage: `${overlay}, ${posterImage}` } : {}),
  }
}

const posterCards = [
  { title: 'Daredevil: Born Again', meta: 'TV Series 2025', tone: 'red', poster: officialPosters.daredevilBornAgain, x: -16, y: 8, r: -8 },
  { title: 'Project Hail Mary', meta: 'Sci-Fi 2026', tone: 'cyan', poster: officialPosters.projectHailMary, x: 18, y: -12, r: 7 },
  { title: 'Re:ZERO', meta: 'Anime', tone: 'purple', poster: officialPosters.reZero, x: 2, y: 20, r: 3 },
  { title: 'Avatar: Fire and Ash', meta: 'Movie 2025', tone: 'gold', poster: officialPosters.avatarFireAsh, x: -22, y: -10, r: -4 },
]

const yearMoments = [
  { year: '1990', title: 'GoodFellas', tone: 'purple', poster: officialPosters.goodfellas },
  { year: '2000', title: 'Gladiator', tone: 'red', poster: officialPosters.gladiator },
  { year: '2010', title: 'Inception', tone: 'cyan', poster: officialPosters.inception },
  { year: '2026', title: 'Project Hail Mary', tone: 'gold', poster: officialPosters.projectHailMary },
]

const streamRows = [
  {
    label: 'Movies',
    icon: Film,
    items: [
      { title: 'Apex', poster: officialPosters.apex },
      { title: 'Project Hail Mary', poster: officialPosters.projectHailMary },
      { title: 'Michael', poster: officialPosters.michael },
      { title: 'Avatar: Fire and Ash', poster: officialPosters.avatarFireAsh },
      { title: 'The Drama', poster: officialPosters.theDrama },
      { title: 'They Will Kill You', poster: officialPosters.theyWillKillYou },
    ],
  },
  {
    label: 'TV Series',
    icon: Tv,
    items: [
      { title: 'The Boys', poster: officialPosters.theBoys },
      { title: 'Daredevil: Born Again', poster: officialPosters.daredevilBornAgain },
      { title: 'FROM', poster: officialPosters.from },
      { title: 'INVINCIBLE', poster: officialPosters.invincible },
      { title: 'One Piece', poster: officialPosters.onePieceLiveAction },
      { title: 'Monarch', poster: officialPosters.monarch },
    ],
  },
  {
    label: 'Anime',
    icon: Sparkles,
    items: [
      { title: 'Dr. Stone', poster: officialPosters.drStone },
      { title: 'Re:ZERO', poster: officialPosters.reZero },
      { title: 'Sakamoto Days', poster: officialPosters.sakamotoDays },
      { title: 'Kaiju No. 8', poster: officialPosters.kaijuNo8 },
      { title: 'Solo Leveling', poster: officialPosters.soloLeveling },
      { title: 'One Piece', poster: officialPosters.onePieceAnime },
    ],
  },
]

const phonePreviewCards = [
  { title: 'Apex', poster: officialPosters.apex },
  { title: 'FROM', poster: officialPosters.from },
  { title: 'Re:ZERO', poster: officialPosters.reZero },
]

const savedSpaceCards = [
  { title: 'Avengers: Doomsday', year: '2026', poster: officialPosters.avengersDoomsday },
  { title: 'The Hunger Games', year: '2012', poster: officialPosters.hungerGames },
  { title: 'Daredevil: Born Again', year: '2025', poster: officialPosters.daredevilBornAgain },
]

const discoveryFeatures = [
  { title: 'Search Everything', text: 'Find movies, TV series, and anime from one cinematic search flow.', icon: Search },
  { title: 'Browse Genres', text: 'Filter by action, comedy, shounen, sci-fi, drama, thrillers, and more.', icon: WandSparkles },
  { title: 'Continue Watching', text: 'Resume recent StreamZone activity with poster-led history rows.', icon: Play },
  { title: 'Watchlist Saves', text: 'Keep titles ready for later without losing your browsing context.', icon: Star },
  { title: 'Detail Pages', text: 'Open poster-rich pages with metadata, ratings, and summaries.', icon: Clapperboard },
  { title: 'Episode Lists', text: 'Browse TV seasons and anime episode grids before playback.', icon: ListVideo },
]

const stackItems = [
  { name: 'React + Vite', detail: 'Frontend app shell', icon: Code2 },
  { name: 'Framer Motion', detail: 'Interface motion', icon: Sparkles },
  { name: 'GSAP ScrollTrigger', detail: 'Scroll-driven scenes', icon: Layers3 },
  { name: 'Three.js / Fiber', detail: '3D interactive canvas', icon: Shield },
  { name: 'Node.js + Express', detail: 'Backend API', icon: Server },
  { name: 'MongoDB', detail: 'Saved catalogue data', icon: Database },
  { name: 'TMDB + AniList', detail: 'Media discovery APIs', icon: Film },
  { name: 'Capacitor Android', detail: 'Mobile shell', icon: CalendarDays },
]

const revealContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
}

const revealItem = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}

function SectionHeader({ eyebrow, title, text }) {
  return (
    <Motion.div
      className="landing-section-header"
      variants={revealContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
    >
      <Motion.span variants={revealItem} className="landing-eyebrow">{eyebrow}</Motion.span>
      <Motion.h2 variants={revealItem}>{title}</Motion.h2>
      <Motion.p variants={revealItem}>{text}</Motion.p>
    </Motion.div>
  )
}

function PosterCard({ card, index }) {
  return (
    <Motion.div
      className={`landing-poster-card landing-poster-${card.tone}`}
      data-parallax-card
      style={{
        '--card-x': `${card.x}px`,
        '--card-y': `${card.y}px`,
        '--card-r': `${card.r}deg`,
        ...(posterBackground(card.poster) || {}),
      }}
      initial={{ opacity: 0, y: 34, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: card.r }}
      transition={{ delay: 0.22 + index * 0.08, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="landing-poster-shine" />
      <span>{card.meta}</span>
      <strong>{card.title}</strong>
    </Motion.div>
  )
}

function PhoneMockup() {
  return (
    <div className="landing-phone" data-parallax-phone>
      <div className="landing-phone-notch" />
      <div className="landing-phone-screen">
        <div
          className="landing-phone-hero"
          style={posterBackground(
            officialPosters.theBoys,
            'linear-gradient(0deg, #050507 0%, rgba(5, 5, 7, 0.42) 72%)'
          )}
        >
          <span>StreamZone</span>
          <strong>The Boys</strong>
          <button type="button"><Play size={12} fill="currentColor" /> Watch</button>
        </div>
        <div className="landing-phone-tabs">
          <span className="is-active">Movies</span>
          <span>TV</span>
          <span>Anime</span>
        </div>
        <div className="landing-phone-row">
          {phonePreviewCards.map((item, index) => (
            <div
              key={item.title}
              className={`landing-phone-card landing-phone-card-${index}`}
              style={posterBackground(item.poster)}
            >
              <small>{item.title}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TimeArchiveSection() {
  return (
    <section className="landing-section landing-time" data-time-section>
      <div className="landing-time-copy">
        <span className="landing-eyebrow">Time Archive</span>
        <h2>Travel through cinema by year, genre, and mood.</h2>
        <p>
          Move from decades to categories to watch planning. Categloge turns your movie memory into a browsable cinematic timeline.
        </p>
      </div>
      <div className="landing-year-stage">
        <div className="landing-year-rail" data-year-rail>
          {yearMoments.map((moment) => (
            <div key={moment.year} className="landing-year-item">
              <span>{moment.title}</span>
              <strong>{moment.year}</strong>
            </div>
          ))}
        </div>
        <div className="landing-year-posters">
          {yearMoments.map((moment, index) => (
            <div
              key={moment.title}
              className={`landing-mini-poster landing-mini-${moment.tone}`}
              style={posterBackground(moment.poster)}
              data-year-card
            >
              <small>{moment.year}</small>
              <strong>{moment.title}</strong>
              <span>{index + 2} genres</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StreamZoneSection() {
  return (
    <section className="landing-section landing-streamzone">
      <SectionHeader
        eyebrow="StreamZone"
        title="Trending rows, top-rated shelves, seasonal anime, and playback-ready detail pages."
        text="StreamZone brings trending, popular, top-rated, seasonal, and anime content into a mobile-first cinematic interface."
      />
      <div className="landing-stream-panel">
        <div className="landing-stream-tabs">
          {streamRows.map((row, index) => {
            const Icon = row.icon
            return (
              <span key={row.label} className={index === 0 ? 'is-active' : ''}>
                <Icon size={15} /> {row.label}
              </span>
            )
          })}
        </div>
        <div className="landing-stream-rows">
          {streamRows.map((row) => (
            <Motion.div
              key={row.label}
              className="landing-content-row"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={revealContainer}
            >
              <div className="landing-row-title">
                <strong>{row.label}</strong>
                <span>See All</span>
              </div>
              <div className="landing-row-track">
                {row.items.map((item, index) => (
                  <Motion.div
                    variants={revealItem}
                    key={item.title}
                    className={`landing-row-card landing-row-card-${index % 5}`}
                    style={posterBackground(item.poster)}
                  >
                    <span>{row.label}</span>
                    <strong>{item.title}</strong>
                  </Motion.div>
                ))}
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DiscoverySection() {
  return (
    <section className="landing-section landing-discovery">
      <SectionHeader
        eyebrow="Smart Discovery"
        title="Everything needed to find, save, and resume entertainment."
        text="Search across media types, browse genres, save to watchlists, open details, and move into episode lists without losing context."
      />
      <Motion.div
        className="landing-feature-grid"
        variants={revealContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.22 }}
      >
        {discoveryFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <Motion.article variants={revealItem} key={feature.title} className="landing-feature-card">
              <div className="landing-feature-icon"><Icon size={21} /></div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </Motion.article>
          )
        })}
      </Motion.div>
    </section>
  )
}

function CalendarSpaceSection() {
  const calendarDays = Array.from({ length: 12 }, (_, i) => i + 1)
  return (
    <section className="landing-section landing-planning">
      <SectionHeader
        eyebrow="Calendar + My Space"
        title="Plan what to watch, save your catalogue, and keep your entertainment organized."
        text="Calendar cells hold entries, ratings, status, posters, and genres. My Space keeps your saved collection searchable and filterable."
      />
      <div className="landing-planning-grid">
        <Motion.div
          className="landing-calendar-board"
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <div className="landing-board-header">
            <strong>January 2026</strong>
            <span>Movies</span>
          </div>
          <div className="landing-calendar-grid">
            {calendarDays.map((day) => (
              <div key={day} className={`landing-calendar-cell ${[2, 7, 9].includes(day) ? 'has-entry' : ''}`}>
                <span>{day}</span>
                {[2, 7, 9].includes(day) && <strong>{day === 7 ? '3 Entries' : 'Saved'}</strong>}
              </div>
            ))}
          </div>
        </Motion.div>

        <Motion.div
          className="landing-space-stack"
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          {savedSpaceCards.map((item, index) => (
            <div
              key={item.title}
              className={`landing-space-card landing-space-card-${index}`}
              style={posterBackground(item.poster)}
            >
              <span>{item.year}</span>
              <strong>{item.title}</strong>
            </div>
          ))}
        </Motion.div>
      </div>
    </section>
  )
}

function MobileExperienceSection() {
  return (
    <section className="landing-section landing-mobile">
      <div className="landing-mobile-copy">
        <span className="landing-eyebrow">Android Experience</span>
        <h2>Designed for mobile-first entertainment with smooth navigation and immersive playback screens.</h2>
        <p>
          The Android shell keeps the app feeling native, with StreamZone detail pages, fullscreen player flows, and quick back navigation.
        </p>
      </div>
      <div className="landing-device-row">
        <PhoneMockup />
        <div className="landing-landscape-player">
          <div className="landing-player-top">
            <span />
            <small>Landscape Player</small>
          </div>
          <div className="landing-player-play"><Play size={30} fill="currentColor" /></div>
          <div className="landing-player-progress"><span /></div>
        </div>
      </div>
    </section>
  )
}

function TechSection() {
  return (
    <section className="landing-section landing-tech">
      <SectionHeader
        eyebrow="Engineering"
        title="A modern full-stack catalogue built for web and Android."
        text="The landing page is visual, but the product is practical: authenticated catalogue storage, discovery APIs, StreamZone browsing, and a Capacitor Android shell."
      />
      <div className="landing-orbit">
        {stackItems.map((item, index) => {
          const Icon = item.icon
          return (
            <Motion.div
              key={item.name}
              className="landing-tech-card"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.04, duration: 0.45 }}
            >
              <Icon size={19} />
              <strong>{item.name}</strong>
              <span>{item.detail}</span>
            </Motion.div>
          )
        })}
      </div>
    </section>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { loginAsGuest } = useStore()
  const prefersReducedMotion = useReducedMotion()
  const rootRef = useRef(null)

  const handleGuestEntry = () => {
    loginAsGuest()
    navigate('/home', { replace: true })
  }

  useEffect(() => {
    if (prefersReducedMotion || !rootRef.current) return undefined

    const ctx = gsap.context(() => {
      gsap.to('[data-parallax-card]', {
        yPercent: -18,
        rotate: '+=4',
        ease: 'none',
        scrollTrigger: {
          trigger: '.landing-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })

      gsap.to('[data-parallax-phone]', {
        yPercent: 12,
        rotateY: -7,
        ease: 'none',
        scrollTrigger: {
          trigger: '.landing-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })

      gsap.to('[data-year-rail]', {
        yPercent: -55,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-time-section]',
          start: 'top top',
          end: '+=900',
          pin: true,
          scrub: 0.8,
        },
      })

      gsap.fromTo('[data-year-card]',
        { y: 80, opacity: 0.25 },
        {
          y: -40,
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-time-section]',
            start: 'top 70%',
            end: 'bottom 25%',
            scrub: true,
          },
        }
      )
    }, rootRef)

    return () => ctx.revert()
  }, [prefersReducedMotion])

  return (
    <main ref={rootRef} className="landing-cinematic">
      <section className="landing-hero">
        <div className="landing-ambient landing-ambient-red" />
        <div className="landing-ambient landing-ambient-blue" />
        <div className="landing-beam landing-beam-one" />
        <div className="landing-beam landing-beam-two" />

        <div className="landing-wordmark" aria-label="Categloge">
          <span className="landing-wordmark-mark">C</span>
          <span>Categloge</span>
        </div>

        <nav className="landing-nav" aria-label="Landing navigation">
          <button type="button" onClick={handleGuestEntry}>Demo</button>
          <button type="button" onClick={() => navigate('/login')}>Login</button>
          <button type="button" className="is-primary" onClick={() => navigate('/signup')}>Sign Up</button>
        </nav>

        <div className="landing-hero-grid">
          <Motion.section
            className="landing-hero-copy"
            variants={revealContainer}
            initial="hidden"
            animate="visible"
          >
            <Motion.span variants={revealItem} className="landing-eyebrow">Categloge / Movie Catalogue</Motion.span>
            <Motion.h1 variants={revealItem}>Your Cinematic Universe, Organized.</Motion.h1>
            <Motion.p variants={revealItem}>
              Discover movies, TV series, anime, plan your watchlist, explore genres, and enter StreamZone - all inside one immersive catalogue.
            </Motion.p>
            <Motion.div variants={revealItem} className="landing-proof-row">
              <span><span className="landing-live-dot" /> Live catalogue</span>
              <span>Movies · Series · Anime</span>
              <span>Web + Android</span>
            </Motion.div>
            <Motion.div variants={revealItem} className="landing-cta-row">
              <Motion.button whileTap={{ scale: 0.98 }} type="button" className="landing-primary-cta" onClick={handleGuestEntry}>
                Explore Demo <ArrowRight size={18} />
              </Motion.button>
              <Motion.button whileTap={{ scale: 0.98 }} type="button" className="landing-ghost-cta" onClick={() => navigate('/login')}>
                Login
              </Motion.button>
              <Motion.button whileTap={{ scale: 0.98 }} type="button" className="landing-ghost-cta" onClick={() => navigate('/signup')}>
                Sign Up
              </Motion.button>
            </Motion.div>
          </Motion.section>

          <div className="landing-hero-visual" aria-label="Animated app preview">
            <div className="landing-now-playing">
              <span className="landing-now-playing-pulse"><Play size={11} fill="currentColor" /></span>
              <div>
                <small>Now playing</small>
                <strong>Build your next watch night</strong>
              </div>
            </div>
            <div className="landing-poster-cloud">
              {posterCards.map((card, index) => (
                <PosterCard key={card.title} card={card} index={index} />
              ))}
            </div>
            <PhoneMockup />
            <div className="landing-hero-scorecard">
              <span>YOUR SPACE</span>
              <strong>Watch smarter.</strong>
              <div><b>01</b> calendar <i /> <b>02</b> stream</div>
            </div>
          </div>
        </div>

        <div className="landing-scroll-cue" aria-hidden="true">
          <span />
          Scroll to explore
        </div>
      </section>

      <TimeArchiveSection />
      <StreamZoneSection />
      <DiscoverySection />
      <CalendarSpaceSection />
      <MobileExperienceSection />
      <TechSection />

      <section className="landing-final">
        <Motion.div
          className="landing-final-card"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
        >
          <span className="landing-eyebrow">Your Archive Awaits</span>
          <h2>Step Into Your Personal Cinema Archive.</h2>
          <div className="landing-cta-row">
            <button type="button" className="landing-primary-cta" onClick={handleGuestEntry}>
              Explore Demo <ArrowRight size={18} />
            </button>
            <button type="button" className="landing-ghost-cta" onClick={() => navigate('/signup')}>
              Create Account
            </button>
          </div>
        </Motion.div>
      </section>

      <footer className="landing-footer">
        Categloge - Curated Cinema. Personalized Watchlists. StreamZone Ready.
      </footer>
    </main>
  )
}
