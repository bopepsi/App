const express = require('express');
const { createReview, getReviewForAppointmentById, getReviewsByUserId } = require('../controllers/reviews-controller');
const router = express.Router();

router.post('/', createReview);

router.get('/:aid', getReviewForAppointmentById);

router.get('/user/:uid', getReviewsByUserId);

module.exports = router;