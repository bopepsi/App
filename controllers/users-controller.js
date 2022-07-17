const { validationResult } = require('express-validator');
const { default: mongoose } = require('mongoose');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const { getCoordsForAddress } = require('../util/location');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getAllUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, 'name age bio image likes address');
    } catch (error) {
        return next(new HttpError('Oops, something went wrong on server', 500));
    }
    res.status(201).json({ users: users.map(user => user.toObject({ getters: true })) });

}

const getUserById = async (req, res, next) => {
    let userId = req.params.uid;
    let user;
    console.log('in here')
    try {
        // user = await User.findById(userId).populate('posts collections likedPosts')
        user = await User.findById(userId).populate([{ path: 'posts', model: 'Post', options: { sort: { 'date': -1 } }, populate: { path: 'creator', model: 'User' } }, { path: 'likedPosts', model: 'Post', populate: { path: 'creator', model: 'User' } }, { path: 'collections', model: 'Collection' }]);
    } catch (error) {
        return next(new HttpError('Oops something went wrong'), 500)
    };
    if (!user) {
        return next(new HttpError('User not exist'), 404);
    };
    res.status(201).json({ user: user.toObject({ getters: true }) });
    // res.status(201).json({ user: user.toObject({ getters: true }), likedPosts: user.likedPosts.map(p => p.toObject({ getters: true })), posts: user.posts.map(p => p.toObject({ getters: true })) });
}
// options: { sort: { 'date': -1 } },
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
        user = await User.findById(uId).populate('followers');
    } catch (error) {
        return next(new HttpError('Oops something went wrong', 500));
    }
    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    }
    res.status(201).json({ followers: user.followers.map(item => item.toObject({ getters: true })) });
}

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Please check your inputs', 422));
    }

    const { name, email, password, age, address } = req.body;

    let image = process.env.SERVER_URL + req.file.path;

    let bio = 'No bio yet';
    let gender = 'Unknown';
    let gymMembership = [];
    let athleteTypes = [];
    let likes = 0;
    let backgroundImage = `${process.env.SERVER_URL}uploads/default/background.jpg`;
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
    };

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when finding exising user', 500));
    };

    if (existingUser) {
        return next(new HttpError('User already exists, login instead.', 422));
    };

    const newUser = new User({ name, email, password: hashedPassword, age, bio, gender, gymMembership, athleteTypes, image, likes, backgroundImage, address: formalAddress, location: coordinates, appointments, invitations, reviews, likedPosts, posts, collections, follows, followers, comments, unreadNotifications, unreadComments });

    try {
        await newUser.save();
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when creating user', 500));
    };

    let token;
    try {
        token = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.SUPER_SECRET, { expiresIn: '1h' });
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when creating user', 500));
    };

    res.status(201).json({ user: newUser.toObject({ getters: true }), token: token });

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
    };

    if (!isValidPassword) {
        return next(new HttpError('Invalid credentials', 401));
    };

    let token;
    try {
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, process.env.SUPER_SECRET, { expiresIn: '1h' });
    } catch (error) {
        return next(new HttpError('Oops, something went wrong', 500));
    };

    return res.status(200).json({ message: 'Logged in', user: existingUser.toObject({ getters: true }), token: token });

}

const editUserProfile = async (req, res, next) => {
    let uId = req.params.uid;
    const { name, age, bio, gender, gymMembership, athleteTypes, address } = req.body;
    let user;
    try {
        user = await User.findById(uId);
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };

    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    };

    //* userData was stored in req in check-auth middleware
    const { userId } = req.userData;
    //* Change mongoDb Object id type to String, then compare
    if (user.id !== userId) {
        return next(new HttpError('You are not authenticated for this action.', 401));
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

    if (req.file) {
        let imageURL = process.env.SERVER_URL + req.file.path;
        user.image = imageURL;
    }

    let newBio;
    if (!bio || bio.length === 0) {
        newBio = 'No bio yet.'
    } else {
        newBio = bio;
    }
    let newGender;
    if (!gender || gender.trim().length === 0) {
        newGender = 'Unknow';
    } else {
        newGender = gender;
    }
    let newAge;
    if (age > 0) {
        newAge = age;
    } else {
        newAge = 0;
    }

    user.name = name;
    user.age = newAge;
    user.bio = newBio;
    user.gender = newGender;
    user.gymMembership = gymMembership || [];
    user.athleteTypes = athleteTypes || [];
    user.address = formalAddress;
    user.location = coordinates;

    try {
        await user.save();
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    }

    let token;
    try {
        token = jwt.sign({ userId: user.id, email: user.email }, process.env.SUPER_SECRET, { expiresIn: '1h' });
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when editing user profile', 500));
    };

    res.status(201).json({ message: 'User profile updated', user: user.toObject({ getters: true }), token: token })

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

    //* userData was stored in req in check-auth middleware
    const authUserId = req.userData.userId;
    //* Change mongoDb Object id type to String, then compare
    if (thisUser.id !== authUserId) {
        return next(new HttpError('You are not authenticated for this action.', 401));
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

    //* userData was stored in req in check-auth middleware
    const authUserId = req.userData.userId;
    //* Change mongoDb Object id type to String, then compare
    if (thisUser.id !== authUserId) {
        return next(new HttpError('You are not authenticated for this action.', 401));
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

const changeBackgroundImage = async (req, res, next) => {

    let image = process.env.SERVER_URL + req.file.path;
    const uId = req.params.uid;

    let existingUser;
    try {
        existingUser = await User.findById(uId);
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when finding exising user', 500));
    };

    if (!existingUser) {
        return next(new HttpError('User not exists.', 422));
    };

    //* userData was stored in req in check-auth middleware
    const authUserId = req.userData.userId;
    //* Change mongoDb Object id type to String, then compare
    if (existingUser.id !== authUserId) {
        return next(new HttpError('You are not authenticated for this action.', 401));
    }

    existingUser.backgroundImage = image;

    try {
        await existingUser.save();
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when saving image', 500));
    };

    res.status(201).json({ message: 'Suceess!' });
}

const changeUserImage = async (req, res, next) => {

    let image = process.env.SERVER_URL + req.file.path;
    const uId = req.params.uid;

    let existingUser;
    try {
        existingUser = await User.findById(uId);
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when finding exising user', 500));
    };

    if (!existingUser) {
        return next(new HttpError('User not exists.', 422));
    };

    //* userData was stored in req in check-auth middleware
    const authUserId = req.userData.userId;
    //* Change mongoDb Object id type to String, then compare
    if (existingUser.id !== authUserId) {
        return next(new HttpError('You are not authenticated for this action.', 401));
    }

    existingUser.image = image;

    try {
        await existingUser.save();
    } catch (error) {
        return next(new HttpError('Oops, something went wrong when saving image', 500));
    };

    res.status(201).json({ message: 'Suceess!' });
}

module.exports = {
    signup,
    login,
    getAllUsers,
    getUserById,
    getUserFollowers,
    getUserFollowings,
    editUserProfile,
    followUser,
    unFollowUser,
    changeBackgroundImage,
    changeUserImage
}