const express = require('express');
const { getCommentsByUserId, getCommentsByPostId, replyToComment, getCommentsByCommentId, createCommentOnPost, likeAComment, unLikeAComment, resetUnreadCommentsAndNotifications } = require('../controllers/comments-controller');
const router = express.Router();

router.get('/user/:uid', getCommentsByUserId);

router.get('/post/:pid', getCommentsByPostId);

router.get('/reply/:cid', getCommentsByCommentId);

router.post('/post/:pid', createCommentOnPost);

router.post('/reply/:cid', replyToComment);

router.patch('/like/:cid', likeAComment);

router.patch('/unlike/:cid', unLikeAComment);

router.patch('/reset-unread-comments/:uid', resetUnreadCommentsAndNotifications);

module.exports = router;