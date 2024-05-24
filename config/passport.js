const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user')
passport.use(
    new LocalStrategy({
        usernameField: "username",
        passwordField: "password"
    },
        // This function is called when the `passport.authenticate()` method is called.
        function (username, password, done) {
            User.findOne({ username: username })
                .then((user) => {
                    if (!user) {
                        return done(null, false);
                    }
                    const isValid = user.validatePassword(password);
                    if (isValid) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                })
                .catch((err) => {
                    done(err);
                });
        })
);

// Set the user id into the cooki header
passport.serializeUser((user, done) => {
    done(null, user.id);
});
// Get the user form the session store
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        return done(null, user);
    } catch (error) {
        return done(error);
    }
});

