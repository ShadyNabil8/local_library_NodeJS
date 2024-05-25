const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require("express-session");
const debug = require("debug")("app");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const { ensureAuthenticated } = require('./controllers/userController');

require('./config/passport');
require('dotenv').config()

const indexRouter = require('./routes/index');
const catalogRouter = require('./routes/catalog');
const userRouter = require('./routes/users');

const compression = require("compression");

const { log } = require('console');

const app = express();

// Set CSP headers to allow our Bootstrap and Jquery to be served
const helmet = require("helmet");
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
    },
  }),
);

// Set up rate limiter: maximum of twenty requests per minute
const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  // The command above limits all requests to 20 per minute
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});
// Apply rate limiter to all requests
app.use(limiter);

// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = process.env.DB_URL;

main().catch((err) => {
  if (err) {
    debug('Error while connecting to DB');
  }
});
async function main() {
  await mongoose.connect(mongoDB)
    .then(() => {
      debug('Server connected to DB');
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
app.use(compression()); // Compress all routes

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
