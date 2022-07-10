require('dotenv').config();
// console.log(process.env)
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const postsRoutes = require('./routes/posts-routes');
const userRoutes = require('./routes/user-routes');
const collectionsRoutes = require('./routes/collections-routes');
const commentsRoutes = require('./routes/comments-routes');
const appointmentsRoutes = require('./routes/appointments-routes');
const reviewsRoutes = require('./routes/reviews-routes');
const HttpError = require('./models/http-error');

const app = express();

//? Parsing incoming body and extract json data
app.use(bodyParser.json());


//* Provide access to images, express.static() ==> just return it, don't process.
app.use('/uploads/avatars', express.static(path.join('uploads', 'avatars')));
app.use('/uploads/posts', express.static(path.join('uploads', 'posts')));
app.use('/uploads/default', express.static(path.join('uploads', 'default')));

//* CORES
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With , Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
})

app.use('/api/posts', postsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/reviews', reviewsRoutes);

app.use((req, res, next) => {
    next(new HttpError('Route not exist', 404));
    return;
});

app.use((error, req, res, next) => {

    if (req.file) {
        fs.unlink(req.file.path, (err) => { console.log(err) });
    }

    if (res.headerSent) {
        return next(error);
    }

    //* Set error code
    res.status(error.code || 500);
    res.json({ message: error.message || 'An error occurred!' });
})

mongoose
    .connect(process.env.MONGODB_API)
    .then(() => app.listen(5000))
    .catch(err => console.log(err))
