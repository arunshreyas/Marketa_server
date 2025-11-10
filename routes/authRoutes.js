const express = require("express");
const router = express.Router();
const usersController = require('../controllers/userController');
const passport = require('passport');
const crypto = require('node:crypto');
const User = require('../models/User');

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
    // Redirect to frontend dashboard with token
    const redirectUrl = `https://marketa-ten.vercel.app/dashboard?token=${encodeURIComponent(token)}`;
    return res.redirect(redirectUrl);
  }
);

// Discord OAuth initiates here
router.get('/auth/discord', passport.authenticate('discord', { scope: ['identify', 'email'], session: true }));

// Discord OAuth callback
router.get(
  '/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/auth/discord/failure', session: true }),
  async (req, res) => {
    const user = req.user;
    if (!user) return res.redirect('/auth/discord/failure');

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '30d' }
    );
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await User.updateOne({ _id: user._id }, { $push: { refresh_tokens: hashed } });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 60 * 1000
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    const frontendBase = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production'
      ? 'https://marketa-ten.vercel.app'
      : 'http://localhost:5173');
    const redirectUrl = `${frontendBase}/dashboard?token=${encodeURIComponent(token)}`;
    return res.redirect(redirectUrl);
  }
);

// GitHub OAuth initiates here
router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'], session: true }));

// GitHub OAuth callback (session, but we will issue our JWT here)
router.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/github/failure', session: true }),
  async (req, res) => {
    const user = req.user;
    if (!user) return res.redirect('/auth/github/failure');

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '30d' }
    );
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await User.updateOne({ _id: user._id }, { $push: { refresh_tokens: hashed } });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 60 * 1000
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/auth/refresh',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    const frontendBase = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production'
      ? 'https://marketa-ten.vercel.app'
      : 'http://localhost:5173');
    const redirectUrl = `${frontendBase}/dashboard?token=${encodeURIComponent(token)}`;
    return res.redirect(redirectUrl);
  }
);

// Optional: failure route
router.get('/auth/google/failure', (req, res) => {
  res.status(401).json({ message: 'Google authentication failed' });
});

// Removed refresh/logout routes as part of rollback

module.exports = router;


