const express = require('express');
const router = express.Router();
const { login, verifyToken } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/login — get JWT token
router.post('/login', login);

// GET /api/auth/verify — verify token is still valid
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;
