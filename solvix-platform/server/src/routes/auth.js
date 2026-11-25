const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const ADJECTIVES = ['Cipher', 'Neon', 'Quantum', 'Binary', 'Cobalt', 'Solar', 'Vector', 'Shadow'];
const NOUNS = ['Fox', 'Owl', 'Falcon', 'Lynx', 'Wolf', 'Phoenix', 'Viper', 'Sage'];
const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

function generateAlias() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${noun}#${num}`;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const alias = generateAlias();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, anonymous_alias, avatar_color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, anonymous_alias, avatar_color, reputation, created_at`,
      [username.trim(), email.trim().toLowerCase(), passwordHash, alias, color]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, anonymous_alias: user.anonymous_alias }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, anonymous_alias: user.anonymous_alias }, JWT_SECRET, {
      expiresIn: '7d'
    });

    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, anonymous_alias, avatar_color, reputation, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
