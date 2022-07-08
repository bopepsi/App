const express = require('express');
const { createReview, getReviewForAppointmentById } = require('../controllers/reviews-controller');
const router = express.Router();

router.post('/', createReview);

router.get('/:aid', getReviewForAppointmentById);

module.exports = router;