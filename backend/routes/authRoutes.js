// routes/authRoutes.js
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

// Ajout d'un middleware de log pour déboguer les requêtes d'inscription
router.post('/register', (req, res, next) => {
  console.log('Requête d\'inscription reçue:', {
    body: { ...req.body, password: '[MASQUÉ]', passwordConfirm: '[MASQUÉ]' },
    headers: req.headers
  });
  next();
}, registerValidationRules, validationMiddleware, register);

// Routes publiques - Application des règles de validation avant le contrôleur
router.post('/login', loginValidationRules, validationMiddleware, login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidationRules, validationMiddleware, resetPassword);

// Routes protégées (nécessitent une authentification)
router.use(protect); // Applique la protection à toutes les routes suivantes
router.get('/logout', logout);
router.get('/me', getMe);
router.put('/updatedetails', updateProfileValidationRules, validationMiddleware, updateDetails);
router.put('/updatepassword', updatePasswordValidationRules, validationMiddleware, updatePassword);
router.get('/status', getAccountStatus);

// Routes admin seulement
router.put('/unlock/:userId', authorize('admin'), unlockAccount);






module.exports = router;