const { validationResult } = require('express-validator');
const uuid = require('uuid');
const HttpError = require('../models/http-error');

let DUMMY_USERS = [
    {
        id: 'u1',
        name: 'bob',
        email: 'bob@gmail.com',
        password: '111111',
        image: 'imageURL'
    }
]

const getUserFollowings = (req, res, next) => {

}

const getUserFollowers = (req, res, next) => {

}

const signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Please check your inputs', 422));
    }

    const { name, email, password, image } = req.body;

    const hasUser = DUMMY_USERS.find(user => user.email === email);
    if (hasUser) {
        return next(new HttpError('User already exists.', 422));
    };
    const newUser = { id: uuid.v4(), name, email, password, image };
    DUMMY_USERS.push(newUser);
    res.status(201).json({ user: newUser });
}

const login = (req, res, next) => {
    const { email, password } = req.body;
    const identifiedUser = DUMMY_USERS.find(user => user.email === email);

    if (!identifiedUser || identifiedUser.password !== password) {
        return next(new HttpError('Please check your credentials', 401));
    }

    if (identifiedUser.password === password) {
        return res.status(200).json({ message: 'Logged in', user: identifiedUser });
    }
}

const editUserProfile = (req, res, next) => {

}

module.exports = {
    signup,
    login,
    getUserFollowers,
    getUserFollowings,
    editUserProfile,
}