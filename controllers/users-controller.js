const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const { getCoordsForAddress } = require('../util/location');

const getAllUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, 'name age bio image likes address');
    } catch (error) {
        return next(new HttpError('Oops, something went wrong on server', 500));
    }
    res.status(201).json({ users: users.map(user => user.toObject({ getters: true })) });

}

const getUserFollowings = async (req, res, next) => {
    const uId = req.params.uid;
    let user;
    try {
        user = await User.findById(uId).populate('follows');
    } catch (error) {
        return next(new HttpError('Oops something went wrong', 500));
    }
    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    }
    res.status(201).json({ followings: user.follows.map(item => item.toObject({ getters: true })) });
}

const getUserFollowers = async (req, res, next) => {
    const uId = req.params.uid;
    let user;
    try {
        user = await User.findById(uId).populate('follows');
    } catch (error) {
        return next(new HttpError('Oops something went wrong', 500));
    }
    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    }
    res.status(201).json({ followings: user.followers.map(item => item.toObject({ getters: true })) });
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

const editUserProfile = async (req, res, next) => {
    let uId = req.params.uid;
    const { name, password, age, bio, gender, gymMembership, athleteTypes, image, backgroundImage, address } = req.body;
    let user;
    try {
        user = await User.findById(uId);
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    }

    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    }

    let coordinates;
    let formalAddress;
    try {
        const result = await getCoordsForAddress(address);
        coordinates = result.coordinates;
        formalAddress = result.formalAddress;
    } catch (error) {
        return next(error);
    }

    user.name = name;
    user.password = password;
    user.age = age;
    user.bio = bio;
    user.gender = gender;
    user.gymMembership = gymMembership;
    user.athleteTypes = athleteTypes;
    user.image = image;
    user.backgroundImage = backgroundImage;
    user.address = formalAddress;
    user.location = coordinates;

    try {
        await user.save();
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    }

    res.status(201).json({ message: 'User profile updated', user: user.toObject({ getters: true }) })

}

module.exports = {
    signup,
    login,
    getAllUsers,
    getUserFollowers,
    getUserFollowings,
    editUserProfile,
}