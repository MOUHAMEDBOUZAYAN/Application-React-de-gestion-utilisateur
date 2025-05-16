// routes/userRoutes.js
// Routes pour la gestion des utilisateurs

const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserHistory,
  getUserStats
} = require('../controllers/userController');
const {
  protect,
  authorize
} = require('../middlewares/jwtAuth');
const {
  registerValidationRules,
  updateProfileValidationRules,
  validationMiddleware
} = require('../middlewares/validator');
const userLogger = require('../middlewares/userLogger');

// Protéger toutes les routes et limiter aux administrateurs
router.use(protect);
router.use(authorize('admin'));
router.use(userLogger('admin_action')); // Logger toutes les actions admin

// Statistiques utilisateurs
router.get('/stats', getUserStats);

// Routes CRUD pour les utilisateurs
router.route('/')
  .get(getUsers)
  .post(registerValidationRules, validationMiddleware, createUser);

router.route('/:id')
  .get(getUser)
  .put(updateProfileValidationRules, validationMiddleware, updateUser)
  .delete(deleteUser);

// Historique des modifications utilisateur
router.get('/:id/history', getUserHistory);

module.exports = router;