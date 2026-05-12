const express = require('express');
const router  = express.Router();
const {
  register, registerValidation,
  login, loginValidation,
  me,
  sendOtp, sendOtpValidation,
  verifyOtp, verifyOtpValidation,
  checkPhone,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/auth/check-phone — check if a phone number is already registered
router.post('/check-phone', checkPhone);

// POST /api/auth/send-otp  — generates & sends a 6-digit OTP via SMS
router.post('/send-otp', sendOtpValidation, sendOtp);

// POST /api/auth/verify-otp — validates the submitted OTP
router.post('/verify-otp', verifyOtpValidation, verifyOtp);

// POST /api/auth/register
router.post('/register', 
  upload.fields([{ name: 'id_card', maxCount: 1 }, { name: 'face_photo', maxCount: 1 }]), 
  registerValidation, 
  register
);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/me
router.get('/me', authenticate, me);

module.exports = router;

