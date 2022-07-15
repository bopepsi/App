const mongoose = require('mongoose');
const { Schema } = require('mongoose');

// Blue print for collection document data
const tagSchema = new Schema({
    text: { type: String, required: true },
    posts: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }],
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tag', tagSchema);