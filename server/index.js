require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Entry = require('./models/Entry');
const User = require('./models/User'); // Import User Model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_123'; // Fallback for dev

// Initialize Firebase Admin
let firebaseAdmin = null;
try {
  // Try to use service account from environment variables first
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // Replace escaped newlines with actual newlines
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\\\n/g, '\n');

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    };

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'movie-catelogue'
    });
    console.log('✅ Firebase Admin Initialized with environment variables');
  } else {
    // Fallback to file-based service account
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-service-account.json';
    const serviceAccount = require(serviceAccountPath);

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'movie-catelogue'
    });
    console.log('✅ Firebase Admin Initialized with service account file');
  }
} catch (error) {
  console.error('❌ Firebase Admin Initialization Error:', error.message);
  console.error('Make sure Firebase credentials are configured');
}

// Middleware
app.use(cors({
    origin: ['https://utkarsh.sbs', 'https://www.utkarsh.sbs', 'https://movie-catalogue-v1-iota.vercel.app', 'https://movie-catalogue-taupe.vercel.app', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173', 'http://10.0.2.2:5000'],
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


mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
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
        const term = password; // Temp fix if password comes as different type, but it should be string
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
app.get('/api/entries', async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) return res.json({}); // Return empty if no user

        console.log(`Fetching entries for: ${userEmail}`);

        // Find entries where userEmail matches OR userEmail is null (legacy/public? maybe unsafe)
        // Strict privacy: Only match userEmail.
        const entries = await Entry.find({ userEmail }).sort({ createdAt: -1 });

        // Group by date for frontend compatibility
        const entriesByDate = entries.reduce((acc, entry) => {
            if (!acc[entry.date]) acc[entry.date] = [];
            acc[entry.date].push(entry);
            return acc;
        }, {});

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
        const { date, title, status, rating, poster, genre, genres, category, userEmail, rtCriticScore, rtAudienceScore, trailer } = req.body;

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
            trailer
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
app.post('/api/movie-lookup', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Missing query' });

        console.log(`[CINEBOT] Movie lookup: "${query}"`);

        const serpApiKey = process.env.SERPAPI_KEY;
        if (!serpApiKey) return res.status(500).json({ error: 'SerpAPI key not configured' });

        // Step 1: Search for the movie on Google via SerpAPI
        const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query + ' movie release date IMDB')}&api_key=${serpApiKey}&engine=google`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        // Step 2: Initialize movie info
        let movieInfo = {
            title: query,
            releaseDate: null,
            year: null,
            poster: null,
            genre: 'General',
            imdbLink: null,
            description: null,
            type: null
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
            if (kg.genre) {
                movieInfo.genre = Array.isArray(kg.genre) ? kg.genre[0] : kg.genre;
            } else if (kg.genres) {
                movieInfo.genre = Array.isArray(kg.genres) ? kg.genres[0] : kg.genres;
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
                        /(?:release(?:d|[\s_]date)?)[^\w\d]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
                        /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
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
            } catch (e) {
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

        // Step 10: Always try OMDB API to enrich any missing data
        if (movieInfo.title) {
            try {
                const omdbUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(movieInfo.title)}&apikey=3e80e9fc`;
                const omdbRes = await fetch(omdbUrl);
                const omdbData = await omdbRes.json();

                if (omdbData.Response === 'True') {
                    if (!movieInfo.poster && omdbData.Poster !== 'N/A') {
                        movieInfo.poster = omdbData.Poster;
                    }
                    // Also fill in missing data from OMDB
                    if (!movieInfo.releaseDate && omdbData.Released !== 'N/A') {
                        const parsed = new Date(omdbData.Released);
                        if (!isNaN(parsed.getTime())) {
                            movieInfo.year = parsed.getFullYear();
                            const month = String(parsed.getMonth() + 1).padStart(2, '0');
                            const day = String(parsed.getDate()).padStart(2, '0');
                            movieInfo.releaseDate = `${parsed.getFullYear()}-${month}-${day}`;
                        }
                    }
                    // Fallback for TV Series which might only have 'Year' instead of 'Released'
                    if (!movieInfo.year && omdbData.Year !== 'N/A') {
                        const yearMatch = omdbData.Year.match(/(\d{4})/);
                        if (yearMatch) {
                            movieInfo.year = parseInt(yearMatch[1]);
                            if (!movieInfo.releaseDate) movieInfo.releaseDate = `${yearMatch[1]}-01-01`;
                        }
                    }
                    if (movieInfo.genre === 'General' && omdbData.Genre && omdbData.Genre !== 'N/A') {
                        movieInfo.genre = omdbData.Genre.split(',')[0].trim();
                    }
                    if (!movieInfo.description && omdbData.Plot && omdbData.Plot !== 'N/A') {
                        movieInfo.description = omdbData.Plot;
                    }
                    if (!movieInfo.type && omdbData.Type && omdbData.Type !== 'N/A') {
                        movieInfo.type = omdbData.Type; // usually 'movie', 'series', 'episode'
                    }
                }
            } catch (omdbErr) {
                console.log('[CINEBOT] OMDB fallback failed:', omdbErr.message);
            }
        }

        console.log(`[CINEBOT] Lookup result:`, movieInfo);
        res.json(movieInfo);

    } catch (err) {
        console.error('[CINEBOT] Lookup error:', err);

        res.status(500).json({ error: err.message });
    }
});

// POST /api/chat — AI Chat via OpenRouter
app.post('/api/chat', async (req, res) => {
    try {
        const { message, userEmail, conversationHistory } = req.body;
        if (!message) return res.status(400).json({ error: 'Missing message' });

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'OpenRouter API key not configured' });

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
                model: 'openai/gpt-4.1-nano',
                messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const aiData = await aiResponse.json();

        if (!aiResponse.ok) {
            console.error('[CINEBOT] OpenRouter error:', aiData);
            return res.status(500).json({ error: 'AI service error', details: aiData });
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
                    } catch (e) { /* ignore single parse error */ }
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
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
