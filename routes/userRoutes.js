const express = require("express");
const router = express.Router();
const usersController = require('../controllers/userController');

// All routes are under /users
router.get('/', usersController.getAllUsers);           // GET /users
router.post('/', usersController.createUser);           // POST /users
router.post('/login', usersController.loginUser);       // POST /users/login
router.get('/:id', usersController.getUserById);        // GET /users/:id
router.patch('/:id', usersController.updateUser);       // PATCH /users/:id
router.delete('/:id', usersController.deleteUser);      // DELETE /users/:id

module.exports = router;