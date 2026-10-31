const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id, role) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return jwt.sign({ id, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'staff' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, email, and password are required.'
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'A user with this email already exists.'
        }
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === 'admin' ? 'admin' : 'staff'
    });

    const token = signToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: messages }
      });
    }
    console.error('[AuthController.register] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred during registration.'
      }
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both email and password are required.'
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    const token = signToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('[AuthController.login] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred during login.'
      }
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('[AuthController.getMe] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred while fetching user profile.'
      }
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
