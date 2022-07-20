const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const { getCoordsForAddress, getAddressForCoords } = require('../util/location');
const Post = require('../models/post');
const User = require('../models/user');
const Tag = require('../models/tag');
const { default: mongoose } = require('mongoose');

const getPosts = async (req, res, next) => {
    let posts;
    try {
        posts = await Post.find().populate('creator').sort({ date: -1 });
    } catch (error) {
        return next(new HttpError('Something went wrong', 500));
    };
    if (!posts) {
        const error = new HttpError('Could not fetch posts.', 404);
        return next(error);
    };
    res.json({ posts: posts.map(p => p.toObject({ getters: true })) });
};

const getPostById = async (req, res, next) => {

    const uId = req.params.uid;
    const pId = req.params.pid;
    console.log(uId,pId);
    let user;
    if (uId !== 'NA') {
        try {
            user = await User.findById(uId).populate('interests');
        } catch (error) {
            return next(new HttpError('Something went wrong finding user', 500));
        }
        if (!user) {
            const error = new HttpError('Could not find the user.', 404);
            return next(error);
        };
    }

    let post;
    try {
        post = await Post.findById(pId).populate([{ path: 'creator', model: 'User' }, { path: 'comments', model: 'Comment', populate: { path: 'creator', model: 'User' } }]);
    } catch (error) {
        return next(new HttpError('Something went wrong finding post', 500));
    };
    if (!post) {
        const error = new HttpError('Could not find the post.', 404);
        return next(error);
    };

    if (uId !== 'NA') {
        if (post.tags && post.tags.length > 0) {

            for (let tag of post.tags) {
                let existingTag;
                try {
                    existingTag = await Tag.findOne({ text: tag });
                } catch (error) {
                    return next(new HttpError('Something went wrong', 500));
                }
                let tagExist = user.interests.some(t => t.id === existingTag.id);
                if (!tagExist) {
                    user.interests.push(existingTag.id);
                }
            };
        }

        try {
            await user.save();
        } catch (error) {
            return next(new HttpError('Saving user failed.', 500));
        }

    }

    res.json({ post: post.toObject({ getters: true }) });
};

const getPostsByUserId = async (req, res, next) => {
    const uId = req.params.uid;
    let posts;
    try {
        posts = await Post.find({ creator: uId }).populate('creator');
    } catch (error) {
        return next(new HttpError('Something went wrong', 500));
    };
    if (!posts || posts.length === 0) {
        const error = new Error('Could not find posts for user.');
        error.code = 404;
        return next(error);
    };
    res.json({ posts: posts.map(post => post.toObject({ getters: true })) });
};

const getFollowingsPostByUserId = async (req, res, next) => {
    const uId = req.params.uid;
    let user;
    try {
        user = await User.findById(uId).populate([{ path: 'follows', model: 'User', populate: { path: 'posts', model: 'Post', options: { sort: { 'date': -1 } }, populate: { path: 'creator', model: 'User' } } }]);
    } catch (error) {
        return next(new HttpError('Something went wrong', 500));
    }
    // //* userData was stored in req in check-auth middleware
    // const authUserId = req.userData.userId;
    // //* Change mongoDb Object id type to String, then compare
    // if (user.id !== authUserId) {
    //     return next(new HttpError('You are not authenticated for this action.', 401));
    // }
    if (!user) {
        const error = new Error('Could not find user.');
        error.code = 404;
        return next(error);
    }
    res.json({ user: user.toObject({ getters: true }) });
}

const getPostsByTag = async (req, res, next) => {
    const tag = req.params.tag;
    let existingTag;
    try {
        existingTag = await Tag.findOne({ text: tag }).populate({ path: 'posts', model: 'Post', options: { sort: { 'date': -1 } }, populate: { path: 'creator', model: 'User' } });
    } catch (error) {
        return next(new HttpError('Something went wrong', 500));
    }
    if (!existingTag) {
        return res.json({ posts: [] });
    }
    res.json({ posts: existingTag.posts.map(post => post.toObject({ getters: true })) });
}

const getNearbyPosts = async (req, res, next) => { }

const getRecByUser = async (req, res, next) => {
    const uId = req.params.uid;
    let user;
    try {
        user = await User.findById(uId).populate([{ path: 'interests', model: 'Tag', populate: { path: 'posts', model: 'Post', options: { sort: { 'date': -1 } }, populate: { path: 'creator', model: 'User' } } }]);
    } catch (error) {
        return next(new HttpError('Something went wrong', 500));
    }
    // //* userData was stored in req in check-auth middleware
    // const authUserId = req.userData.userId;
    // //* Change mongoDb Object id type to String, then compare
    // if (user.id !== authUserId) {
    //     return next(new HttpError('You are not authenticated for this action.', 401));
    // }
    if (!user) {
        const error = new Error('Could not find user.');
        error.code = 404;
        return next(error);
    }
    res.json({ user: user.toObject({ getters: true }) });
}

const createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs passed, please check your data.", 422));
    }
    let { title, description, tags, address, creator } = req.body;

    // let image = process.env.SERVER_URL + req.file.path;
    // console.log('creating post')
    // console.log(req.file.path);
    // console.log(req.file);

    console.log(req.file);

    const likes = 0, dislikes = 0, collections = 0, comments = [];

    tags = tags ? tags.split(',') : [];

    let coordinates;
    let formalAddress;
    try {
        const result = await getCoordsForAddress(address);
        coordinates = result.coordinates;
        formalAddress = result.formalAddress;
    } catch (error) {
        return next(error);
    }
    const createdPost = new Post({ title, description, tags, image: req.file.location, likes, dislikes, collections, address: formalAddress, location: coordinates, comments, creator });

    let user;
    try {
        user = await User.findById(creator);
    } catch (error) {
        return next(new HttpError('Oops something is wrong.', 500));
    }

    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    }

    //* Find tag in Tag collection, if no tag, create new tag, if already has a tag, push post to the existing tag collection

    if (tags && tags.length > 0) {

        for (let tag of tags) {
            let existingTag;
            try {
                existingTag = await Tag.findOne({ text: tag })
            } catch (error) {
                return next(new HttpError('Oops something is wrong.', 500));
            }
            if (!existingTag) {
                const newTag = new Tag({ text: tag, posts: [] });
                newTag.posts.push(createdPost);
                await newTag.save();
            }
            else {
                existingTag.posts.push(createdPost);
                await existingTag.save();
            }
        };
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPost.save({ session: sess });
        user.posts.push(createdPost);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, creating post failed.', 500));
    }
    res.status(201).json({ createdPost });
};

const updatePost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError("Invalid inputs passed, please check your data.", 422));
    }
    const { title, description, image, tags, likePost, dislikePost, addToCollection, removeFromCollection, addComment, commentMessage } = req.body;
    const postId = req.params.pid;

    let post;
    try {
        post = await Post.findById(postId).exec();
    } catch (error) {
        return next(new HttpError('Something went wrong when fecthing post', 500));
    };
    if (!post) {
        const error = new HttpError('Could not find the post.', 404);
        return next(error);
    };
    post.title = title;
    post.description = description;
    post.image = image;
    post.tags = tags;
    try {
        await post.save();
    } catch (error) {
        return next(new HttpError('Something went wrong when saving post', 500));
    }
    res.status(200).json({ post: post.toObject({ getters: true }) });
}

const addPostToLikes = async (req, res, next) => {
    const postId = req.params.pid;
    const userId = req.params.uid;
    //* find post
    let post;
    try {
        post = await Post.findById(postId).populate('likedBy creator');
    } catch (error) {
        return next(new HttpError('Something went wrong when fecthing post', 500));
    };
    if (!post) {
        const error = new HttpError('Could not find the post.', 404);
        return next(error);
    };

    //* add post to user's likedPosts
    post.likes = post.likes + 1;
    post.creator.likes = post.creator.likes + 1;
    let user;
    try {
        user = await User.findById(userId).populate('likedPosts');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    }
    if (!user) {
        return next(new HttpError('Could not find user.', 422));
    }
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        post.likedBy.push(user);
        await post.save({ session: sess });
        user.likedPosts.push(post);
        await post.creator.save({ session: sess });
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops something is wrong, could not like this post.'), 500);
    };

    res.status(201).json({ message: 'Post added to fav.' });

};

const removePostFromLikes = async (req, res, next) => {
    const postId = req.params.pid;
    const userId = req.params.uid;
    //* find post
    let post;
    try {
        post = await Post.findById(postId).populate('likedBy creator');
    } catch (error) {
        return next(new HttpError('Something went wrong when fecthing post', 500));
    };
    if (!post) {
        const error = new HttpError('Could not find the post.', 404);
        return next(error);
    };

    //* remove post from user's likedPosts
    post.likes = post.likes - 1;
    post.creator.likes = post.creator.likes - 1;
    let user;
    try {
        user = await User.findById(userId).populate('likedPosts');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    }
    if (!user) {
        return next(new HttpError('Could not find user.', 422));
    }
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        post.likedBy.pull(user);
        await post.save({ session: sess });
        user.likedPosts.pull(post);
        await post.creator.save({ session: sess });
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops something is wrong, could not like this post.'), 500);
    };

    res.status(201).json({ message: 'Post removed from fav.' });
};

const dislikePost = async (req, res, next) => {
    const postId = req.params.pid;
    //* find post
    let post;
    try {
        post = await Post.findById(postId);
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    }
    post.dislikes = post.dislikes + 1;
    try {
        await post.save();
    } catch (error) {
        return next(new HttpError('Something went wrong when saving post', 500));
    }
    res.status(200).json({ message: 'Post disliked.' });
}

//! Need to work on comments relationship with post later
const addComment = async (req, res, next) => {
    const { comments } = req.body;
    const postId = req.params.pid;

    if (!comments || comments.trim().length === 0) {
        return next(new HttpError('Please check you input'), 422);
    }

    let post;
    try {
        post = await Post.findById(postId).exec();
    } catch (error) {
        return next(new HttpError('Something went wrong when fecthing post', 500));
    };
    if (!post) {
        const error = new HttpError('Could not find the post.', 404);
        return next(error);
    };

    post.comments.push(comments);

    try {
        await post.save();
    } catch (error) {
        return next(new HttpError('Something went wrong when saving post', 500));
    }
    res.status(200).json({ post: post.toObject({ getters: true }) });
}

const deletePost = async (req, res, next) => {
    const postId = req.params.pid;
    let post;
    try {
        post = await Post.findById(postId).populate('creator');
    } catch (error) {
        return next(new HttpError('Oops, some thing went wrong when fetching during deleting', 500));
    }

    if (!post) {
        return next(new HttpError('Could not find post.', 404));
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await post.remove({ session: sess });
        post.creator.posts.pull(post);
        await post.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops, some thing went wrong when deleting', 500));
    }
    res.status(200).json({ message: 'Post deleted.' });
}

module.exports = {
    getPosts,
    getPostById,
    getPostsByUserId,
    getPostsByTag,
    getNearbyPosts,
    getFollowingsPostByUserId,
    createPost,
    updatePost,
    dislikePost,
    addComment,
    deletePost,
    addPostToLikes,
    removePostFromLikes,
    getRecByUser
}