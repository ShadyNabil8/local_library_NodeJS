const passport = require("passport");
const asyncHandler = require("express-async-handler");
const User = require('../models/user');
const { body, validationResult } = require("express-validator");

exports.user_register_get = asyncHandler(async (req, res, next) => {
    res.render('register')
});
exports.user_register_post = [
    body('username', 'username must be not empty')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('password', 'password must be not empty')
        .trim()
        .escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('register', {
                errors: errors.array()
            })
        }
        else {
            // Check if the username already exist
            const sameUser = await User.findOne({ username: req.body.username }).exec();
            if (sameUser) {
                return res.render('register', {
                    errors: [{ msg: "Username already used" }]
                });
            }
            const newUser = User({
                username: req.body.username,
                hash: req.body.password,
            });
            await newUser.save();
            res.redirect('/users/login')
        }
    })
]

exports.user_login_get = asyncHandler(async (req, res, next) => {
    res.render('login')
});
exports.user_login_post = asyncHandler(async (req, res, next) => {
    // After authentication, passport: { user: 'some id' } is added to session object in req
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(400).render('login', { errors: [{ msg: info.message }] })
        }
        // When a user successfully logs in, Passport.js serializes the user information into the session.
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            const redirectTo = req.query.redirect || '/catalog';
            res.redirect(redirectTo);
        });
    })(req, res, next); // Invoke the middleware function with req, res, next
})



module.exports.ensureAuthenticated = function (req, res, next) {
    if (req.path === '/users/login' || req.path === '/users/register')
        return next();
    /*
     * Here session object has beed already created inside req but without passport: { user: 'some id' }  inside session onject
     * passport: { user: 'some id' } needed by passport to see if the user is authenticated or not
     */
    if (req.isAuthenticated()) {
        return next();
    }
    // Encodes a text string as a valid component of a Uniform Resource Identifier (URI).
    const redirectUrl = encodeURIComponent(req.originalUrl); // /catalog/books => %2Fcatalog%2Fbooks
    res.redirect(`/users/login?redirect=${redirectUrl}`);
};
