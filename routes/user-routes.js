const express = require('express');
const { check } = require('express-validator')

const { signup, login, getUserFollowers, getUserFollowings, editUserProfile, getAllUsers } = require('../controllers/users-controller');
const router = express.Router();

router.get('/', getAllUsers)

router.get('/followers/:uid', getUserFollowers);

router.get('/followings/:uid', getUserFollowings);

router.post('/signup', [check('name').not().isEmpty(), check('email').normalizeEmail().isEmail(), check('password').isLength({ min: 6 })], signup);

router.post('/login', login);

router.patch('/:uid', editUserProfile);

module.exports = router;