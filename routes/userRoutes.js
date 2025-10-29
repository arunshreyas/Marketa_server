const express = require("express");
const router = express.Router();
const usersController = require('../controllers/userController');
const verifyJWT = require('../middleware/verifyJWT');

// All routes are under /users
// Public routes
router.post('/', usersController.createUser);           // POST /users (signup)
router.post('/login', usersController.loginUser);       // POST /users/login

// Protected routes
router.get('/', verifyJWT, usersController.getAllUsers);           // GET /users
router.get('/:id', verifyJWT, usersController.getUserById);        // GET /users/:id
router.patch('/:id', verifyJWT, usersController.updateUser);       // PATCH /users/:id
router.delete('/:id', verifyJWT, usersController.deleteUser);      // DELETE /users/:id

module.exports = router;