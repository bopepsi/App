const mongoose = require('mongoose');
const { Schema } = require('mongoose');

// Blue print for collection document data
const reviewSchema = new Schema({
    reciever: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    appointment: { type: mongoose.Types.ObjectId, required: true, ref: "Appointment" },
    text: { type: String, required: true },
    rating: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);