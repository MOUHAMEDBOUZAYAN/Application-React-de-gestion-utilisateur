// routes/authRoutes.js - Mise à jour avec les nouvelles routes
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  getAccountStatus,
  unlockAccount,
  // Nouvelles fonctions pour la vérification
  verifyEmail,
  verifyPhone,
  resendVerificationEmail,
  resendVerificationSMS
} = require('../controllers/authController');
const {
  protect,
  authorize
} = require('../middlewares/jwtAuth');
const {
  registerValidationRules,
  loginValidationRules,
  resetPasswordValidationRules,
  updateProfileValidationRules,
  updatePasswordValidationRules,
  validationMiddleware
} = require('../middlewares/validator');
const logger = require('../middlewares/logger');

// Routes publiques - Application des règles de validation avant le contrôleur
router.post(
  '/register', 
  registerValidationRules, 
  validationMiddleware, 
  logger('register', 'Création d\'un nouveau compte'),
  register
);

router.post(
  '/login', 
  loginValidationRules, 
  validationMiddleware, 
  logger('login', 'Tentative de connexion'),
  login
);

router.post(
  '/forgotpassword', 
  logger('reset_password_request', 'Demande de réinitialisation de mot de passe'),
  forgotPassword
);

router.put(
  '/resetpassword/:resettoken', 
  resetPasswordValidationRules, 
  validationMiddleware, 
  logger('reset_password', 'Réinitialisation du mot de passe'),
  resetPassword
);

// Route de vérification d'email (publique)
router.get(
  '/verifyemail/:token', 
  logger('verify_email', 'Vérification d\'adresse email'),
  verifyEmail
);

// Routes protégées (nécessitent une authentification)
router.use(protect); // Applique la protection à toutes les routes suivantes

router.get(
  '/logout', 
  logger('logout', 'Déconnexion'),
  logout
);

router.get('/me', getMe);

router.put(
  '/updatedetails', 
  updateProfileValidationRules, 
  validationMiddleware, 
  logger('update_profile', 'Mise à jour du profil'),
  updateDetails
);

router.put(
  '/updatepassword', 
  updatePasswordValidationRules, 
  validationMiddleware,
  logger('update_password', 'Mise à jour du mot de passe'), 
  updatePassword
);

router.get('/status', getAccountStatus);

// Nouvelles routes pour la vérification du téléphone
router.post(
  '/verifyphone', 
  logger('verify_phone', 'Vérification du numéro de téléphone'),
  verifyPhone
);

// Routes pour renvoyer les vérifications
router.post(
  '/resendverificationemail',
  logger('resend_verification_email', 'Renvoi du lien de vérification d\'email'), 
  resendVerificationEmail
);

router.post(
  '/resendverificationsms',
  logger('resend_verification_sms', 'Renvoi du code de vérification par SMS'), 
  resendVerificationSMS
);

// Routes admin seulement
router.put(
  '/unlock/:userId', 
  authorize('admin'),
  logger('admin_action', 'Déverrouillage de compte utilisateur'),
  unlockAccount
);

module.exports = router;