const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Entry = require('./models/Entry');
const User = require('./models/User'); // Import User Model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const streamingRoutes = require('./routes/streaming');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_123'; // Fallback for dev

// Initialize Firebase Admin
let firebaseAdmin = null;
try {
  // Try to use service account from environment variables first
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Render (and many platforms) store the private key as a single-line string
    // where real newlines become the literal two characters \ and n.
    // Normalize all known variants:
    //   1. Strip wrapping quotes some dashboards add
    //   2. Unescape \\n -> \n (double-escaped)
    //   3. Unescape \n  -> actual newline
    //   4. Remove stray \r characters
    privateKey = privateKey
      .replace(/^"|"$/g, '')      // strip surrounding quotes
      .replace(/\\\\n/g, '\n')   // double-escaped \\n -> real newline
      .replace(/\\n/g, '\n')     // single-escaped \n  -> real newline
      .replace(/\\r/g, '')        // remove stray \r
      .trim();

    if (!privateKey.includes('\n')) {
      throw new Error('FIREBASE_PRIVATE_KEY still has no newlines after normalization. Copy the raw value from your service account JSON (keep \\n as-is).');
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    };

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    console.log('\u2705 Firebase Admin Initialized with environment variables');
  } else {
    // Fallback to file-based service account (local dev only)
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-service-account.json';
    const serviceAccount = require(serviceAccountPath);

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('\u2705 Firebase Admin Initialized with service account file');
  }
} catch (error) {
  firebaseAdmin = null;
  console.warn('\u26a0\ufe0f Firebase Admin Initialization failed, continuing without token verification:', error.message);
  console.warn('\u26a0\ufe0f Fix: In Render dashboard, paste the FIREBASE_PRIVATE_KEY value exactly as it appears in the service account JSON.');
}

// Middleware
app.use(cors({
    origin: [
        // Web deployments
        'https://utkarsh.sbs',
        'https://www.utkarsh.sbs',
        'https://movie-catalogue-v1-iota.vercel.app',
        'https://movie-catalogue-taupe.vercel.app',
        // Local dev
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5173',
        'http://10.0.2.2:5000',
        // Android WebView origins (Capacitor uses these)
        'capacitor://localhost',
        'http://localhost',
        'ionic://localhost',
        'https://localhost',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '50mb' }));

// Root Route (Health Check)
app.get('/', (req, res) => {
    res.send('Movie Catalogue API is Running 🚀');
});

// Debug Middleware: Log all requests
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

app.use('/api/streaming', streamingRoutes);


const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://utkarshrana40_db_user:zrYQHcT4WjoCWQna@cluster0.tpbyi5g.mongodb.net/?appName=Cluster0';
if (mongoUri) {
    mongoose.connect(mongoUri)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}
// mongoose.connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     family: 4,                     // forces IPv4, REQUIRED FOR RENDER + ATLAS
//     serverSelectionTimeoutMS: 10000
// })
// .then(() => console.log('✅ MongoDB Connected (IPv4 Forced)'))
// .catch(err => {
//     console.error('❌ MongoDB Connection Error:', err);
//     process.exit(1);
// });

// --- AUTH ROUTES ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        // Create Token
        const token = jwt.sign({ id: savedUser._id }, JWT_SECRET);

        res.status(201).json({
            token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                avatar: savedUser.avatar
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        // Validate password
        // If user logged in with Google before, they might not have a password
        if (!user.password) return res.status(400).json({ error: "Please login with Google" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // Create Token
        const token = jwt.sign({ id: user._id }, JWT_SECRET);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Google Auth (Simplified Handler for now)
app.post('/api/auth/google', async (req, res) => {
    try {
        const { email, name, googleId, avatar } = req.body; // Expecting frontend to verify token and send data

        let user = await User.findOne({ email });

        if (user) {
            // Update googleId if missing
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create new user
            user = new User({
                email,
                name,
                googleId,
                avatar,
                password: null // No password for Google users
            });
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        });

    } catch (err) {
        console.error("Google Auth Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Firebase Auth Handler
app.post('/api/auth/firebase', async (req, res) => {
    try {
        const { uid, email, displayName, photoURL, idToken } = req.body;

        if (!uid || !email) {
            return res.status(400).json({ error: "Missing required Firebase user data" });
        }

        // Verify the Firebase ID token if Firebase Admin is initialized
        if (firebaseAdmin && idToken) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                // Verify that the UID matches
                if (decodedToken.uid !== uid) {
                    return res.status(401).json({ error: "Invalid Firebase token" });
                }
                console.log('✅ Firebase token verified successfully');
            } catch (verifyError) {
                console.error("Firebase token verification error:", verifyError.message);
                // For development, continue without verification if there's a network error
                if (verifyError.code === 'auth/id-token-expired') {
                    return res.status(401).json({ error: "Firebase token expired" });
                }
                if (verifyError.code === 'auth/invalid-id-token') {
                    return res.status(401).json({ error: "Invalid Firebase token" });
                }
                // Network errors - continue without verification for development
                console.warn("⚠️ Continuing without token verification (network error - development mode)");
            }
        } else if (!firebaseAdmin) {
            console.warn("⚠️ Firebase Admin not initialized - skipping token verification");
        }

        // Find user by Firebase UID or email
        let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email }] });

        if (user) {
            // Update user if Firebase UID was missing
            if (!user.firebaseUid) {
                user.firebaseUid = uid;
            }
            // Update display name and photo if provided
            if (displayName) user.name = displayName;
            if (photoURL) user.avatar = photoURL;
            await user.save();
            console.log('✅ User updated:', email);
        } else {
            // Create new user from Firebase
            user = new User({
                name: displayName || email.split('@')[0],
                email,
                firebaseUid: uid,
                avatar: photoURL,
                password: null // No password for Firebase users
            });
            await user.save();
            console.log('✅ New user created:', email);
        }

        // Create JWT token for our app
        const token = jwt.sign({ id: user._id }, JWT_SECRET);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        });

    } catch (err) {
        console.error("Firebase Auth Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Routes

// Get all entries
// Get all entries for a specific user
const groupEntriesByDate = (entries) => entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
}, {});

app.get('/api/entries', async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) return res.json({}); // Return empty if no user

        console.log(`Fetching entries for: ${userEmail}`);

        // Find entries where userEmail matches OR userEmail is null (legacy/public? maybe unsafe)
        // Strict privacy: Only match userEmail.
        const entries = await Entry.find({ userEmail }).sort({ createdAt: -1 }).lean();

        // Group by date for frontend compatibility
        const entriesByDate = groupEntriesByDate(entries);

        res.json(entriesByDate);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ error: err.message });
    }
});

const { startScheduler, updateSchedule } = require('./scheduler');

// ... (Auth imports)

// Start Scheduler
startScheduler();

// ...

// Update Schedule Settings
app.post('/api/settings/schedule', async (req, res) => {
    try {
        const { hour, minute } = req.body;
        if (!hour || !minute) return res.status(400).json({ error: "Missing time" });

        await updateSchedule(hour, minute);
        res.json({ message: "Schedule updated", time: `${hour}:${minute}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const CustomGenre = require('./models/CustomGenre'); // Import

// ... Entries Routes ...

// --- Custom Genre Routes ---

// Get all custom genres for a user
app.get('/api/genres', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.json([]); // Return empty if no email

        const genres = await CustomGenre.find({ userEmail: email });
        res.json(genres);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new custom genre
app.post('/api/genres', async (req, res) => {
    try {
        const { label, id, desc, userEmail, category } = req.body;

        // Simple duplicate check (per category)
        const existing = await CustomGenre.findOne({ id, userEmail, category });
        if (existing) return res.status(400).json({ error: 'Genre already exists in this category' });

        const newGenre = new CustomGenre({ label, id, desc, userEmail, category });
        await newGenre.save();
        res.status(201).json(newGenre);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a custom genre
app.delete('/api/genres/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await CustomGenre.findOneAndDelete({ id }); // Delete by ID string (slug)
        res.json({ message: 'Genre deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper: Scrape YouTube Trailer
app.get('/api/trailer', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Missing query' });

        console.log(`[TRAILER] Searching for: ${q}`);

        // Use native fetch (Node 18+)
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' official trailer')}`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = await response.text();

        // Regex to find the first "videoId":"..."
        const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);

        if (match && match[1]) {
            console.log(`[TRAILER] Found ID: ${match[1]}`);
            return res.json({ videoId: match[1] });
        } else {
            console.log(`[TRAILER] No video found`);
            return res.status(404).json({ error: 'Video not found' });
        }
    } catch (err) {
        console.error("[TRAILER] Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Add new entry
app.post('/api/entries', async (req, res) => {
    try {
        const { date, title, status, rating, poster, genre, genres, category, userEmail, rtCriticScore, rtAudienceScore, trailer, year, description, imdbLink, source } = req.body;

        // Ensure genres is an array
        const finalGenres = genres && Array.isArray(genres) ? genres : [genre || 'General'];

        const newEntry = new Entry({
            date,
            title,
            status,
            rating,
            poster,
            genre: finalGenres[0], // Keep sync
            genres: finalGenres,
            category,
            userEmail, // Save the email
            rtCriticScore,
            rtAudienceScore,
            trailer,
            year,
            description,
            imdbLink,
            source
        });

        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update entry
app.put('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const updatedEntry = await Entry.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedEntry) {
            return res.status(404).json({ error: "Entry not found" });
        }

        res.json(updatedEntry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete entry
app.delete('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cleanId = id.trim();
        console.log(`Received DELETE request for ID: "${cleanId}"`);

        if (!mongoose.Types.ObjectId.isValid(cleanId)) {
            console.log(`❌ Invalid ID format: "${cleanId}"`);
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const deletedEntry = await Entry.findByIdAndDelete(cleanId);

        if (!deletedEntry) {
            console.log(`❌ Entry with ID "${cleanId}" NOT FOUND.`);
            return res.status(404).json({ error: "Entry not found" });
        }

        console.log(`✅ Entry with ID "${cleanId}" DELETED.`);
        res.json({ message: "Entry deleted" });
    } catch (err) {
        console.error("❌ SERVER ERROR in DELETE:", err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// AI CINEBOT ROUTES (Additive — does NOT modify anything above)
// ============================================================

// POST /api/movie-lookup — Search for movie details via SerpAPI
// ============================================================
// WATCH PLANNER + SHARE ROUTES
// ============================================================

const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildFallbackWatchPlan = (entries = [], days = 5) => {
    const now = new Date();
    const candidates = entries
        .filter(entry => entry?.title)
        .sort((a, b) => {
            const statusScore = (value) => value === 'watching' ? 0 : value === 'upcoming' ? 1 : 2;
            return statusScore(a.status) - statusScore(b.status);
        });

    const pool = candidates.length
        ? candidates
        : [
            { title: 'The Boys', category: 'Series', genres: ['Action', 'Superhero'], status: 'upcoming' },
            { title: 'Project Hail Mary', category: 'Movies', genres: ['Sci-Fi'], status: 'upcoming' },
            { title: 'Solo Leveling', category: 'Anime', genres: ['Action', 'Fantasy'], status: 'upcoming' },
            { title: 'Daredevil: Born Again', category: 'Series', genres: ['Crime', 'Superhero'], status: 'upcoming' },
            { title: 'Dr. Stone', category: 'Anime', genres: ['Adventure', 'Sci-Fi'], status: 'upcoming' },
        ];

    return Array.from({ length: Math.max(1, Math.min(Number(days) || 5, 10)) }).map((_, index) => {
        const item = pool[index % pool.length];
        const scheduled = new Date(now);
        scheduled.setDate(now.getDate() + index + 1);
        const genres = Array.isArray(item.genres) && item.genres.length ? item.genres : [item.genre || 'General'];
        return {
            date: toIsoDate(scheduled),
            title: item.title,
            category: item.category || 'Movies',
            genres,
            status: item.status === 'watching' ? 'watching' : 'upcoming',
            poster: item.poster || null,
            rating: item.rating || 0,
            year: item.year || scheduled.getFullYear(),
            description: item.description || `Recommended for this watch slot based on your ${genres.slice(0, 2).join(' and ')} taste.`,
            reason: item.status === 'watching'
                ? 'Continue this because it is already in progress.'
                : `Fits your ${genres.slice(0, 2).join(' / ')} pattern.`,
            source: 'cinebot-watch-planner'
        };
    });
};

app.post('/api/watch-planner', async (req, res) => {
    try {
        const { userEmail, days = 5 } = req.body || {};
        if (!userEmail) return res.status(400).json({ error: 'Missing userEmail' });

        const entries = await Entry.find({ userEmail }).sort({ createdAt: -1 }).limit(80).lean();
        const plan = buildFallbackWatchPlan(entries, days);

        res.json({
            title: `${plan.length}-Day CineBot Watch Plan`,
            generatedAt: new Date().toISOString(),
            source: entries.length ? 'calendar-history' : 'starter-plan',
            items: plan,
        });
    } catch (err) {
        console.error('[WATCH PLANNER] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/calendar/share', async (req, res) => {
    try {
        const { userEmail } = req.body || {};
        if (!userEmail) return res.status(400).json({ error: 'Missing userEmail' });

        const token = jwt.sign(
            { userEmail, scope: 'calendar-share' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ token, expiresInDays: 30 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/calendar/share/:token', async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, JWT_SECRET);
        if (decoded.scope !== 'calendar-share' || !decoded.userEmail) {
            return res.status(403).json({ error: 'Invalid share token' });
        }

        const entries = await Entry.find({ userEmail: decoded.userEmail }).sort({ date: 1 }).lean();
        res.json({
            owner: decoded.userEmail,
            entriesByDate: groupEntriesByDate(entries),
            total: entries.length,
        });
    } catch {
        res.status(403).json({ error: 'Share link is invalid or expired' });
    }
});

const normalizeCineBotCategory = (info = {}) => {
    const explicitCat = String(info.category || '').trim().toLowerCase();
    if (explicitCat === 'anime') return 'Anime';
    if (explicitCat === 'series' || explicitCat === 'tv' || explicitCat === 'tv series') return 'Series';
    if (explicitCat === 'movies' || explicitCat === 'movie' || explicitCat === 'film') return 'Movies';

    const explicitType = String(info.type || '').trim().toLowerCase();
    if (/series|tv|tvseries|tv series|tvminiseries|tv mini series|tvspecial|tvshort|episode|show|television|web series|miniseries/.test(explicitType)) {
        return 'Series';
    }
    if (/movie|feature|film/.test(explicitType)) {
        return 'Movies';
    }
    if (/anime|animeseries/.test(explicitType)) {
        return 'Anime';
    }

    const rawGenres = Array.isArray(info.genres)
        ? info.genres
        : (info.genre ? String(info.genre).split(',') : []);

    const text = [
        info.category,
        info.type,
        info.title,
        info.description,
        info.country,
        info.language,
        info.genre,
        ...rawGenres
    ].filter(Boolean).join(' ').toLowerCase();

    if (/\banime\b|anime series|japanese animation|\bmanga\b|\bshoujo\b|\bshojo\b|\bshounen\b|\bshonen\b|\bseinen\b|\bisekai\b/.test(text)) {
        return 'Anime';
    }

    const isJapaneseAnimation =
        rawGenres.some(g => /animation/i.test(g)) &&
        (/japan|japanese/.test(text));

    if (isJapaneseAnimation) {
        return 'Anime';
    }

    if (/\btv\b|tvseries|tvminiseries|tv-series|tv series|tv mini series|tv mini-series|television|series|mini-series|miniseries|limited series|web series|\bshow\b|episode|season/i.test(text)) {
        return 'Series';
    }

    return 'Movies';
};

app.post('/api/movie-lookup', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Missing query' });

        console.log(`[CINEBOT] Movie lookup: "${query}"`);

        const serpApiKey = process.env.SERPAPI_KEY;
        if (!serpApiKey) return res.status(500).json({ error: 'SerpAPI key not configured' });

        // Step 1: Search neutrally so TV series and anime are not biased into movie results.
        const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query + ' IMDb movie TV series anime release date')}&api_key=${serpApiKey}&engine=google`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        // Step 2: Initialize movie info
        let movieInfo = {
            title: query,
            releaseDate: null,
            year: null,
            poster: null,
            genre: 'General',
            genres: [],
            imdbLink: null,
            description: null,
            type: null,
            country: null,
            language: null,
            category: null
        };

        // Step 3: Try to extract from Knowledge Graph
        if (searchData.knowledge_graph) {
            const kg = searchData.knowledge_graph;
            movieInfo.title = kg.title || query;
            movieInfo.description = kg.description || null;
            if (kg.type) movieInfo.type = kg.type.toLowerCase();

            // Extract release date from multiple possible fields
            const dateStr = kg.release_date || kg.initial_release || kg.release_date_usa || kg.date || null;
            if (dateStr) movieInfo.releaseDate = dateStr;

            // Extract genre
            if (kg.genre || kg.genres) {
                const rawGenres = kg.genre || kg.genres;
                if (Array.isArray(rawGenres)) {
                    movieInfo.genres = rawGenres.map(g => g.trim());
                    movieInfo.genre = movieInfo.genres[0] || 'General';
                } else if (typeof rawGenres === 'string') {
                    movieInfo.genres = rawGenres.split(',').map(g => g.trim());
                    movieInfo.genre = movieInfo.genres[0] || 'General';
                }
            }

            // Extract poster/thumbnail
            if (kg.header_images && kg.header_images.length > 0) {
                movieInfo.poster = kg.header_images[0].image;
            } else if (kg.thumbnail) {
                movieInfo.poster = kg.thumbnail;
            }

            // Try known_attributes for release date and genre fallback
            if (kg.known_attributes) {
                for (const attr of kg.known_attributes) {
                    const name = (attr.name || '').toLowerCase();
                    if (!movieInfo.releaseDate && (name.includes('release') || name.includes('date'))) {
                        movieInfo.releaseDate = attr.value;
                    }
                    if (movieInfo.genre === 'General' && name.includes('genre')) {
                        movieInfo.genre = attr.value;
                        movieInfo.genres = attr.value.split(',').map(g => g.trim());
                    }
                }
            }
        }

        // Step 4: Find IMDB link and extract data from organic results
        if (searchData.organic_results) {
            for (const result of searchData.organic_results) {
                // Find IMDB link
                if (!movieInfo.imdbLink && result.link && result.link.includes('imdb.com/title/')) {
                    movieInfo.imdbLink = result.link;

                    // Extract title from IMDB result if we don't have a good one
                    if (result.title) {
                        // IMDB titles are like: "Inception (2010) - IMDb"
                        const titleMatch = result.title.match(/^(.+?)\s*\((\d{4})\)/);
                        if (titleMatch) {
                            movieInfo.title = titleMatch[1].trim();
                            if (!movieInfo.year) movieInfo.year = parseInt(titleMatch[2]);
                        }
                    }

                    // Extract description from IMDB snippet
                    if (!movieInfo.description && result.snippet) {
                        movieInfo.description = result.snippet.substring(0, 200);
                    }

                    // Extract thumbnail from IMDB result
                    if (!movieInfo.poster && result.thumbnail) {
                        movieInfo.poster = result.thumbnail;
                    }
                }

                // Try to find release date from any snippet
                if (!movieInfo.releaseDate && result.snippet) {
                    // Look for patterns like "Release date: July 16, 2010" or "Release date · September 1, 2022"
                    const datePatterns = [
                        /(?:release(?:d|[\s_]date)?)[^\w\d]+([A-Z][a-z]+ \d{1,2},?\s*\d{4})/i,
                        /(?:release(?:d|[\s_]date)?)[^\w\d]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
                        /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
                        // Fallback just grab the year if 'release' is mentioned
                        /(?:release(?:d|[\s_]date)?).*?(19\d{2}|20\d{2})/i
                    ];
                    for (const pattern of datePatterns) {
                        const match = result.snippet.match(pattern);
                        if (match) {
                            movieInfo.releaseDate = match[1];
                            break;
                        }
                    }
                }
            }
        }

        // Step 5: Check inline images for poster
        if (!movieInfo.poster && searchData.inline_images && searchData.inline_images.length > 0) {
            movieInfo.poster = searchData.inline_images[0].original || searchData.inline_images[0].thumbnail;
        }

        // Step 6: Try answer_box for date info
        if (searchData.answer_box) {
            const ab = searchData.answer_box;
            if (!movieInfo.releaseDate && ab.answer) {
                movieInfo.releaseDate = ab.answer;
            }
            if (!movieInfo.releaseDate && ab.result) {
                movieInfo.releaseDate = ab.result;
            }
        }

        // Step 7: Parse release date into ISO format
        if (movieInfo.releaseDate) {
            try {
                // Clean up the date string
                const cleanDate = movieInfo.releaseDate.replace(/\s+/g, ' ').trim();
                const parsed = new Date(cleanDate);
                if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1800) {
                    movieInfo.year = parsed.getFullYear();
                    const month = String(parsed.getMonth() + 1).padStart(2, '0');
                    const day = String(parsed.getDate()).padStart(2, '0');
                    movieInfo.releaseDate = `${parsed.getFullYear()}-${month}-${day}`;
                } else {
                    // Try to extract just the year
                    const yearMatch = cleanDate.match(/(\d{4})/);
                    if (yearMatch) {
                        movieInfo.year = parseInt(yearMatch[1]);
                        movieInfo.releaseDate = `${yearMatch[1]}-01-01`;
                    }
                }
            } catch {
                const yearMatch = movieInfo.releaseDate.match(/(\d{4})/);
                if (yearMatch) {
                    movieInfo.year = parseInt(yearMatch[1]);
                    movieInfo.releaseDate = `${yearMatch[1]}-01-01`;
                }
            }
        }

        // Step 8: If we still have no year, try to extract from title or IMDB link
        if (!movieInfo.year && movieInfo.imdbLink) {
            // Last resort: use the IMDB result title which often has (YYYY)
            const yearFromLink = searchData.organic_results?.find(r => r.link === movieInfo.imdbLink);
            if (yearFromLink && yearFromLink.title) {
                const ym = yearFromLink.title.match(/\((\d{4})\)/);
                if (ym) {
                    movieInfo.year = parseInt(ym[1]);
                    if (!movieInfo.releaseDate) movieInfo.releaseDate = `${ym[1]}-01-01`;
                }
            }
        }

        // Step 9: Final safeguards
        // If we have year but no releaseDate, default to Jan 1 of that year
        if (movieInfo.year && !movieInfo.releaseDate) {
            movieInfo.releaseDate = `${movieInfo.year}-01-01`;
        }

        // Step 10: TVMaze Check for TV Series (100% free, no key required)
        try {
            const cleanQuery = movieInfo.title || query;
            const tvRes = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(cleanQuery)}`);
            if (tvRes.ok) {
                const tvData = await tvRes.json();
                if (tvData && tvData.name) {
                    const tvName = tvData.name.toLowerCase().trim();
                    const qName = cleanQuery.toLowerCase().trim();
                    const qNoThe = qName.replace(/^the\s+/i, '');
                    const tvNoThe = tvName.replace(/^the\s+/i, '');
                    const isExactOrClose = tvName === qName || tvName === qNoThe || tvNoThe === qName || tvNoThe === qNoThe;

                    if (isExactOrClose) {
                        movieInfo.type = 'series';
                        movieInfo.category = 'Series';
                        if (!movieInfo.imdbLink && tvData.externals?.imdb) {
                            movieInfo.imdbLink = `https://www.imdb.com/title/${tvData.externals.imdb}/`;
                        }
                        if (tvData.premiered) {
                            const parsed = new Date(tvData.premiered);
                            if (!isNaN(parsed.getTime())) {
                                movieInfo.year = parsed.getFullYear();
                                const month = String(parsed.getMonth() + 1).padStart(2, '0');
                                const day = String(parsed.getDate()).padStart(2, '0');
                                movieInfo.releaseDate = `${parsed.getFullYear()}-${month}-${day}`;
                            }
                        }
                        if (!movieInfo.description && tvData.summary) {
                            movieInfo.description = tvData.summary.replace(/<[^>]*>/g, '').substring(0, 250);
                        }
                        if (!movieInfo.poster && tvData.image?.original) {
                            movieInfo.poster = tvData.image.original;
                        }
                    }
                }
            }
        } catch (tvErr) {
            console.log('[CINEBOT] TVMaze fallback skipped:', tvErr.message);
        }

        // Step 11: OMDB API Enrichment with working API key
        if (movieInfo.title) {
            try {
                const imdbId = movieInfo.imdbLink?.match(/title\/(tt\d+)/)?.[1];
                const omdbKeys = ['trilogy', 'b97e269d', '72bc447a'];
                let omdbData = null;

                for (const key of omdbKeys) {
                    const omdbUrl = imdbId
                        ? `https://www.omdbapi.com/?i=${imdbId}&apikey=${key}`
                        : `https://www.omdbapi.com/?t=${encodeURIComponent(movieInfo.title)}&apikey=${key}`;
                    const omdbRes = await fetch(omdbUrl);
                    const resJson = await omdbRes.json();
                    if (resJson.Response === 'True') {
                        omdbData = resJson;
                        break;
                    }
                }

                if (omdbData && omdbData.Response === 'True') {
                    if (omdbData.Title && omdbData.Title !== 'N/A') {
                        movieInfo.title = omdbData.Title;
                    }
                    if (!movieInfo.poster && omdbData.Poster !== 'N/A') {
                        movieInfo.poster = omdbData.Poster;
                    }

                    // Official OMDB release dates are authoritative
                    if (omdbData.Released && omdbData.Released !== 'N/A') {
                        const parsed = new Date(omdbData.Released);
                        if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1800) {
                            movieInfo.year = parsed.getFullYear();
                            const month = String(parsed.getMonth() + 1).padStart(2, '0');
                            const day = String(parsed.getDate()).padStart(2, '0');
                            movieInfo.releaseDate = `${parsed.getFullYear()}-${month}-${day}`;
                        }
                    } else if (omdbData.Year && omdbData.Year !== 'N/A') {
                        const yearMatch = omdbData.Year.match(/(\d{4})/);
                        if (yearMatch) {
                            movieInfo.year = parseInt(yearMatch[1]);
                            if (!movieInfo.releaseDate) movieInfo.releaseDate = `${yearMatch[1]}-01-01`;
                        }
                    }

                    if ((movieInfo.genre === 'General' || movieInfo.genres.length === 0) && omdbData.Genre && omdbData.Genre !== 'N/A') {
                        movieInfo.genres = omdbData.Genre.split(',').map(g => g.trim());
                        movieInfo.genre = movieInfo.genres[0] || 'General';
                    }
                    if (!movieInfo.description && omdbData.Plot && omdbData.Plot !== 'N/A') {
                        movieInfo.description = omdbData.Plot;
                    }
                    if (omdbData.Type && omdbData.Type !== 'N/A') {
                        movieInfo.type = omdbData.Type; // usually 'movie', 'series', 'episode'
                        if (omdbData.Type === 'series' || omdbData.Type === 'episode') {
                            movieInfo.category = 'Series';
                        }
                    }
                    if (omdbData.Country && omdbData.Country !== 'N/A') {
                        movieInfo.country = omdbData.Country;
                    }
                    if (omdbData.Language && omdbData.Language !== 'N/A') {
                        movieInfo.language = omdbData.Language;
                    }
                }
            } catch (omdbErr) {
                console.log('[CINEBOT] OMDB fallback failed:', omdbErr.message);
            }
        }

        // Step 12: AniList Check for Anime Titles
        try {
            const cleanQuery = movieInfo.title || query;
            const aniRes = await fetch('https://graphql.anilist.co', {
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
                    variables: { search: cleanQuery }
                })
            });
            if (aniRes.ok) {
                const aniData = await aniRes.json();
                const matches = aniData?.data?.Page?.media || [];
                const qLower = cleanQuery.toLowerCase().trim();
                const qNoThe = qLower.replace(/^the\s+/i, '');

                const best = matches.find(item => {
                    const titles = [item.title?.english, item.title?.romaji, item.title?.native].filter(Boolean).map(t => t.toLowerCase().trim());
                    return titles.some(t => t === qLower || t === qNoThe || t.replace(/^the\s+/i, '') === qNoThe);
                });

                if (best) {
                    movieInfo.category = 'Anime';
                    movieInfo.type = 'anime';
                    if (!movieInfo.title || movieInfo.title === query) {
                        movieInfo.title = best.title?.english || best.title?.romaji || cleanQuery;
                    }
                    if (best.seasonYear && !movieInfo.year) {
                        movieInfo.year = best.seasonYear;
                        if (!movieInfo.releaseDate) movieInfo.releaseDate = `${best.seasonYear}-01-01`;
                    }
                    if (!movieInfo.poster && (best.coverImage?.extraLarge || best.coverImage?.large)) {
                        movieInfo.poster = best.coverImage.extraLarge || best.coverImage.large;
                    }
                }
            }
        } catch (aniErr) {
            console.log('[CINEBOT] AniList fallback skipped:', aniErr.message);
        }

        movieInfo.category = normalizeCineBotCategory(movieInfo);

        console.log(`[CINEBOT] Lookup result:`, movieInfo);
        res.json(movieInfo);

    } catch (err) {
        console.error('[CINEBOT] Lookup error:', err);

        res.status(500).json({ error: err.message });
    }
});

// POST /api/chat — AI Chat via OpenRouter
const shouldFallbackToMovieLookup = (message = '') => {
    const text = String(message || '').trim();
    if (!text) return false;

    const lower = text.toLowerCase();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const startsLikeQuestion =
        lower.startsWith('how ') ||
        lower.startsWith('why ') ||
        lower.startsWith('what ') ||
        lower.startsWith('who ') ||
        lower.startsWith('when ') ||
        lower.startsWith('where ') ||
        lower.startsWith('recommend') ||
        lower.startsWith('suggest') ||
        lower.startsWith('list ');

    return wordCount <= 8 && !text.includes('?') && !startsLikeQuestion;
};

const buildMovieLookupFallback = (message) => {
    const query = String(message || '').trim();

    return {
        reply: 'The AI chat service is temporarily limited, but I can still look up that title for you.',
        action: {
            type: 'movie_lookup',
            query,
            queries: [query]
        },
        degraded: true
    };
};

app.post('/api/chat', async (req, res) => {
    try {
        const { message, userEmail, conversationHistory } = req.body;
        if (!message) return res.status(400).json({ error: 'Missing message' });

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            if (shouldFallbackToMovieLookup(message)) {
                return res.json(buildMovieLookupFallback(message));
            }

            return res.json({
                reply: 'CineBot chat is not configured yet, but you can type a movie, series, or anime title and I will try to look it up.',
                action: null,
                degraded: true
            });
        }

        console.log(`[CINEBOT] Chat from ${userEmail || 'guest'}: "${message}"`);

        // Fetch user's recent entries for context (do NOT modify the Entry query)
        let userContext = '';
        if (userEmail) {
            const recentEntries = await Entry.find({ userEmail })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            if (recentEntries.length > 0) {
                const watchedList = recentEntries
                    .map(e => `- "${e.title}" (${e.category || 'Movie'}, ${e.status}, ${e.date})`)
                    .join('\n');
                userContext = `\n\nThe user's recent watch history:\n${watchedList}`;
            }
        }

        const systemPrompt = `You are CineBot, an intelligent movie/series/anime assistant embedded in a Movie Catalogue app called "Categloge". You help users discover, learn about, and track movies, series, and anime.

CAPABILITIES:
1. When a user asks about a specific movie, series, or anime by name, or simply types a title, you MUST trigger a lookup by including this EXACT block at the end of your message:
|||MOVIE_LOOKUP|||{"query": "<exact title>"}|||END|||

For example:
User: the bluff
Assistant: Let me look that up for you! 🎬
|||MOVIE_LOOKUP|||{"query": "The Bluff"}|||END|||

2. You can answer general questions about movies, directors, actors, plots, etc.
3. When a user asks for recommendations, suggest titles based on their watch history and preferences.
4. Be conversational, enthusiastic about cinema, and concise.

RULES:
- CRITICAL: If the user names a specific movie/show, you MUST include the |||MOVIE_LOOKUP||| block so the app can render a rich UI card for it. DO NOT just write a conversational summary without triggering the lookup block.
- ALWAYS trigger the block if the user's intent is to learn about, see, or add a specific movie.
- If you are recommending multiple titles, you MUST output a separate |||MOVIE_LOOKUP||| block for EVERY single recommendation in your list.
- Keep text responses concise (1-3 sentences max).${userContext}`;

        // Build messages array
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history if provided
        if (conversationHistory && Array.isArray(conversationHistory)) {
            // Only keep last 10 messages to stay within token limits
            const recent = conversationHistory.slice(-10);
            messages.push(...recent);
        }

        // Add current message
        messages.push({ role: 'user', content: message });

        // Call OpenRouter
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://utkarsh.sbs',
                'X-Title': 'Categloge CineBot'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages,
                max_tokens: 280,
                temperature: 0.7
            })
        });

        const aiData = await aiResponse.json();

        if (!aiResponse.ok) {
            console.error('[CINEBOT] OpenRouter error:', aiData);
            if (shouldFallbackToMovieLookup(message)) {
                return res.json(buildMovieLookupFallback(message));
            }

            return res.json({
                reply: 'CineBot chat is temporarily limited. Try typing a specific movie, series, or anime title so I can look it up directly.',
                action: null,
                degraded: true
            });
        }

        const reply = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

        // Check if the reply contains movie lookup actions
        const lookupRegex = /\|\|\|MOVIE_LOOKUP\|\|\|(.+?)\|\|\|END\|\|\|/g;
        const lookupMatches = [...reply.matchAll(lookupRegex)];
        let action = null;
        let cleanReply = reply;

        if (lookupMatches.length > 0) {
            try {
                const queries = [];
                for (const match of lookupMatches) {
                    try {
                        queries.push(JSON.parse(match[1]).query);
                    } catch { /* ignore single parse error */ }
                }

                if (queries.length > 0) {
                    action = { type: 'movie_lookup', query: queries[0], queries: queries };
                    cleanReply = reply.replace(/\|\|\|MOVIE_LOOKUP\|\|\|.+?\|\|\|END\|\|\|/g, '').trim();
                    if (!cleanReply) {
                        if (queries.length > 1) {
                            cleanReply = "Here are some recommendations I found for you! 🍿";
                        } else {
                            cleanReply = "Let me look that up for you! 🎬";
                        }
                    }
                }
            } catch (e) {
                console.error('[CINEBOT] Failed to parse lookup actions:', e);
            }
        }

        console.log(`[CINEBOT] Reply: "${cleanReply.substring(0, 100)}..."`);
        res.json({ reply: cleanReply, action });

    } catch (err) {
        console.error('[CINEBOT] Chat error:', err);
        if (shouldFallbackToMovieLookup(req.body?.message)) {
            return res.json(buildMovieLookupFallback(req.body.message));
        }

        res.json({
            reply: 'CineBot is temporarily unavailable. Try again in a moment, or type a specific title for direct lookup.',
            action: null,
            degraded: true
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
