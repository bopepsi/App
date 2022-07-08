const { default: mongoose } = require('mongoose');
const Collection = require('../models/collection');
const User = require('../models/user');
const Post = require('../models/post');
const HttpError = require('../models/http-error');

const getCollectionsByUid = async (req, res, next) => {
    const uId = req.params.uid;
    let user;
    try {
        user = await User.findById(uId).populate('collections');
    } catch (error) {
        return next(new HttpError('Oops something is wrong.', 500));
    };
    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    };
    res.status(201).json({ collections: user.collections.map(c => c.toObject({ getters: true })) });
};
//! fix creator later
const createCollection = async (req, res, next) => {
    const { title, creator } = req.body;

    let newCollection = new Collection({ title, posts: [], creator });

    let user;
    try {
        user = await User.findById(creator);
    } catch (error) {
        return next(new HttpError('Oops something is wrong.', 500));
    };
    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    };

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await newCollection.save({ session: sess });
        user.collections.push(newCollection);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops something is wrong, could not create collection'), 500);
    }

    res.status(201).json({ message: 'Collection created.', newCollection: newCollection.toObject({ getters: true }) });
}

const addPostToCollection = async (req, res, next) => {
    const { cid, pid } = req.params;
    console.log(cid, pid);
    //* get collection
    let collection;
    try {
        collection = await Collection.findById(cid).populate('posts');
    } catch (error) {
        return next(new HttpError('Oops something is wrong.', 500));
    }
    if (!collection) {
        return next(new HttpError('Could not find collection.', 404));
    }
    //* get post
    let post;
    try {
        post = await Post.findById(pid);
    } catch (error) {
        return next(new HttpError('Oops something is wrong.', 500));
    }
    if (!post) {
        return next(new HttpError('Could not find post.', 404));
    }
    //* add post ObjectId to collection's posts arr and increase post collections by one
    post.collections = Number(post.collections) + 1;
    console.log(post.collections);
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await post.save({ session: sess });
        collection.posts.push(post);
        await collection.save({ session: sess })
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Could not add post to collection.', 500));
    }

    res.json({ message: 'Post added to collection.' });
}

const removePostFromCollection = async (req, res, next) => {

}

const editCollection = async (req, res, next) => {

}

const deleteCollection = async (req, res, next) => {
    const cId = req.params.cid;
    let collection;
    try {
        collection = await Collection.findById(cId).populate('creator');
    } catch (error) {
        return next(new HttpError('Oops something went wrong.', 500));
    };
    if (!collection) {
        return next(new HttpError('Could not find collection.', 404));
    };
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await collection.remove({ session: sess });
        collection.creator.collections.pull(post);
        await collection.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops something went wrong, could not delete collection.', 500));
    };
    res.status(200).json({ message: 'Collection deleted.' });
}

module.exports = {
    getCollectionsByUid,
    createCollection,
    addPostToCollection,
    removePostFromCollection,
    editCollection,
    deleteCollection
}