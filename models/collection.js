const mongoose = require('mongoose');
const { Schema } = require('mongoose');

// Blue print for collection document data
const collectionSchema = new Schema({
    title: { type: String, required: true },
    posts: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }],
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model('Post', collectionSchema);