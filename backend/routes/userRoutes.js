// routes/userRoutes.js
// Routes pour la gestion des utilisateurs

const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
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

// Protéger toutes les routes et limiter aux administrateurs
router.use(protect);
router.use(authorize('admin'));

// Routes CRUD pour les utilisateurs
router.route('/')
  .get(getUsers)
  .post(registerValidationRules, validationMiddleware, createUser);

router.route('/:id')
  .get(getUser)
  .put(updateProfileValidationRules, validationMiddleware, updateUser)
  .delete(deleteUser);

module.exports = router;