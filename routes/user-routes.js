const express = require('express');
const { check } = require('express-validator');
const fileUpload = require('../middleware/avatar-upload');
const checkAuth = require('../middleware/check-auth');

const upload = require('../services/aws-upload');
const singleUpload = upload.single('image');

const { signup, login, getUserFollowers, getUserFollowings, editUserProfile, getAllUsers, followUser, unFollowUser, getUserById, changeBackgroundImage, changeUserImage } = require('../controllers/users-controller');
const router = express.Router();

router.get('/', getAllUsers);

router.get('/:uid', getUserById);

router.get('/followers/:uid', getUserFollowers);

router.get('/followings/:uid', getUserFollowings);

// router.post('/signup', fileUpload.single('image'), [check('name').not().isEmpty(), check('email').normalizeEmail().isEmail(), check('password').isLength({ min: 6 })], signup);
router.post('/signup', singleUpload, [check('name').not().isEmpty(), check('email').normalizeEmail().isEmail(), check('password').isLength({ min: 6 })], signup);

router.post('/login', login);

// router.patch('/:uid', fileUpload.single('image'), checkAuth, editUserProfile);
router.patch('/:uid', checkAuth, editUserProfile);

//* Change background image
// router.patch('/background/:uid', fileUpload.single('image'), checkAuth, changeBackgroundImage);
router.patch('/background/:uid', singleUpload, checkAuth, changeBackgroundImage);

//* Change user image
// router.patch('/image/:uid', fileUpload.single('image'), checkAuth, changeUserImage);
router.patch('/image/:uid', singleUpload, checkAuth, changeUserImage);

//* :uid is followed user id
router.post('/follow/:uid', checkAuth, followUser);

router.post('/unfollow/:uid', checkAuth, unFollowUser);

module.exports = router;