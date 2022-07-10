const jwt = require('jsonwebtoken');

const HttpError = require("../models/http-error");

const checkAuth = (req, res, next) => {
    //* Broswer will send an 'OPTION' request before send the real req method, we don't want to block it here
    if (req.method === 'OPTIONS') return next();
    console.log(req.method);
    try {
        //* we allowed authorization header when setting CORES middleware
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            throw new Error('Authentication failed');
        }
        //? If .verify() fails, alsp throws error
        const decodedToken = jwt.verify(token, process.env.SUPER_SECRET);
        req.userData = { userId: decodedToken.userId };
        next();
    } catch (error) {
        return next(new HttpError('Authentication failed', 403));
    }
}

module.exports = checkAuth;