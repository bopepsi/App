const mongoose = require('mongoose');
const { Schema } = require('mongoose');

// Blue print for post document data
const postSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: [{ type: String, required: true }],
    image: { type: String, required: true },
    likes: { type: Number, required: true },
    dislikes: { type: Number, required: true },
    collections: { type: Number, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    comments: [{ type: mongoose.Types.ObjectId, required: true, ref: "Comment" }],
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);

