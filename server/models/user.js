// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true },
    username: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
});

module.exports = mongoose.model('User', userSchema);