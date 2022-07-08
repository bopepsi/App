require('dotenv').config();
// console.log(process.env)
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const postsRoutes = require('./routes/posts-routes');
const userRoutes = require('./routes/user-routes');
const collectionsRoutes = require('./routes/collections-routes');
const commentsRoutes = require('./routes/comments-routes');
const appointmentsRoutes = require('./routes/appointments-routes');
const HttpError = require('./models/http-error');

const app = express();

//? Parsing incoming body and extract json data
app.use(bodyParser.json());

app.use('/api/posts', postsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/appointments', appointmentsRoutes);

app.use((req, res, next) => {
    next(new HttpError('Route not exist', 404));
    return;
});

app.use((error, req, res, next) => {
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
