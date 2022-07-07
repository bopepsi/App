const mongoose = require('mongoose');
const { Schema } = require('mongoose');

// Blue print for collection document data
const appointmentSchema = new Schema({
    reciever: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    title: { type: String, required: true },
    desscription: { type: String, required: true },
    address: { type: String, required: true },
    appointmentData: { type: Date, required: true },
    recieverAccepted: { type: Boolean, required: true },
    recieverRejected: { type: Boolean, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);