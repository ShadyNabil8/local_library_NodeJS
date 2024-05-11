const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  // using may be useful in the future if you want to
  // add multiple route handlers to the '/' route path.
  res.send('respond with a resource');
});

module.exports = router;
