const { validationResult } = require('express-validator');
const uuid = require('uuid');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const { getCoordsForAddress } = require('../util/location');

let DUMMY_USERS = [
    {
        id: 'u1',
        name: 'bob',
        email: 'bob@gmail.com',
        password: '111111',
        image: 'imageURL'
    }
]

const getAllUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, 'name age bio image likes address');
    } catch (error) {
        return next(new HttpError('Oops, something went wrong on server', 500));
    }
    res.status(201).json({ users: users.map(user => user.toObject({ getters: true })) });

}

const getUserFollowings = (req, res, next) => {

}

const getUserFollowers = (req, res, next) => {

}

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Please check your inputs', 422));
    }

    const { name, email, password, image, age, address } = req.body;

    let bio = 'nothing yet';
    let gender = 'unknown';
    let gymMembership = [];
    let athleteTypes = [];
    let likes = 0;
    let backgroundImage = 'aFilePath';
    let appointments = [];
    let invitations = [];
    let reviews = [];
    let likedPosts = [];
    let posts = [];
    let collections = [];
    let follows = [];
    let followers = [];

    let coordinates;
    let formalAddress;
    try {
        const result = await getCoordsForAddress(address);
        coordinates = result.coordinates;
        formalAddress = result.formalAddress;
    } catch (error) {
        return next(error);
    }

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when finding exising user', 500));
    }

    if (existingUser) {
        return next(new HttpError('User already exists, login instead.', 422));
    }

    const newUser = new User({ name, email, password, age, bio, gender, gymMembership, athleteTypes, image, likes, backgroundImage, address: formalAddress, location: coordinates, appointments, invitations, reviews, likedPosts, posts, collections, follows, followers });

    try {
        await newUser.save();
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when creating user', 500));
    }

    res.status(201).json({ user: newUser.toObject({ getters: true }) });
}

const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when finding exising user', 500));
    }

    if (!existingUser || existingUser.password !== password) {
        return next(new HttpError('Invalid credentials', 401));
    }


    return res.status(200).json({ message: 'Logged in', user: existingUser.toObject({ getters: true }) });

}

const editUserProfile = (req, res, next) => {

}

module.exports = {
    signup,
    login,
    getAllUsers,
    getUserFollowers,
    getUserFollowings,
    editUserProfile,
}