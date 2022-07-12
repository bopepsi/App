const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const HttpError = require('../models/http-error');
const { default: mongoose } = require('mongoose');


const getCommentsByUserId = async (req, res, next) => {
    let userId = req.params.uid;
    //* get user then populate comments and return json data
    let user;
    try {
        user = await User.findById(userId).populate('comments');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!user) {
        return next(new HttpError('Could not find user.', 422));
    };

    res.status(201).json({ comments: user.comments.map(c => c.toObject({ getters: true })) });
}
// post = await Post.findById(pId).populate([{ path: 'creator', model: 'User' }, { path: 'comments', model: 'Comment', populate: { path: 'creator', model: 'User' } }])
const getCommentsByPostId = async (req, res, next) => {
    let postId = req.params.pid;
    //* get post then populate comments and return json data
    let post;
    try {
        post = await Post.findById(postId).populate({ path: 'comments', model: 'Comment', populate: { path: 'creator', model: 'User' } });
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!post) {
        return next(new HttpError('Could not find post.', 422));
    };

    res.status(201).json({ comments: post.comments.map(c => c.toObject({ getters: true })) });
}

const getCommentsByCommentId = async (req, res, next) => {
    let commentId = req.params.cid;
    //* get comment then populate comments and return json data
    let comment;
    try {
        comment = await Comment.findById(commentId).populate({ path: 'replies', model: 'Comment', populate: { path: 'creator', model: 'User' } });
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!comment) {
        return next(new HttpError('Could not find comment.', 422));
    };

    res.status(201).json({ comments: comment.replies.map(c => c.toObject({ getters: true })) });
}

const createCommentOnPost = async (req, res, next) => {
    let postId = req.params.pid;
    let { text, creator } = req.body;
    //* create new comment instance
    console.log(text, creator);
    const newComment = new Comment({ text, likes: 0, likedBy: [], creator, replies: [] });
    //* find creator
    let user;
    try {
        user = await User.findById(creator).populate('comments');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    //* find post
    let post;
    try {
        post = await Post.findById(postId).populate('comments creator');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    post.creator.unreadNotifications = post.creator.unreadNotifications + 1;
    post.creator.unreadComments.push(newComment);
    console.log(post.creator);
    //* save new comment, update post comments and user comments arr and increase post owner's unreadNotification by one
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await newComment.save({ session: sess });
        user.comments.push(newComment);
        await user.save({ session: sess });
        post.comments.push(newComment);
        await post.save({ session: sess });
        await post.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, creating comment failed.', 500));
    };
    res.status(201).json({ message: 'Comments added.', comment: newComment.toObject({ getters: true }) });
}

const replyToComment = async (req, res, next) => {
    const commentId = req.params.cid;
    const { text, creator } = req.body;
    const newReply = new Comment({ text, likes: 0, creator, replies: [] });
    //* find creator
    let user;
    try {
        user = await User.findById(creator).populate('comments');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    //* find comment
    let comment;
    try {
        comment = await Comment.findById(commentId).populate('creator replies');
    } catch {
        return next(new HttpError('Oops something went wrong.', 500));
    }
    comment.creator.unreadNotifications = comment.creator.unreadNotifications + 1;
    comment.creator.unreadComments.push(newReply);
    //* update comment replies, creator comments list and save all
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await newReply.save({ session: sess });
        user.comments.push(newReply);
        await user.save({ session: sess });
        comment.replies.push(newReply);
        await comment.save({ session: sess });
        await comment.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, creating comment failed.', 500));
    };
    res.status(201).json({ message: 'Reply added.', comments: comment.replies.map(c => c.toObject({ getters: true })) });

}

const likeAComment = async (req, res, next) => {
    const commentId = req.params.cid;
    const { userId } = req.body;
    //* find comment
    let comment;
    try {
        comment = await Comment.findById(commentId).populate('likedBy');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!comment) {
        return next(new HttpError('Could not find comment', 422));
    };

    comment.likes = comment.likes + 1;
    comment.likedBy.push(userId);

    console.log(comment)

    try {
        await comment.save();
    } catch (error) {
        return next(new HttpError('Oops something went wrong, could not like this comment.', 500));
    }

    res.status(201).json({ message: 'Liked comment.', comment: comment.toObject({ getters: true }) });
}

const unLikeAComment = async (req, res, next) => {
    const commentId = req.params.cid;
    const { userId } = req.body;
    //* find comment
    let comment;
    try {
        comment = await Comment.findById(commentId).populate('likedBy');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!comment) {
        return next(new HttpError('Could not find comment', 422));
    };

    //* update likes and liked by
    comment.likes = comment.likes - 1;
    comment.likedBy.pull(userId);

    console.log(comment)

    try {
        await comment.save();
    } catch (error) {
        return next(new HttpError('Oops something went wrong, could not unlike this comment.', 500));
    }

    res.status(201).json({ message: 'un-Liked comment.', comment: comment.toObject({ getters: true }) });
}

const resetUnreadCommentsAndNotifications = async (req, res, next) => {
    let userId = req.params.uid;
    //* find user
    let user;
    try {
        user = await User.findById(userId);
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!user) {
        return next(new HttpError('Could not find user', 422));
    };

    user.unreadNotifications = 0;
    user.unreadComments = [];

    try {
        await user.save();
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };

    res.status(201).json('Unread comments reset');
}

module.exports = {
    getCommentsByUserId,
    getCommentsByPostId,
    getCommentsByCommentId,
    createCommentOnPost,
    replyToComment,
    likeAComment,
    unLikeAComment,
    resetUnreadCommentsAndNotifications,
}