const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
    date: {
        type: String, // ISO date string "YYYY-MM-DD"
        required: true
    },
    title: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['watched', 'upcoming', 'watching'],
        default: 'watched'
    },
    year: {
        type: Number
    },
    poster: {
        type: String // URL or Base64
    },
    genre: { // Legacy field, keeping for safety
        type: String,
        default: 'General'
    },
    genres: { // New Field for Multi-Genre support
        type: [String],
        default: []
    },
    category: {
        type: String,
        required: true,
        default: 'Movies'
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    poster: {
        type: String, // URL or Base64
        default: null
    },
    userEmail: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Entry', EntrySchema);
