const express = require('express');
const { getPostsByCid, getCollectionsByUid, createCollection, addPostToCollection, removePostFromCollection, editCollection, deleteCollection } = require('../controllers/collections-controller');
const router = express.Router();

router.get('/:uid', getCollectionsByUid);

router.get('/posts/:cid', getPostsByCid);

router.post('/', createCollection);

router.patch('/add/:cid/:pid', addPostToCollection);

router.patch('/remove/:cid/:pid', removePostFromCollection);

router.patch('/:cid', editCollection);

router.delete('/:cid', deleteCollection);

module.exports = router;