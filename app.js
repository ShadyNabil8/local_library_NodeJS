const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require("express-session");
// User Authentication
const passport = require("passport");
const MongoStore = require("connect-mongo");
const { ensureAuthenticated } = require('./controllers/userController'); // Import the authentication middleware
require('./config/passport');
// ---
require('dotenv').config()

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');
const userRouter = require('./routes/users');

const { log } = require('console');

const app = express();

// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = process.env.DB_URL;

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB)
    .then(() => {
      console.log('Server connected to MongoDB');
    })
}

const db = mongoose.connection.getClient();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* 
  * Using session meddleware, session object is added to every req.
  * session object is added without passport: { user: 'some id' } inside session object
  * passport: { user: 'some id' } is needed by passport to know that the user is already authenticated.
  * If passport: { user: 'some id' } is not inside session object, after making authentication it will be added.
*/
app.use(
  session({
    secret: "I-killed-Mufasa", // It should be more complex than that!!!
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: db  // Get the native MongoDB client from the Mongoose connection
    }),
    cookie: {
      maxAge: 1000 * 1 * 60 * 60, // 1 Hour as max age
    },
  })
);
// * Notice that these middlewares are initialized after the `express-session` middleware.  This is because
// * Passport relies on the `express-session` middleware and must have access to the `req.session` object.
app.use(passport.initialize());
app.use(passport.session());
app.use(ensureAuthenticated);

app.use('/', indexRouter);
app.use('/catalog', catalogRouter);
app.use('/users', userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
