const Review = require('../models/review');
const Appointment = require('../models/appointment');
const User = require('../models/user');
const HttpError = require('../models/http-error');
const { default: mongoose } = require('mongoose');

const createReview = async (req, res, next) => {
    let { reciever, creator, appointment, text, rating } = req.body;
    console.log(req.body);
    if (!reciever || !creator || !appointment || !rating) {
        return next(new HttpError('Invalid inputs', 500));
    }
    //* find user
    let user;
    try {
        user = await User.findById(creator);
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    };
    //* find appointment
    let foundAppointment;
    try {
        foundAppointment = await Appointment.findById(appointment).populate('reviews');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!foundAppointment) {
        return next(new HttpError('Could not find appointment.', 404));
    };

    const newReview = new Review({ creator, reciever, appointment, rating, text });

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await newReview.save({ session: sess });
        foundAppointment.reviews.push(newReview);
        await foundAppointment.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, creating review failed.', 500));
    }

    res.status(201).json({ message: 'Review created.', review: newReview.toObject({ getters: true }) });

};

const getReviewForAppointmentById = async (req, res, next) => {
    let aId = req.params.aid;
    let appointment;
    try {
        appointment = await Appointment.findById(aId).populate('reviews');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!appointment) {
        return next(new HttpError('Could not find appointment.', 404));
    };
    res.status(201).json({ reviews: appointment.reviews.map(r => r.toObject({ getters: true })) });
};

const getReviewsByUserId = async (req, res, next) => {
    let uId = req.params.uid;
    let reviews;
    try {
        reviews = await Review.find({ reciever: uId }).populate('creator');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!reviews) {
        return next(new HttpError('Could not find reviews.', 404));
    };
    res.status(201).json({ reviews: reviews.map(r => r.toObject({ getters: true })) });
}

module.exports = {
    createReview,
    getReviewForAppointmentById,
    getReviewsByUserId
};