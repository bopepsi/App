const { default: mongoose } = require('mongoose');
const Appointment = require('../models/appointment');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const { getCoordsForAddress } = require('../util/location');

const getAppointmentsByUserId = async (req, res, next) => {
    let userId = req.params.uid;
    let user;
    try {
        user = await User.findById(userId).populate('appointments reviews');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    console.log(user);
    if (!user) {
        return next(new HttpError('User not exist.', 422));
    };
    res.json({ appointments: user.appointments.map(appo => appo.toObject({ getters: true })) });
}

const getInvitationsByUserId = async (req, res, next) => {
    let userId = req.params.uid;
    let user;
    try {
        user = await User.findById(userId).populate('invitations');
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
        user = await User.findById(userId).populate('invitations appointments');
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
        user.invitations.pull(appointmentId);
        user.appointments.push(appointmentId);
        appointment.recieverAccepted = true;
        appointment.pending = false;
        await user.save();
        await appointment.save();
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, saving appointment failed.', 500));
    };
    res.status(201).json({ message: "Invitation accepted.", invitations: user.invitations.map(a => a.toObject({ getters: true })) });

}

const rejectInvitation = async (req, res, next) => {
    const { userId, appointmentId } = req.body;
    let user;
    try {
        user = await User.findById(userId).populate('invitations');
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
        user.invitations.pull(appointmentId);
        appointment.recieverAccepted = false;
        appointment.pending = false;
        appointment.recieverRejected = true;
        await user.save();
        await appointment.save();
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, saving appointment failed.', 500));
    };
    res.status(201).json({ message: "Invitation rejected.", invitations: user.invitations.map(a => a.toObject({ getters: true })) });
}

module.exports = {
    getAppointmentsByUserId,
    getInvitationsByUserId,
    createAppointment,
    acceptInvitation,
    rejectInvitation
}