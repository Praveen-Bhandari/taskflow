import jwt from 'jsonwebtoken';
import User from '../models/User.js';


const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res
      .status(400)
      .json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    message: 'Registered successfully',
    data: {
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    },
  });
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid email or password' });
  }

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    },
  });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Current user',
    data: { user: req.user },
  });
};