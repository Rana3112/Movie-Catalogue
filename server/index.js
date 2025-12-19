require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Entry = require('./models/Entry');
const User = require('./models/User'); // Import User Model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_123'; // Fallback for dev

// Middleware
app.use(cors({
    origin: ['https://movie-catalogue-v1-iota.vercel.app', 'http://localhost:5173'],
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

// MongoDB Connection
// console.log("DEBUG: MONGODB_URI is:", process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@') : "UNDEFINED");

// Direct Connection String (Bypassing SRV Lookup)
const HARDCODED_URI = "mongodb://utkarshrana40_db_user:render12345@ac-757bpcf-shard-00-00.tpbyi5g.mongodb.net:27017,ac-757bpcf-shard-00-01.tpbyi5g.mongodb.net:27017,ac-757bpcf-shard-00-02.tpbyi5g.mongodb.net:27017/?ssl=true&replicaSet=atlas-11wk81-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(HARDCODED_URI) // Removed family: 4 as we are using direct hosts
    .then(() => console.log('✅ MongoDB Connected (DIRECT)'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

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

// Routes

// Get all entries
app.get('/api/entries', async (req, res) => {
    try {
        const entries = await Entry.find().sort({ createdAt: -1 });

        // Group by date for frontend compatibility
        // Format: { "YYYY-MM-DD": [ ...entries ] }
        const entriesByDate = entries.reduce((acc, entry) => {
            if (!acc[entry.date]) acc[entry.date] = [];
            acc[entry.date].push(entry);
            return acc;
        }, {});

        res.json(entriesByDate);
    } catch (err) {
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
        const { label, id, desc, userEmail } = req.body;

        // Simple duplicate check
        const existing = await CustomGenre.findOne({ id, userEmail });
        if (existing) return res.status(400).json({ error: 'Genre already exists' });

        const newGenre = new CustomGenre({ label, id, desc, userEmail });
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
        // OR findOneAndDelete({ _id: id }) if passing MongoID. 
        // Frontend passes "slug" ID usually for genres. I will support finding by 'id' field.
        res.json({ message: 'Genre deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new entry
app.post('/api/entries', async (req, res) => {
    try {
        const { date, title, status, rating, poster, genre, genres, category, userEmail } = req.body;

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
            userEmail // Save the email
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

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
