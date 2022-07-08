const mongoose = require('mongoose');
const { Schema } = require('mongoose');

// Blue print for collection document data
const commentSchema = new Schema({
    text: { type: String, required: true },
    likes: { type: Number, required: true },
    likedBy: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    replies: [{ type: mongoose.Types.ObjectId, required: true, ref: "Comment" }],
    date: { type: Date, default: Date.now },

});

module.exports = mongoose.model('Comment', commentSchema);