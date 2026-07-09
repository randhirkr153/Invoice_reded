const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  refresh, 
  logout, 
  forgotPassword, 
  resetPassword, 
  getMe, 
  updateMe 
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { loginValidator, registerValidator } = require('../validators/validators');
const { authLimiter } = require('../middlewares/rateLimiter');

// Public auth endpoints
router.post('/register', authLimiter, registerValidator, register);
router.post('/login', authLimiter, loginValidator, login);
router.post('/refresh', refresh);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// Protected profile endpoints
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
