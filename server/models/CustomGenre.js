const mongoose = require('mongoose');

const customGenreSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        default: 'Custom User Genre'
    },
    userEmail: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CustomGenre', customGenreSchema);
