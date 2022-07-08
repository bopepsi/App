const express = require('express');
const { getAppointmentsByUserId, createAppointment, acceptInvitation, rejectInvitation, getInvitationsByUserId } = require('../controllers/appointments-controller');
const router = express.Router();

router.get('/:uid', getAppointmentsByUserId);

router.get('/invitations/:uid', getInvitationsByUserId);

router.post('/', createAppointment);

router.post('/accept', acceptInvitation);

router.post('/reject', rejectInvitation);

module.exports = router;