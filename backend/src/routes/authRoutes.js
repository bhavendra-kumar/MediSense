const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);

// Protected routes
router.get('/profile', authMiddleware, authCtrl.getProfile);
router.put('/profile', authMiddleware, authCtrl.updateProfile);
router.post('/change-password', authMiddleware, authCtrl.changePassword);

module.exports = router;
