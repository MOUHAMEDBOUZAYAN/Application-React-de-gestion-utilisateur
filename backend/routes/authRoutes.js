// routes/authRoutes.js
const express = require('express');
const router = express.Router();

// Import des middlewares d'authentification
const { protect, authorize } = require('../middlewares/jwtAuth');

// Import des contrôleurs
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  getMe,
  updateDetails,
  verifyEmail,
  resendVerificationEmail,
  resendPublicVerificationEmail,
  verifyPhone,
  resendVerificationSMS,
  checkEmailAvailability,
  healthCheck
} = require('../controllers/authController');

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Route de vérification d'email - Modification pour correspondre au frontend
router.get('/verifyemail/:token', verifyEmail);
router.post('/resend-verification-email', protect, resendVerificationEmail);

// Route publique pour renvoyer un email de vérification (sans authentification)
router.post('/public/resendverification', resendPublicVerificationEmail);

// Routes pour la vérification du téléphone
router.post('/verifyphone', protect, verifyPhone);
router.post('/resendverificationsms', protect, resendVerificationSMS);

// Route pour vérifier la disponibilité d'un email
router.post('/check-email', checkEmailAvailability);

// Routes protégées
router.use(protect); // Middleware pour protéger toutes les routes suivantes
router.get('/me', getMe);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);

// Route de vérification de santé du serveur
router.get('/health', healthCheck);

module.exports = router;