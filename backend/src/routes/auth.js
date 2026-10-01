import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const router = express.Router();
export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-collaborative-key-2026';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
  '#10b981', '#06b6d4', '#3b82f6', '#f59e0b'
];

export function getRandomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// Authentication Middleware with Guest Fallback
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token === 'null' || token === 'undefined' || token.startsWith('guest_token_')) {
    req.user = {
      id: 'usr_guest_' + Math.floor(1000 + Math.random() * 9000),
      username: 'Guest',
      name: 'Guest Engineer',
      avatarColor: '#38bdf8',
      isGuest: true
    };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = {
        id: 'usr_guest_' + Math.floor(1000 + Math.random() * 9000),
        username: 'Guest',
        name: 'Guest Engineer',
        avatarColor: '#38bdf8',
        isGuest: true
      };
      return next();
    }
    req.user = user;
    next();
  });
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (db.getUserByUsername(username)) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11),
      username: username.trim(),
      name: (name || username).trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      avatarColor: getRandomColor(),
      createdAt: new Date().toISOString()
    };

    db.createUser(newUser);

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        avatarColor: newUser.avatarColor
      }
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.getUserByUsername(username) || db.getUserByEmail(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET CURRENT USER (/api/auth/me)
router.get('/me', authenticateToken, (req, res) => {
  if (req.user.isGuest) {
    return res.json({ user: req.user });
  }
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor
    }
  });
});

export default router;
