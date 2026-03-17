const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const {
    register, login, logout, refreshToken, getMe,
    updateProfile, changePassword, googleAuth, facebookAuth
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, register);

router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], validate, login);

router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadAvatar, updateProfile);
router.put('/change-password', protect, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
], validate, changePassword);
router.post('/google', googleAuth);
router.post('/facebook', facebookAuth);

module.exports = router;
