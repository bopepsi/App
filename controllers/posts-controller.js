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

const getPostsByUserId = (req, res, next) => {
    const uId = req.params.uid;
    console.log('This is userId in req: ', uId);
    const posts = DUMMY_POSTS.filter((post) => post.creator === uId);
    if (!posts || posts.length === 0) {
        const error = new Error('Could not find posts for user.');
        error.code = 404;
        return next(error);
    };
    res.json({ posts });
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
    try {
        const result = await getCoordsForAddress(address);
        coordinates = result.coordinates;
        formalAddress = result.formalAddress;
    } catch (error) {
        return next(error);
    }
    const createdPost = new Post({ title, description, tags, image, likes, dislikes, collections, address, location: coordinates, comments, creator });
    try {
        await createdPost.save();
    } catch (error) {
        return next(new HttpError('Oops, creating post failed', 500));
    }
    res.status(201).json({ createdPost });
};

const updatePost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid inputs passed, please check your data.", 422));
    }
    const { title, description, image, tags } = req.body;
    const postId = req.params.pid;
    const updatedPost = { ...DUMMY_POSTS.find(post => post.id === postId) };
    const postIndex = DUMMY_POSTS.findIndex(post => post.id === postId);
    updatedPost.title = title;
    updatedPost.description = description;
    updatedPost.image = image;
    updatedPost.tags = tags;
    DUMMY_POSTS[postIndex] = updatedPost;
    res.status(200).json({ post: updatedPost });
}

const deletePost = (req, res, next) => {
    const postId = req.params.pid;
    if (!DUMMY_POSTS.find(p => p.id === postId)) {
        return next(new HttpError('Could not find the place.', 404));
    }
    DUMMY_POSTS = DUMMY_POSTS.filter(post => post.id !== postId);
    res.status(200).json({ message: 'Post deleted.' });
}

module.exports = {
    getPostById,
    getPostsByUserId,
    createPost,
    updatePost,
    deletePost,
}