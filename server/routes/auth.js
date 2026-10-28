const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar } = payload;

    // Find or Create User in MongoDB
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ googleId, email, name, avatar });
    }

    // Issue our own JWT
    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token: authToken, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    console.error('Google Auth error:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.post('/demo', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'demo@mindcare.ai' });
    if (!user) {
      user = await User.create({
        googleId: 'demo-local-user-id',
        email: 'demo@mindcare.ai',
        name: 'Demo Explorer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo'
      });
    }

    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'mindcare-secret-key', { expiresIn: '7d' });
    res.json({ token: authToken, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    console.error('Demo Auth error:', err.message);
    res.status(500).json({ error: 'Demo authentication failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
