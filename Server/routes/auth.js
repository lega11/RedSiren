// CODE BY OisinMccarthy(LEGA11)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// Create an account. Password is hashed with bcrypt before it ever touches
// the database — MongoDB only ever sees passwordHash.
router.post('/register', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a real email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password needs to be at least 8 characters.' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: 'An account already uses that email. Try logging in.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash });

  res.status(201).json({ token: signToken(user), email: user.email });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const user = await User.findOne({ email });
  // Same error whether the email or the password was wrong, so a login
  // attempt can't be used to discover which emails have accounts.
  if (!user) return res.status(401).json({ error: 'Wrong email or password.' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Wrong email or password.' });

  res.json({ token: signToken(user), email: user.email });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('email');
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  res.json({ email: user.email });
});

module.exports = router;
// CODE BY OisinMccarthy(LEGA11)
