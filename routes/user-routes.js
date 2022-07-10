const express = require('express');
const { check } = require('express-validator');
const fileUpload = require('../middleware/avatar-upload');
const checkAuth = require('../middleware/check-auth');

const { signup, login, getUserFollowers, getUserFollowings, editUserProfile, getAllUsers, followUser, unFollowUser } = require('../controllers/users-controller');
const router = express.Router();

router.get('/', getAllUsers)

router.get('/followers/:uid', getUserFollowers);

router.get('/followings/:uid', getUserFollowings);

router.post('/signup', fileUpload.single('image'), [check('name').not().isEmpty(), check('email').normalizeEmail().isEmail(), check('password').isLength({ min: 6 })], signup);

router.post('/login', login);

router.patch('/:uid', fileUpload.single('image'), checkAuth, editUserProfile);

//* :uid is followed user id
router.post('/follow/:uid', checkAuth, followUser);

router.post('/unfollow/:uid', checkAuth, unFollowUser);

module.exports = router;