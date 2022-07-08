const { default: mongoose } = require('mongoose');
const Collection = require('../models/collection');
const User = require('../models/user');
const HttpError = require('../models/http-error');

const getCollectionsByUid = async (req, res, next) => {

}
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
    res.json({ cid, pid });
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