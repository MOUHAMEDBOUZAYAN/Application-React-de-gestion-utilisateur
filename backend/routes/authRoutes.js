// routes/authRoutes.js
// Routes pour l'authentification

const express = require('express');
const { 
  register, 
  login, 
  logout, 
  getMe, 
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  verifyPhone,
  resendVerificationEmail,
  resendVerificationSMS
} = require('../controllers/authController');

const { protect } = require('../middlewares/jwtAuth');
const { 
  registerValidationRules, 
  loginValidationRules,
  resetPasswordValidationRules,
  updatePasswordValidationRules,
  phoneVerificationRules,
  validationMiddleware 
} = require('../middlewares/validator');
const userLogger = require('../middlewares/userLogger');

const router = express.Router();

// Routes publiques
router.post('/register', registerValidationRules, validationMiddleware, userLogger('register'), register);
router.post('/login', loginValidationRules, validationMiddleware, userLogger('login'), login);
router.get('/logout', userLogger('logout'), logout);
router.post('/forgotpassword', userLogger('forgot_password'), forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidationRules, validationMiddleware, userLogger('reset_password'), resetPassword);
router.get('/verifyemail/:token', verifyEmail);

// Routes protégées
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePasswordValidationRules, validationMiddleware, userLogger('update_password'), updatePassword);
router.post('/verifyphone', protect, phoneVerificationRules, validationMiddleware, verifyPhone);
router.post('/resendverificationemail', protect, userLogger('resend_verification_email'), resendVerificationEmail);
router.post('/resendverificationsms', protect, userLogger('resend_verification_sms'), resendVerificationSMS);

module.exports = router;