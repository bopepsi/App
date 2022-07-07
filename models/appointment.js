const mongoose = require('mongoose');
const { Schema } = require('mongoose');

// Blue print for collection document data
const appointmentSchema = new Schema({
    reciever: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    title: { type: String, required: true },
    address: { type: String, required: true },
    date: { type: Date, required: true }
});

module.exports = mongoose.model('Appointment', appointmentSchema);