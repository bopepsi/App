const { json } = require('body-parser');
const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    console.log('Get users');
    res.json({ message: 'success' });
});

module.exports = router;