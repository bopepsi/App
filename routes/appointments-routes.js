const express = require('express');
const { getAppointmentsByUserId, createAppointment, acceptInvitation, rejectInvitation } = require('../controllers/appointments-controller');
const router = express.Router();

router.get('/:uid', getAppointmentsByUserId);

router.post('/', createAppointment);

router.post('/accept', acceptInvitation);

router.post('/reject', rejectInvitation);

module.exports = router;