// routes/authRoutes.js (version corrigée)
// Routes pour l'authentification

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
  unlockAccount
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

// Routes publiques - Application des règles de validation avant le contrôleur
router.post(
  '/register', 
  registerValidationRules, 
  validationMiddleware,
  register
);

router.post(
  '/login', 
  loginValidationRules, 
  validationMiddleware,
  login
);

router.post(
  '/forgotpassword',
  forgotPassword
);

router.put(
  '/resetpassword/:resettoken', 
  resetPasswordValidationRules, 
  validationMiddleware,
  resetPassword
);

// Routes protégées (nécessitent une authentification)
router.use(protect); // Applique la protection à toutes les routes suivantes

router.get(
  '/logout',
  logout
);

router.get('/me', getMe);

router.put(
  '/updatedetails', 
  updateProfileValidationRules, 
  validationMiddleware,
  updateDetails
);

router.put(
  '/updatepassword', 
  updatePasswordValidationRules, 
  validationMiddleware,
  updatePassword
);

router.get('/status', getAccountStatus);

// Routes admin seulement
router.put(
  '/unlock/:userId', 
  authorize('admin'),
  unlockAccount
);

module.exports = router;