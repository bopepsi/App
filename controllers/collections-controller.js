const { default: mongoose } = require('mongoose');
const Collection = require('../models/collection');
const User = require('../models/user');
const Post = require('../models/post');
const HttpError = require('../models/http-error');

const getPostsByCid = async (req, res, next) => {
    const cId = req.params.cid;
    let collection;
    try {
        collection = await Collection.findById(cId).populate('posts');
    } catch (error) {
        return next(new HttpError('Oops something is wrong.', 500));
    }

    if (!collection) {
        return next(new HttpError('Could not find Collection by User.', 404));
    }
    res.status(201).json({ posts: collection.posts.map(c => c.toObject({ getters: true })) });
}

const getCollectionsByUid = async (req, res, next) => {
    const uId = req.params.uid;
    //* find user then populate collections

    let collections;
    try {
        collections = await Collection.find({ creator: uId }).populate('posts');
    } catch (error) {
        return next(new HttpError('Oops something is wrong.', 500));
    }

    if (!collections) {
        return next(new HttpError('Could not find Collection by User.', 404));
    }
    // let user;
    // try {
    // } catch (error) {
    //     user = await User.findById(uId).populate('collections');
    //     return next(new HttpError('Oops something is wrong.', 500));
    // };
    // if (!user) {
    //     return next(new HttpError('Could not find user.', 404));
    // };
    res.status(201).json({ collections: collections.map(c => c.toObject({ getters: true })) });
};
//! fix creator later
const createCollection = async (req, res, next) => {
    const { title, creator } = req.body;
    //* create new collection instance
    let newCollection = new Collection({ title, posts: [], creator });

    //* find user
    let user;
    try {
        user = await User.findById(creator);
    } catch (error) {
        return next(new HttpError('Oops something is wrong.', 500));
    };
    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    };

    //* save collection and update user
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
    //* remove post ObjectId from collection's posts arr and decrease post collections by one
    post.collections = Number(post.collections) - 1;
    console.log(post.collections);
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await post.save({ session: sess });
        collection.posts.pull(post);
        await collection.save({ session: sess })
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Could not remove post from collection.', 500));
    }

    res.json({ message: 'Post removed from collection.' });
}

const editCollection = async (req, res, next) => {
    const cId = req.params.cid;
    const { title } = req.body;
    //* find collection
    let collection;
    try {
        collection = await Collection.findById(cId);
    } catch (error) {
        return next(new HttpError('Could not find collection.', 404));
    }
    if (!collection) {
        return next(new HttpError('Could not find collection.', 404));
    }
    //* edit collection and save
    collection.title = title;
    try {
        await collection.save();
    } catch (error) {
        return next(new HttpError('Could not update collection.', 500));
    }
    res.json({ collection: collection.toObject({ getters: true }) });
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
    console.log(collection);
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await collection.remove({ session: sess });
        collection.creator.collections.pull(collection);
        await collection.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Oops something went wrong, could not delete collection.', 500));
    };
    res.status(200).json({ message: 'Collection deleted.' });
}

module.exports = {
    getPostsByCid,
    getCollectionsByUid,
    createCollection,
    addPostToCollection,
    removePostFromCollection,
    editCollection,
    deleteCollection
}