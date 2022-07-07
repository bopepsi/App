const HttpError = require('../models/http-error');
const uuid = require('uuid');

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


const getPostById = (req, res, next) => {
    const pId = req.params.pid;
    console.log('This is postId in req: ', pId);
    const post = DUMMY_POSTS.find((post) => post.id === pId);
    if (!post) {
        const error = new HttpError('Could not find the post.', 404);
        return next(error);
    };
    res.json({ post });
};

const getPostsByUserId = (req, res, next) => {
    const uId = req.params.uid;
    console.log('This is userId in req: ', uId);
    const posts = DUMMY_POSTS.filter((post) => post.creator === uId);
    if (!posts) {
        const error = new Error('Could not find posts for user.');
        error.code = 404;
        return next(error);
    };
    res.json({ posts });
};

const createPost = (req, res, next) => {
    const { title, description, tags, image, location, creator } = req.body;
    const createdPost = {
        id: uuid.v4(), title, description, tags, image, location, creator
    }
    DUMMY_POSTS.push(createdPost);
    res.status(201).json({ createdPost });
};

const updatePost = (req, res, next) => {
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