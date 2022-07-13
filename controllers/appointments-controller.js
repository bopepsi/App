const { default: mongoose } = require('mongoose');
const Appointment = require('../models/appointment');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const { getCoordsForAddress } = require('../util/location');

const getAppointmentsByUserId = async (req, res, next) => {
    let userId = req.params.uid;
    // let appointments;
    let user;
    try {
        user = await User.findById(userId).populate({ path: 'appointments', model: 'Appointment', populate: [{ path: 'reciever', model: 'User' }, { path: 'creator', model: 'User' }] });
        // appointments = await Appointment.find({ creator: userId }).populate('reviews reciever');
        // user = await User.findById(userId).populate('appointments reviews');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!user) {
        return next(new HttpError('User not exist.', 422));
    };
    res.json({ appointments: user.appointments.map(appo => appo.toObject({ getters: true })) });
}

const getAppointmentById = async (req, res, next) => {
    let aid = req.params.aid;
    let appointment;
    try {
        appointment = await Appointment.findById(aid).populate('creator reviews reciever');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!appointment) {
        return next(new HttpError('Appointments not exist.', 422));
    };
    res.json({ appointment: appointment.toObject({ getters: true }) });
}
// user = await User.findById(userId).populate([{ path: 'posts', model: 'Post', populate: { path: 'creator', model: 'User' } }, { path: 'likedPosts', model: 'Post', populate: { path: 'creator', model: 'User' } }, { path: 'collections', model: 'Collection' }]);
const getInvitationsByUserId = async (req, res, next) => {
    let userId = req.params.uid;
    let user;
    try {
        user = await User.findById(userId).populate({ path: 'invitations', model: 'Appointment', populate: [{ path: 'reciever', model: 'User' }, { path: 'creator', model: 'User' }] });
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!user) {
        return next(new HttpError('User not exist.', 422));
    }
    res.status(201).json({ invitations: user.invitations.map(a => a.toObject({ getters: true })) });
}

const createAppointment = async (req, res, next) => {
    const { reciever, creator, title, description, duration, address, appointmentDate } = req.body;
    //* get recieverUser and creatorUser
    let recieverUser;
    try {
        recieverUser = await User.findById(reciever).populate('invitations');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    let creatorUser;
    try {
        creatorUser = await User.findById(creator).populate('appointments');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!recieverUser || !creatorUser) {
        return next(new HttpError('User not exist.', 422));
    };
    //* get formal address and coords
    let coordinates;
    let formalAddress;
    try {
        const result = await getCoordsForAddress(address);
        coordinates = result.coordinates;
        formalAddress = result.formalAddress;
    } catch (error) {
        return next(error);
    };
    //* create new Appointment instance
    let newAppointment = new Appointment({ reciever, creator, title, description, duration, address: formalAddress, location: coordinates, appointmentDate, pending: true, recieverAccepted: false, recieverRejected: false, reviews: [] });
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        recieverUser.invitations.push(newAppointment);
        creatorUser.appointments.push(newAppointment);
        await newAppointment.save({ session: sess });
        await recieverUser.save({ session: sess });
        await creatorUser.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, creating appointment failed.', 500));
    };
    res.status(201).json({ newAppointment });
}

const acceptInvitation = async (req, res, next) => {
    const { userId, appointmentId } = req.body;
    let user;
    try {
        user = await User.findById(userId);
        // user = await User.findById(userId).populate('invitations appointments');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    let appointment;
    try {
        appointment = await Appointment.findById(appointmentId);
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };

    if (!user || !appointment) {
        return next(new HttpError('Data not exist.', 422));
    };
    //* update user info, appoint info and save
    console.log(user, appointment)
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        user.invitations.pull(appointment);
        user.appointments.push(appointment);
        appointment.recieverAccepted = true;
        appointment.pending = false;
        // await user.invitations.save({ session: sess });
        // await user.appointments.save({ session: sess })
        await user.save({ session: sess });
        await appointment.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, saving appointment failed.', 500));
    };
    res.status(201).json({ message: "Invitation accepted." });

}

const rejectInvitation = async (req, res, next) => {
    const { userId, appointmentId } = req.body;
    let user;
    try {
        user = await User.findById(userId);
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    let appointment;
    try {
        appointment = await Appointment.findById(appointmentId);
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };

    if (!user || !appointment) {
        return next(new HttpError('Data not exist.', 422));
    };
    //* update user info, appoint info and save
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        user.invitations.pull(appointment);
        appointment.recieverAccepted = false;
        appointment.pending = false;
        appointment.recieverRejected = true;
        // await user.invitations.save({ session: sess });
        await user.save({ session: sess });
        await appointment.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, saving appointment failed.', 500));
    };
    res.status(201).json({ message: "Invitation rejected." });
}

module.exports = {
    getAppointmentById,
    getAppointmentsByUserId,
    getInvitationsByUserId,
    createAppointment,
    acceptInvitation,
    rejectInvitation
}