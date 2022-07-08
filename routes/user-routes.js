const express = require('express');
const { check } = require('express-validator')

const { signup, login, getUserFollowers, getUserFollowings, editUserProfile, getAllUsers, followUser, unFollowUser } = require('../controllers/users-controller');
const router = express.Router();

router.get('/', getAllUsers)

router.get('/followers/:uid', getUserFollowers);

router.get('/followings/:uid', getUserFollowings);

router.post('/signup', [check('name').not().isEmpty(), check('email').normalizeEmail().isEmail(), check('password').isLength({ min: 6 })], signup);

router.post('/login', login);

router.patch('/:uid', editUserProfile);

//* :uid is followed user id
router.post('/follow/:uid', followUser);

router.post('/unfollow/:uid', unFollowUser);

module.exports = router;