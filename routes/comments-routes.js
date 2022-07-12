const express = require('express');
const { getUnreadCommentsByUserId, getCommentsByUserId, getCommentsByPostId, replyToComment, getCommentsByCommentId, createCommentOnPost, likeAComment, unLikeAComment, resetUnreadCommentsAndNotifications } = require('../controllers/comments-controller');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');

router.get('/unread/:uid', checkAuth, getUnreadCommentsByUserId)

router.get('/user/:uid', checkAuth, getCommentsByUserId);

router.get('/post/:pid', getCommentsByPostId);

router.get('/reply/:cid', getCommentsByCommentId);

router.post('/post/:pid', checkAuth, createCommentOnPost);

router.post('/reply/:cid', checkAuth, replyToComment);

router.patch('/like/:cid', checkAuth,likeAComment);

router.patch('/unlike/:cid',checkAuth, unLikeAComment);

router.patch('/reset-unread-comments/:uid',checkAuth, resetUnreadCommentsAndNotifications);

module.exports = router;