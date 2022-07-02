const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    age: { type: Number, required: true },
    bio: { type: String, required: true, minlength: 6 },
    image: { type: String, required: true },
    backgroundImage: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    //? One user may have many places, collections
    posts: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }],
    collections: [{ type: mongoose.Types.ObjectId, required: true, ref: "Collection" }]
});

//? WIth unique, we can query form db as fast as possible.
//? With uniqueValidator, we make sure we can only create user if email doesnot exist.
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema)

