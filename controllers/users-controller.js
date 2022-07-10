const { validationResult } = require('express-validator');
const { default: mongoose } = require('mongoose');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const { getCoordsForAddress } = require('../util/location');
const bcrypt = require('bcryptjs');

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

    const { name, email, password, age, address } = req.body;

    let image = req.file.path;

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
    let comments = [];
    let unreadNotifications = 0;
    let unreadComments = [];

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError('Could not create user.'), 500);
    };

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

    const newUser = new User({ name, email, password: hashedPassword, age, bio, gender, gymMembership, athleteTypes, image, likes, backgroundImage, address: formalAddress, location: coordinates, appointments, invitations, reviews, likedPosts, posts, collections, follows, followers, comments, unreadNotifications, unreadComments });

    try {
        await newUser.save();
    } catch (error) {
        console.log(error)
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
    };

    if (!existingUser) {
        return next(new HttpError('Invalid credentials', 401));
    };

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (error) {
        return next(new HttpError('Oops something went wrong', 500));
    }

    if (!isValidPassword) {
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
    };

    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    };

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError('Could not create user.'), 500);
    };

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
    user.password = hashedPassword;
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

const followUser = async (req, res, next) => {
    const userId = req.params.uid;
    const { creator } = req.body;
    //* find this creator(follower) user info
    let thisUser;
    try {
        thisUser = await User.findById(creator).populate('follows');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    }
    if (!thisUser) {
        return next(new HttpError('Could not find creator user.', 422));
    }
    //* find to be followed user info
    let user;
    try {
        user = await User.findById(userId).populate('followers');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    }
    if (!user) {
        return next(new HttpError('Could not find creator user.', 422));
    }
    //* Update followings and followers then save
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        thisUser.follows.push(user);
        user.followers.push(thisUser);
        await thisUser.save({ session: sess });
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, follow user failed.', 500));
    };

    res.status(201).json({ message: 'Follow success.' });
}

const unFollowUser = async (req, res, next) => {
    const userId = req.params.uid;
    const { creator } = req.body;
    //* find this creator(follower) user info
    let thisUser;
    try {
        thisUser = await User.findById(creator).populate('follows');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    }
    if (!thisUser) {
        return next(new HttpError('Could not find creator user.', 422));
    }
    //* find to be followed user info
    let user;
    try {
        user = await User.findById(userId).populate('followers');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    }
    if (!user) {
        return next(new HttpError('Could not find creator user.', 422));
    }
    //* Update followings and followers then save
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        thisUser.follows.pull(user);
        user.followers.pull(thisUser);
        await thisUser.save({ session: sess });
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, follow user failed.', 500));
    };

    res.status(201).json({ message: 'Unfollow success.' });
}

module.exports = {
    signup,
    login,
    getAllUsers,
    getUserFollowers,
    getUserFollowings,
    editUserProfile,
    followUser,
    unFollowUser,
}