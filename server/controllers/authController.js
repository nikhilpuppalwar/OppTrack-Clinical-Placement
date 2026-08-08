const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// @POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, collegeName, branch, batch } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required.' });

    const cleanEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) return res.status(400).json({ message: 'Email already registered.' });

    const user = await User.create({
      name,
      email: cleanEmail,
      passwordHash: password,
      collegeName: collegeName || '',
      branch: branch || '',
      batch: batch || '',
    });

    // Create empty profile (upsert if exists)
    await Profile.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id },
      { upsert: true, returnDocument: 'after' }
    );

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      collegeName: user.collegeName,
      branch: user.branch,
      batch: user.batch,
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message || 'Registration failed.' });
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password.' });

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      collegeName: user.collegeName,
      branch: user.branch,
      batch: user.batch,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Login failed.' });
  }
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      collegeName: user.collegeName,
      branch: user.branch,
      batch: user.batch,
      settings: user.settings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe };
