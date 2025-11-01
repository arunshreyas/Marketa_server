const express = require("express");
const router = express.Router();
const multer = require('multer');
const usersController = require('../controllers/userController');
const verifyJWT = require('../middleware/verifyJWT');
const uploadProfilePicture = require('../middleware/uploadMiddleware');

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// All routes are under /users
// Public routes
router.post('/', uploadProfilePicture, handleMulterError, usersController.createUser);           // POST /users (signup)
router.post('/login', usersController.loginUser);       // POST /users/login

// Protected routes
router.get('/', verifyJWT, usersController.getAllUsers);           // GET /users
router.get('/me', verifyJWT, usersController.getCurrentUser);     // GET /users/me (get current user from token)

// Profile picture specific routes (must come before /:id routes)
router.post('/:id/profile-picture', verifyJWT, uploadProfilePicture, handleMulterError, usersController.uploadProfilePicture);  // POST /users/:id/profile-picture (upload/update profile picture)
router.delete('/:id/profile-picture', verifyJWT, usersController.deleteProfilePicture);  // DELETE /users/:id/profile-picture (remove profile picture)

// Generic user routes
router.get('/:id', verifyJWT, usersController.getUserById);        // GET /users/:id
router.patch('/:id', verifyJWT, usersController.updateUser);       // PATCH /users/:id (for updating user fields, not profile picture)
router.delete('/:id', verifyJWT, usersController.deleteUser);      // DELETE /users/:id

module.exports = router;