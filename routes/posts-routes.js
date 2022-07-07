const express = require('express');
const { check } = require('express-validator');

const { getPostById, getPostsByUserId, createPost, updatePost, deletePost } = require('../controllers/posts-controller');

const router = express.Router();

router.get('/:pid', getPostById);

router.get('/user/:uid', getPostsByUserId);

//* Check req body, then handler error in the controller if any
router.post('/', [check('title').not().isEmpty(), check('description').isLength({ min: 1 }), check('image').not().isEmpty()], createPost);

router.patch('/:pid', [check('title').not().isEmpty(), check('description').isLength({ min: 1 }), check('image').not().isEmpty()], updatePost);

router.delete('/:pid', deletePost);

module.exports = router;