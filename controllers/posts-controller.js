const HttpError = require('../models/http-error');
const uuid = require('uuid');
const { validationResult } = require('express-validator');
const { getCoordsForAddress, getAddressForCoords } = require('../util/location');
const Post = require('../models/post');

let DUMMY_POSTS = [
    {
        id: 'p1',
        title: 'Funny cats',
        description: 'hahahaha',
        tags: ['cat'],
        image: 'imgURL',
        likes: 10,
        dislikes: 2,
        collections: 0,
        location: {
            lat: 122,
            lng: 200
        },
        date: '2022-06-01',
        comments: [],
        creator: 'bob'
    },
    {
        id: 'p2',
        title: 'Crazy max',
        description: 'hahahaha',
        tags: ['max'],
        image: 'imgURL',
        likes: 100,
        dislikes: 21,
        collections: 4,
        location: {
            lat: 112,
            lng: 253
        },
        date: '2022-06-21',
        comments: [],
        creator: 'max'
    },
    {
        id: 'p3',
        title: 'No WAY!',
        description: 'hahahaha',
        tags: ['crazy'],
        image: 'imgURL',
        likes: 1000,
        dislikes: 2,
        collections: 69,
        location: {
            lat: 56,
            lng: 96
        },
        date: '2022-06-30',
        comments: [],
        creator: 'max'
    },
]


const getPostById = async (req, res, next) => {
    const pId = req.params.pid;
    console.log('This is postId in req: ', pId);
    let post;
    try {
        post = await Post.findById(pId).exec();
    } catch (error) {
        return next(new HttpError('Something went wrong', 500));
    };
    if (!post) {
        const error = new HttpError('Could not find the post.', 404);
        return next(error);
    };
    res.json({ post: post.toObject({ getters: true }) });
};

const getPostsByUserId = async (req, res, next) => {
    const uId = req.params.uid;
    console.log('This is userId in req: ', uId);
    let posts;
    try {
        posts = await Post.find({ creator: uId }).exec();
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

const createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid inputs passed, please check your data.", 422));
    }
    let { title, description, tags, image, address, creator } = req.body;
    const likes = 0, dislikes = 0, collections = 0, comments = [];
    tags = tags ? tags : [];
    let coordinates;
    let formalAddress;
    try {
        const result = await getCoordsForAddress(address);
        coordinates = result.coordinates;
        formalAddress = result.formalAddress;
    } catch (error) {
        return next(error);
    }
    const createdPost = new Post({ title, description, tags, image, likes, dislikes, collections, address:formalAddress, location: coordinates, comments, creator });
    try {
        await createdPost.save();
    } catch (error) {
        return next(new HttpError('Oops, creating post failed', 500));
    }
    res.status(201).json({ createdPost });
};

const updatePost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
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

const likeOrDislkePost = async (req, res, next) => {
    const { like, dislike } = req.body;
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
    if (like) {
        post.likes = post.likes + 1;
    }
    if (dislike) {
        post.dislikes = post.dislikes + 1;
    }
    try {
        await post.save();
    } catch (error) {
        return next(new HttpError('Something went wrong when saving post', 500));
    }
    res.status(200).json({ post: post.toObject({ getters: true }) });
}

const addOrRemovePostFromCollection = async (req, res, next) => {
    const { addToCollection, removeFromCollection } = req.body;
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
    if (addToCollection) {
        post.collections = post.collections + 1;
    }
    if (removeFromCollection) {
        post.collections = post.collections - 1;
    }
    try {
        await post.save();
    } catch (error) {
        return next(new HttpError('Something went wrong when saving post', 500));
    }
    res.status(200).json({ post: post.toObject({ getters: true }) });
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
        post = await Post.findById(postId);
    } catch (error) {
        return next(new HttpError('Oops, some thing went wrong when fetching during deleting', 500));
    }
    try {
        await post.remove();
    } catch (error) {
        return next(new HttpError('Oops, some thing went wrong when deleting', 500));
    }
    res.status(200).json({ message: 'Post deleted.' });
}

module.exports = {
    getPostById,
    getPostsByUserId,
    createPost,
    updatePost,
    likeOrDislkePost,
    addOrRemovePostFromCollection,
    addComment,
    deletePost,
}