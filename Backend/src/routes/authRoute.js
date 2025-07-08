const router = require('express').Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');

router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['customer', 'artist']).withMessage('Invalid role')
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

router.post('/verify-email', [
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('otpCode').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], authController.verifyEmail);

router.post('/resend-otp', [
  body('userId').isInt().withMessage('User ID must be an integer')
], authController.resendOTP);

module.exports = router;