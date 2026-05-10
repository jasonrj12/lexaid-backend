const express = require('express');
const router  = express.Router();
const { register, registerValidation, login, loginValidation, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/me
router.get('/me', authenticate, me);

module.exports = router;
