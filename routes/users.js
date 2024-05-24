const express = require('express');
const router = express.Router();
// Require controller module.
const user_controller = require("../controllers/userController");

// GET request to authenticate User.
router.get('/register', user_controller.user_register_get);
// POST request to authenticate User.
router.post('/register', user_controller.user_register_post);
// GET request to authorize User.
router.get('/login', user_controller.user_login_get);
// POST request to authorize User.
router.post('/login', user_controller.user_login_post);

module.exports = router;

