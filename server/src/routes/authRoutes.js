const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public route: Admin & Staff login
router.post('/login', login);

// Protected route: Fetch current user profile
router.get('/me', protect, getMe);

module.exports = router;
