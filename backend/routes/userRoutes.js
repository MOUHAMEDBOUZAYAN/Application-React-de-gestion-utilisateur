// routes/userRoutes.js
// Routes pour la gestion des utilisateurs (admin seulement)

const express = require('express');
const { 
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const { protect, authorize } = require('../middlewares/jwtAuth');
const userLogger = require('../middlewares/userLogger');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);
// Toutes les routes nécessitent le rôle admin
router.use(authorize('admin'));

router
  .route('/')
  .get(getUsers)
  .post(userLogger('admin_create_user'), createUser);

router
  .route('/:id')
  .get(getUser)
  .put(userLogger('admin_update_user'), updateUser)
  .delete(userLogger('admin_delete_user'), deleteUser);

module.exports = router;