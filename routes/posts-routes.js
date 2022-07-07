const express = require('express');
const { getPostById, getPostsByUserId, createPost, updatePost, deletePost } = require('../controllers/posts-controller');

const router = express.Router();

router.get('/:pid', getPostById);

router.get('/user/:uid', getPostsByUserId);

router.post('/', createPost);

router.patch('/:pid', updatePost);

router.delete('/:pid', deletePost);

module.exports = router;