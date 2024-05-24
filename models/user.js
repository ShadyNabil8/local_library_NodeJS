const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema

var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    salt: {
        type: String,
    },
})

// Pre-save middleware to hash the password
UserSchema.pre('save', async function (next) {
    /*
    * Never write code like this
    * await bcrypt.hash(this.hash, salt, function (err, hash) {
    *   this.hsah = hash;
    * }
    * Because `this` context inside the bcrypt.genSalt and bcrypt.hash callbacks does not refer to the schema object anymore.
    * bcrypt Async methods that accept a callback, return a Promise when callback is not specified if Promise support is available.
    * To ensure that this inside these callbacks refers to the Mongoose document, you can use an arrow function, which captures the this value of the enclosing context.
    * However, it's cleaner to use async/await to avoid dealing with the context binding issues.
    */
    try {
        this.salt = await bcrypt.genSalt(10);
        this.hash = await bcrypt.hash(this.hash, this.salt);
        next();
    } catch (error) {
        next(error);
    }
});

UserSchema.methods.validatePassword = function (password) {
    /*
    * t's generally a good practice to avoid returning null for error handling in cases where a boolean is expected.
    * Instead, you can either return false or rethrow the error if you want to handle it at a higher level.
    */
    try {
        const result = bcrypt.compareSync(password, this.hash);
        return result;
    } catch (error) {
        //return null;
        return false;
    }
};

module.exports = mongoose.model("User", UserSchema);