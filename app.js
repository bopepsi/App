const express = require('express');
const bodyParser = require('body-parser');

const postsRoutes = require('./routes/posts-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

//? Parsing incoming body and extract json data
app.use(bodyParser.json());

app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);

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

app.listen(5000);