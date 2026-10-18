const BINGR_API_BASE = 'https://api.bingr.one/api';

export const FALLBACK_STUDIOS = [
  {
    id: 'marvel',
    name: 'Marvel Studios',
    badge: 'MARVEL',
    tagline: 'Marvel Cinematic Universe',
    description: 'Stream all Marvel Cinematic Universe blockbusters, Avengers sagas, and Disney+ Marvel originals.',
    logo: 'https://image.tmdb.org/t/p/w500/hUzeosd33nzE5MCNsZxCGEKTXaQ.png',
    backdrop: 'https://image.tmdb.org/t/p/w780/subj7knTn4DeS6KS7qI66EQKe9i.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/subj7knTn4DeS6KS7qI66EQKe9i.jpg',
    accent: '#ED1D24',
    color: 'from-red-600/50 via-red-950/70 to-zinc-950',
    border: 'border-red-500/40 hover:border-red-400',
    glowColor: 'rgba(237, 29, 36, 0.45)',
    companyIds: '420',
    query: 'Marvel',
    category: 'Studio',
  },
  {
    id: 'disney',
    name: 'Disney+',
    badge: 'DISNEY+',
    tagline: 'Originals, Classics & Princesses',
    description: 'The home of Disney animation, live-action classics, Disney Channel originals, and timeless family stories.',
    logo: 'https://image.tmdb.org/t/p/w500/1edZOYAfoyZyZ3rklNSiUpXX30Q.png',
    backdrop: 'https://image.tmdb.org/t/p/w780/c6BPbkO5Npt1OdwttAxCFo06wtH.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/c6BPbkO5Npt1OdwttAxCFo06wtH.jpg',
    accent: '#0063E5',
    color: 'from-blue-600/50 via-blue-950/70 to-zinc-950',
    border: 'border-blue-500/40 hover:border-blue-400',
    glowColor: 'rgba(0, 99, 229, 0.45)',
    companyIds: '2',
    networkIds: '2739',
    query: 'Disney',
    category: 'Network',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    badge: 'NETFLIX',
    tagline: "See What's Next",
    description: 'Award-winning Netflix original series, global phenomena, films, documentaries, and binge-worthy drama.',
    logo: 'https://image.tmdb.org/t/p/w500/wwemzKWzjKYJFfCeiB57q3r4Bcm.png',
    backdrop: 'https://image.tmdb.org/t/p/w780/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    accent: '#E50914',
    color: 'from-red-700/50 via-zinc-950/80 to-black',
    border: 'border-red-600/40 hover:border-red-500',
    glowColor: 'rgba(229, 9, 20, 0.45)',
    networkIds: '213',
    watchProviderIds: '8',
    companyIds: '178464|20580',
    query: 'Netflix',
    category: 'Streaming',
  },
  {
    id: 'hbo',
    name: 'HBO Max',
    badge: 'HBO MAX',
    tagline: "It's What Keeps Us Together",
    description: 'Prestige television, Game of Thrones, House of the Dragon, Succession, The Last of Us, and Warner Bros classics.',
    logo: 'https://image.tmdb.org/t/p/w500/tuomPhY2UtuPTqqFnKMVHvSb724.png',
    backdrop: 'https://image.tmdb.org/t/p/w780/zZqpAXxVSBtxV9qPBcscfXBcL2w.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/zZqpAXxVSBtxV9qPBcscfXBcL2w.jpg',
    accent: '#8D26DF',
    color: 'from-purple-600/50 via-purple-950/70 to-zinc-950',
    border: 'border-purple-500/40 hover:border-purple-400',
    glowColor: 'rgba(141, 38, 223, 0.45)',
    networkIds: '49|3186',
    companyIds: '174',
    watchProviderIds: '1899|384',
    query: 'HBO',
    category: 'Network',
  },
  {
    id: 'paramount',
    name: 'Paramount+',
    badge: 'PARAMOUNT+',
    tagline: 'A Mountain of Entertainment',
    description: 'Iconic Paramount Pictures blockbusters, Star Trek universe, Yellowstone franchise, and Showtime hits.',
    logo: 'https://image.tmdb.org/t/p/w500/fi83B1oztoS47xxcemFdPMhIzK.png',
    backdrop: 'https://image.tmdb.org/t/p/w780/bicMU6xVD5deVyKP2azpyx7xkmH.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/bicMU6xVD5deVyKP2azpyx7xkmH.jpg',
    accent: '#0064FF',
    color: 'from-blue-700/50 via-slate-950/70 to-zinc-950',
    border: 'border-blue-400/40 hover:border-blue-300',
    glowColor: 'rgba(0, 100, 255, 0.45)',
    companyIds: '4',
    networkIds: '4330',
    query: 'Paramount',
    category: 'Studio',
  },
  {
    id: 'starwars',
    name: 'Star Wars',
    badge: 'STAR WARS',
    tagline: 'A Galaxy Far, Far Away...',
    description: "Lucasfilm's complete Skywalker saga, The Mandalorian, Ahsoka, Clone Wars, and galactic adventures.",
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Star_Wars_Logo.svg',
    backdrop: 'https://image.tmdb.org/t/p/w780/zqkmTXzjkAgXmEWLRsY4UpTWCeo.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/zqkmTXzjkAgXmEWLRsY4UpTWCeo.jpg',
    accent: '#F5C518',
    color: 'from-amber-600/50 via-yellow-950/70 to-zinc-950',
    border: 'border-amber-500/40 hover:border-amber-400',
    glowColor: 'rgba(245, 197, 24, 0.45)',
    companyIds: '1',
    query: 'Star Wars',
    category: 'Franchise',
  },
  {
    id: 'dc',
    name: 'DC Universe',
    badge: 'DC',
    tagline: "World's Greatest Superheroes",
    description: 'The Batman, Joker, Superman, Justice League, and gritty DC comic book adaptations across TV and film.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/DC_Comics_logo.svg',
    backdrop: 'https://image.tmdb.org/t/p/w780/rvtdN5XkWAfGX6xDuPL6yYS2seK.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/rvtdN5XkWAfGX6xDuPL6yYS2seK.jpg',
    accent: '#0078F2',
    color: 'from-sky-700/50 via-blue-950/70 to-zinc-950',
    border: 'border-sky-500/40 hover:border-sky-400',
    glowColor: 'rgba(0, 120, 242, 0.45)',
    companyIds: '9993|128064',
    query: 'DC',
    category: 'Franchise',
  },
  {
    id: 'appletv',
    name: 'Apple TV+',
    badge: 'APPLE TV+',
    tagline: 'Critically Acclaimed Originals',
    description: 'Ted Lasso, Severance, Morning Show, Silo, Slow Horses, and prestige cinematic Oscar-winning masterpieces.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg',
    backdrop: 'https://image.tmdb.org/t/p/w780/gPQppUnLx9vqPDLz3WwZ2HJsNbt.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/gPQppUnLx9vqPDLz3WwZ2HJsNbt.jpg',
    accent: '#A2AAAD',
    color: 'from-zinc-600/50 via-zinc-900/70 to-black',
    border: 'border-zinc-400/40 hover:border-zinc-300',
    glowColor: 'rgba(200, 200, 200, 0.45)',
    networkIds: '2552',
    watchProviderIds: '350',
    companyIds: '154614',
    query: 'Apple',
    category: 'Network',
  },
  {
    id: 'pixar',
    name: 'Pixar',
    badge: 'PIXAR',
    tagline: 'Heartfelt Stories & Imagination',
    description: 'Toy Story, Inside Out, Finding Nemo, The Incredibles, Coco, and pioneering emotional computer animation.',
    logo: 'https://image.tmdb.org/t/p/w500/1TjvGVDMYsj6JBxOAkUHpPEwLf7.png',
    backdrop: 'https://image.tmdb.org/t/p/w780/qjTqY5coNiz6sVtPng40IzltsoN.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/qjTqY5coNiz6sVtPng40IzltsoN.jpg',
    accent: '#00A389',
    color: 'from-teal-600/50 via-emerald-950/70 to-zinc-950',
    border: 'border-teal-400/40 hover:border-teal-300',
    glowColor: 'rgba(0, 163, 137, 0.45)',
    companyIds: '3',
    query: 'Pixar',
    category: 'Studio',
  },
  {
    id: 'warner',
    name: 'Warner Bros',
    badge: 'WARNER BROS',
    tagline: 'A Century of Stories',
    description: 'Harry Potter, The Matrix, Christopher Nolan epics, Lord of the Rings, and classic Hollywood cinema.',
    logo: 'https://image.tmdb.org/t/p/w500/zhD3hhtKB5qyv7ZeL4uLpNxgMVU.png',
    backdrop: 'https://image.tmdb.org/t/p/w780/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    accent: '#0047BA',
    color: 'from-blue-800/50 via-slate-950/70 to-zinc-950',
    border: 'border-blue-600/40 hover:border-blue-500',
    glowColor: 'rgba(0, 71, 186, 0.45)',
    companyIds: '174',
    query: 'Warner Bros',
    category: 'Studio',
  },
  {
    id: 'a24',
    name: 'A24',
    badge: 'A24',
    tagline: 'Bold & Independent Cinema',
    description: 'Everything Everywhere All at Once, Hereditary, Midsommar, Civil War, Euphoria, and modern auteur films.',
    logo: 'https://image.tmdb.org/t/p/w500/1ZXsGaFPgrgS6ZZGS37AqD5uU12.png',
    backdrop: 'https://image.tmdb.org/t/p/w780/clePZhqOSzNyjfuFBpOrziLEFzb.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/clePZhqOSzNyjfuFBpOrziLEFzb.jpg',
    accent: '#FFB800',
    color: 'from-amber-700/50 via-zinc-950/70 to-black',
    border: 'border-amber-500/40 hover:border-amber-400',
    glowColor: 'rgba(255, 184, 0, 0.45)',
    companyIds: '41077',
    query: 'A24',
    category: 'Studio',
  },
];

export const getStudioById = (id) => {
  if (!id) return null;
  const target = String(id).toLowerCase().trim();
  return FALLBACK_STUDIOS.find(s => s.id === target || s.name.toLowerCase().includes(target)) || null;
};

export const FALLBACK_GENRES = [
  {
    id: 28,
    name: 'Action',
    emoji: '💥',
    count: '1.2K+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    accent: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    color: 'from-red-600/50 via-rose-950/70 to-zinc-950',
    border: 'border-red-500/40 hover:border-red-400',
  },
  {
    id: 12,
    name: 'Adventure',
    emoji: '🧭',
    count: '850+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/8sNiAPPYU14PUepFNeSNGUTiHW.jpg',
    accent: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    color: 'from-amber-600/50 via-yellow-950/70 to-zinc-950',
    border: 'border-amber-500/40 hover:border-amber-400',
  },
  {
    id: 878,
    name: 'Sci-Fi',
    emoji: '🚀',
    count: '640+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/8sNiAPPYU14PUepFNeSNGUTiHW.jpg',
    accent: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    color: 'from-cyan-600/50 via-sky-950/70 to-zinc-950',
    border: 'border-cyan-500/40 hover:border-cyan-400',
  },
  {
    id: 53,
    name: 'Thriller',
    emoji: '⚡',
    count: '980+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg',
    accent: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    color: 'from-orange-600/50 via-amber-950/70 to-zinc-950',
    border: 'border-orange-500/40 hover:border-orange-400',
  },
  {
    id: 35,
    name: 'Comedy',
    emoji: '🎭',
    count: '1.5K+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/rFj9IKlL75B2pXhZA60jkNWvxeW.jpg',
    accent: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    color: 'from-yellow-600/50 via-amber-950/70 to-zinc-950',
    border: 'border-yellow-500/40 hover:border-yellow-400',
  },
  {
    id: 27,
    name: 'Horror',
    emoji: '🩸',
    count: '720+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/qVGpxnjrGlHaSTCqTQI6viBDSfp.jpg',
    accent: '#DC2626',
    glowColor: 'rgba(220, 38, 38, 0.45)',
    color: 'from-red-700/50 via-red-950/80 to-black',
    border: 'border-red-600/40 hover:border-red-500',
  },
  {
    id: 14,
    name: 'Fantasy',
    emoji: '🪄',
    count: '590+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/hziiv14OpD73u9gAak4XDDfBKa2.jpg',
    accent: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.45)',
    color: 'from-purple-600/50 via-indigo-950/70 to-zinc-950',
    border: 'border-purple-500/40 hover:border-purple-400',
  },
  {
    id: 16,
    name: 'Animation',
    emoji: '✨',
    count: '1.1K+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/jJKZaTBNenlFclQyjrnvzkRmvWE.jpg',
    accent: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.45)',
    color: 'from-blue-600/50 via-sky-950/70 to-zinc-950',
    border: 'border-blue-500/40 hover:border-blue-400',
  },
  {
    id: 18,
    name: 'Drama',
    emoji: '🎬',
    count: '2.4K+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/8sNiAPPYU14PUepFNeSNGUTiHW.jpg',
    accent: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.45)',
    color: 'from-indigo-600/50 via-slate-950/70 to-zinc-950',
    border: 'border-indigo-500/40 hover:border-indigo-400',
  },
  {
    id: 80,
    name: 'Crime',
    emoji: '🕵️',
    count: '770+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    accent: '#64748B',
    glowColor: 'rgba(100, 116, 139, 0.45)',
    color: 'from-slate-600/50 via-zinc-950/70 to-black',
    border: 'border-slate-500/40 hover:border-slate-400',
  },
  {
    id: 9648,
    name: 'Mystery',
    emoji: '🔍',
    count: '510+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/rbZvGN1A1QyZuoKzhCw8QPmf2q0.jpg',
    accent: '#14B8A6',
    glowColor: 'rgba(20, 184, 166, 0.45)',
    color: 'from-teal-600/50 via-emerald-950/70 to-zinc-950',
    border: 'border-teal-500/40 hover:border-teal-400',
  },
  {
    id: 10749,
    name: 'Romance',
    emoji: '❤️',
    count: '890+ titles',
    backdrop: 'https://image.tmdb.org/t/p/w780/6G6nqSW9S7EHA9HrYl0Z8uo2H7f.jpg',
    accent: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    color: 'from-pink-600/50 via-rose-950/70 to-zinc-950',
    border: 'border-pink-500/40 hover:border-pink-400',
  },
];

export const REGIONAL_HUBS = [
  {
    code: 'hi',
    name: 'Hindi / Bollywood',
    nativeName: 'बॉलीवुड सिनेमा',
    flag: '🇮🇳',
    country: 'IN',
    tagline: 'Bollywood Blockbusters, Epics & Originals',
    description: 'Explore the vibrant world of Indian Hindi cinema, multi-starrer epics, dramatic thrillers, and heartfelt musical classics.',
    backdrop: 'https://image.tmdb.org/t/p/w780/7VDLEHli74eLsYLNcq9djn1Gw76.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/7VDLEHli74eLsYLNcq9djn1Gw76.jpg',
    accent: '#FF9933',
    glowColor: 'rgba(255, 153, 51, 0.45)',
    color: 'from-amber-600/50 via-orange-950/70 to-zinc-950',
    border: 'border-amber-500/40 hover:border-amber-400',
    badge: 'BOLLYWOOD HUB',
  },
  {
    code: 'ko',
    name: 'Korean / K-Drama',
    nativeName: '한국 드라마 & 영화',
    flag: '🇰🇷',
    country: 'KR',
    tagline: 'Hallyu Wave, Romantic Dramas & Gripping Thrillers',
    description: 'Binge the finest South Korean cinema and television — from Parasite and Squid Game to romantic comedy K-dramas.',
    backdrop: 'https://image.tmdb.org/t/p/w780/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
    accent: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.45)',
    color: 'from-blue-600/50 via-indigo-950/70 to-zinc-950',
    border: 'border-blue-500/40 hover:border-blue-400',
    badge: 'K-DRAMA HUB',
  },
  {
    code: 'ja',
    name: 'Japanese / Anime',
    nativeName: '日本のアニメ & 映画',
    flag: '🇯🇵',
    country: 'JP',
    tagline: 'Masterpiece Anime, Studio Ghibli & J-Dramas',
    description: 'Immerse yourself in Japan’s legendary storytelling, shonen epics, Studio Ghibli artistry, and critically acclaimed live-action films.',
    backdrop: 'https://image.tmdb.org/t/p/w780/6oaL4DP75yABrd5EbC4H2zq5ghc.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/6oaL4DP75yABrd5EbC4H2zq5ghc.jpg',
    accent: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    color: 'from-pink-600/50 via-rose-950/70 to-zinc-950',
    border: 'border-pink-500/40 hover:border-pink-400',
    badge: 'ANIME & JAPAN HUB',
  },
  {
    code: 'es',
    name: 'Spanish / Latin',
    nativeName: 'Cine Español y Latino',
    flag: '🇪🇸',
    country: 'ES',
    tagline: 'Spanish Thrillers, Telenovelas & Award Winners',
    description: 'High-octane heists, psychological thrillers, and heartfelt cinema from Spain, Mexico, Argentina, and across Latin America.',
    backdrop: 'https://image.tmdb.org/t/p/w780/6G6nqSW9S7EHA9HrYl0Z8uo2H7f.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/6G6nqSW9S7EHA9HrYl0Z8uo2H7f.jpg',
    accent: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    color: 'from-red-600/50 via-red-950/70 to-zinc-950',
    border: 'border-red-500/40 hover:border-red-400',
    badge: 'SPANISH HUB',
  },
  {
    code: 'en',
    name: 'English / Hollywood',
    nativeName: 'Hollywood & UK Cinema',
    flag: '🇬🇧',
    country: 'GB',
    tagline: 'Global Blockbusters & British Masterpieces',
    description: 'Stream premiere Hollywood blockbusters, indie festival winners, and celebrated British drama productions.',
    backdrop: 'https://image.tmdb.org/t/p/w780/8sNiAPPYU14PUepFNeSNGUTiHW.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/8sNiAPPYU14PUepFNeSNGUTiHW.jpg',
    accent: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    color: 'from-purple-600/50 via-violet-950/70 to-zinc-950',
    border: 'border-purple-500/40 hover:border-purple-400',
    badge: 'HOLLYWOOD HUB',
  },
  {
    code: 'fr',
    name: 'French / Francophone',
    nativeName: 'Cinéma Français',
    flag: '🇫🇷',
    country: 'FR',
    tagline: 'French Auteurs, Art Cinema & Modern Drama',
    description: 'The birthplace of cinema — explore modern comedies, stylish noir mysteries, and iconic French New Wave masterpieces.',
    backdrop: 'https://image.tmdb.org/t/p/w780/q6OGlZ1KMEb14AC8KbPCxyNOal6.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/q6OGlZ1KMEb14AC8KbPCxyNOal6.jpg',
    accent: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    color: 'from-cyan-600/50 via-cyan-950/70 to-zinc-950',
    border: 'border-cyan-500/40 hover:border-cyan-400',
    badge: 'FRENCH HUB',
  },
  {
    code: 'de',
    name: 'German Cinema',
    nativeName: 'Deutsches Kino & Serien',
    flag: '🇩🇪',
    country: 'DE',
    tagline: 'German Noir, Dark Thrillers & Historical Epics',
    description: 'Atmospheric crime procedurals, Oscar-winning war dramas, and mind-bending speculative science-fiction.',
    backdrop: 'https://image.tmdb.org/t/p/w780/xBwtP27cx8WfjHJVFkpuV6F1RES.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/xBwtP27cx8WfjHJVFkpuV6F1RES.jpg',
    accent: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    color: 'from-amber-600/50 via-yellow-950/70 to-zinc-950',
    border: 'border-amber-500/40 hover:border-amber-400',
    badge: 'GERMAN HUB',
  },
  {
    code: 'te',
    name: 'Telugu / Tollywood',
    nativeName: 'తెలుగు సినిమా',
    flag: '🇮🇳',
    country: 'IN',
    tagline: 'Pan-Indian Spectacles, RRR & Mass Entertainers',
    description: 'Experience grand scale, high-voltage action, world-record dance numbers, and mythological modern epics from Tollywood.',
    backdrop: 'https://image.tmdb.org/t/p/w780/subj7knTn4DeS6KS7qI66EQKe9i.jpg',
    heroBackdrop: 'https://image.tmdb.org/t/p/original/subj7knTn4DeS6KS7qI66EQKe9i.jpg',
    accent: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    color: 'from-yellow-600/50 via-amber-950/70 to-zinc-950',
    border: 'border-yellow-500/40 hover:border-yellow-400',
    badge: 'TOLLYWOOD HUB',
  },
];

export const getRegionalHubByCode = (code) => {
  if (!code) return null;
  const target = String(code).toLowerCase().trim();
  return REGIONAL_HUBS.find(h => h.code === target || h.name.toLowerCase().includes(target)) || null;
};

export const FALLBACK_SPORTS_MATCHES = [
  {
    id: 'match-ucl-1',
    title: 'Real Madrid vs Manchester City',
    competition: 'UEFA Champions League',
    category: 'football',
    isLive: true,
    timeText: 'LIVE NOW — 68\'',
    teams: {
      home: { name: 'Real Madrid', badge: 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png' },
      away: { name: 'Manchester City', badge: 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png' }
    },
    streamUrl: 'https://embedstream.me/champions-league/stream-1',
    candidates: [
      { label: 'Ultra Sports HD 1', src: 'https://vidsrc.me/embed/movie/tt0111161', style: 'purple' },
      { label: 'Global Live Feed 2', src: 'https://player.cinezo.live/embed/movie/550', style: 'purple' }
    ]
  },
  {
    id: 'match-epl-1',
    title: 'Arsenal vs Chelsea',
    competition: 'Premier League',
    category: 'football',
    isLive: true,
    timeText: 'LIVE NOW — 34\'',
    teams: {
      home: { name: 'Arsenal', badge: 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png' },
      away: { name: 'Chelsea', badge: 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png' }
    },
    streamUrl: 'https://embedstream.me/premier-league/stream-1',
    candidates: [
      { label: 'EPL Stream HD 1', src: 'https://embed.filmu.in/movie/550', style: 'purple' }
    ]
  },
  {
    id: 'match-nba-1',
    title: 'Los Angeles Lakers vs Golden State Warriors',
    competition: 'NBA Playoffs',
    category: 'basketball',
    isLive: true,
    timeText: 'LIVE NOW — Q3 04:12',
    teams: {
      home: { name: 'LA Lakers', badge: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg' },
      away: { name: 'GS Warriors', badge: 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg' }
    },
    streamUrl: 'https://embedstream.me/nba/stream-1',
    candidates: [
      { label: 'NBA TV HD', src: 'https://player.cinezo.live/embed/movie/550', style: 'purple' }
    ]
  },
  {
    id: 'match-ipl-1',
    title: 'Chennai Super Kings vs Mumbai Indians',
    competition: 'Indian Premier League (IPL)',
    category: 'cricket',
    isLive: true,
    timeText: 'LIVE NOW — 14.2 Overs',
    teams: {
      home: { name: 'CSK', badge: 'https://scores.iplt20.com/ipl/teamlogos/CSK.png' },
      away: { name: 'MI', badge: 'https://scores.iplt20.com/ipl/teamlogos/MI.png' }
    },
    streamUrl: 'https://embedstream.me/cricket/stream-1',
    candidates: [
      { label: 'Cricket Live HD', src: 'https://embed.filmu.in/movie/550', style: 'purple' }
    ]
  },
  {
    id: 'match-f1-1',
    title: 'Formula 1 — Monaco Grand Prix 2026',
    competition: 'FIA Formula One World Championship',
    category: 'motorsport',
    isLive: false,
    timeText: 'TODAY — 18:30 GMT',
    teams: {
      home: { name: 'Red Bull Racing', badge: 'https://media.formula1.com/content/dam/fom-website/teams/2024/red-bull-racing-logo.png' },
      away: { name: 'Scuderia Ferrari', badge: 'https://media.formula1.com/content/dam/fom-website/teams/2024/ferrari-logo.png' }
    },
    streamUrl: 'https://embedstream.me/f1/monaco',
    candidates: [
      { label: 'F1 Paddock Stream HD', src: 'https://embed.vidrift.in/embed/movie/550', style: 'purple' }
    ]
  },
  {
    id: 'match-ufc-1',
    title: 'UFC 312: Main Card Championship',
    competition: 'Ultimate Fighting Championship',
    category: 'mma',
    isLive: false,
    timeText: 'TONIGHT — 22:00 EST',
    teams: {
      home: { name: 'Main Event Red', badge: 'https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg' },
      away: { name: 'Main Event Blue', badge: 'https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg' }
    },
    streamUrl: 'https://embedstream.me/ufc/main-card',
    candidates: [
      { label: 'UFC Octagon HD', src: 'https://embed.filmu.in/movie/550', style: 'purple' }
    ]
  }
];

/**
 * Fetch all live and upcoming sports matches for today
 */
export async function fetchSportsMatchesToday() {
  try {
    const res = await fetch(`${BINGR_API_BASE}/sports/matches/all-today`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_SPORTS_MATCHES;
  } catch (err) {
    console.warn('Bingr API sports today unavailable, using high-definition fallback:', err.message);
    return FALLBACK_SPORTS_MATCHES;
  }
}

/**
 * Fetch popular sports matches
 */
export async function fetchPopularSportsMatches() {
  try {
    const res = await fetch(`${BINGR_API_BASE}/sports/matches/popular`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_SPORTS_MATCHES;
  } catch (err) {
    console.warn('Bingr API popular sports unavailable, using fallback:', err.message);
    return FALLBACK_SPORTS_MATCHES;
  }
}

/**
 * Fetch master categories taxonomy (Studios, Languages, Sports, Genres)
 */
export async function fetchBingrCategories() {
  try {
    const res = await fetch(`${BINGR_API_BASE}/categories`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const enrichedStudios = (data.studios || FALLBACK_STUDIOS).map(s => {
      const fallback = FALLBACK_STUDIOS.find(f => f.id === s.id) || {};
      return { ...fallback, ...s, logo: s.logo || fallback.logo, backdrop: s.backdrop || fallback.backdrop };
    });
    return {
      ...data,
      studios: enrichedStudios.length > 0 ? enrichedStudios : FALLBACK_STUDIOS,
      genres: data.genres || FALLBACK_GENRES,
      sports: data.sports || ['Football', 'Basketball', 'Cricket', 'Motorsport', 'MMA', 'Tennis', 'Baseball']
    };
  } catch (err) {
    console.warn('Bingr categories API unavailable, using fallback:', err.message);
    return {
      studios: FALLBACK_STUDIOS,
      genres: FALLBACK_GENRES,
      sports: ['Football', 'Basketball', 'Cricket', 'Motorsport', 'MMA', 'Tennis', 'Baseball']
    };
  }
}

/**
 * Fetch live sports streaming sources for a match
 */
export async function fetchSportsStreamSources(sources = []) {
  if (!sources || sources.length === 0) return [];
  try {
    const promises = sources.map(async (s) => {
      try {
        const res = await fetch(`${BINGR_API_BASE}/sports/stream/${encodeURIComponent(s.source)}/${encodeURIComponent(s.id)}`);
        return res.ok ? await res.json() : [];
      } catch {
        return [];
      }
    });
    const results = await Promise.all(promises);
    return results.flat();
  } catch (err) {
    console.warn('Failed to resolve sports stream:', err.message);
    return [];
  }
}

/**
 * Fetch background trailer MP4 via IMDb ID
 */
export async function fetchBingrTrailer(imdbId) {
  if (!imdbId) return null;
  try {
    const res = await fetch(`${BINGR_API_BASE}/trailer/imdb/${encodeURIComponent(imdbId)}?prefer=oldest`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.best?.url || data.all?.find(e => e.mime === 'video/mp4')?.url || data.all?.[0]?.url || null;
  } catch {
    return null;
  }
}
