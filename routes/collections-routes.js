const express = require('express');
const { getCollectionsByUid, createCollection, addPostToCollection, removePostFromCollection, editCollection, deleteCollection } = require('../controllers/collections-controller');
const router = express.Router();

router.get('/', getCollectionsByUid);

router.post('/', createCollection);

router.patch('/add/:cid/:pid', addPostToCollection);

router.patch('/remove/:cid/:pid', removePostFromCollection);

router.patch('/:cid', editCollection);

router.delete('/:cid', deleteCollection);

module.exports = router;