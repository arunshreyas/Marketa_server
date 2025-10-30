const express = require("express");
const router = express.Router();
const usersController = require('../controllers/userController');
const passport = require('passport');

// Auth endpoints at root paths
router.post('/signup', usersController.createUser);   // POST /signup
router.post('/login', usersController.loginUser);     // POST /login

// Google OAuth initiates here
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback (session, but we will issue our JWT here)
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/google/failure', session: true }),
  async (req, res) => {
    // On success, create JWT and respond (or redirect with token)
    const user = req.user;
    if (!user) return res.redirect('/auth/google/failure');

    // Reuse the same JWT creation as loginUser
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '30d' }
    );
    // send as JSON or redirect with ?token=...
    res.json({ token, user });
  }
);

// Optional: failure route
router.get('/auth/google/failure', (req, res) => {
  res.status(401).json({ message: 'Google authentication failed' });
});

module.exports = router;


