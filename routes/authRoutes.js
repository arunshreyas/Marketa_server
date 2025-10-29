const express = require("express");
const router = express.Router();
const usersController = require('../controllers/userController');

// Auth endpoints at root paths
router.post('/signup', usersController.createUser);   // POST /signup
router.post('/login', usersController.loginUser);     // POST /login

module.exports = router;


