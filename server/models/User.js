const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: function () { return !this.googleId; } // Password required if not Google Auth
    },
    avatar: {
        type: String,
        default: ""
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allow multiple nulls
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('User', UserSchema);
