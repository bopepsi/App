const mongoose = require('mongoose');
const { Schema } = require('mongoose');

// Blue print for collection document data
const reviewSchema = new Schema({
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    appointment: { type: mongoose.Types.ObjectId, required: true, ref: "Appointment" },
    rating: { type: Number, required: true },
    text: { type: String },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);